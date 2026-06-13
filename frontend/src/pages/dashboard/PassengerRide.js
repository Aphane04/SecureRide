import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import { useAiMonitor } from '../../utils/aiMonitor';
import { 
  Shield, MapPin, Navigation, Search, Info, 
  CreditCard, Ruler, Clock as ClockIcon, LocateFixed, 
  XCircle, Loader2, CheckCircle2, User, Car 
} from 'lucide-react';
import { tripAPI } from '../../utils/api';

const libraries = ['places'];
const center = { lat: -26.2041, lng: 28.0473 };

const parseDistanceKm = (text) => {
  if (!text) return 0;
  const [valueStr, unit] = text.split(' ');
  const value = parseFloat(valueStr.replace(',', '.'));
  if (unit && unit.toLowerCase().startsWith('m')) return value / 1000;
  return value;
};

const parseDurationMinutes = (text) => {
  if (!text) return 0;
  let minutes = 0;
  const hourMatch = text.match(/(\d+)\s*hour/);
  const minMatch = text.match(/(\d+)\s*min/);
  if (hourMatch) minutes += parseInt(hourMatch[1], 10) * 60;
  if (minMatch) minutes += parseInt(minMatch[1], 10);
  return minutes;
};

const PassengerRide = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyA83A7s1BCXBGOXnNAR362CkdeLPKYkGDQ",
    libraries: libraries,
  });

  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [fare, setFare] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [activeTripId, setActiveTripId] = useState(null);
  const [activeTripDetails, setActiveTripDetails] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [driverPos, setDriverPos] = useState(null);

  const originRef = useRef();
  const destinationRef = useRef();
  const alertedTripId = useRef(null);

  const { dangerDetected } = useAiMonitor(activeTripId);

  // 1. RECOVERY: Restore session on refresh
  useEffect(() => {
    const recoverSession = async () => {
      try {
        const res = await tripAPI.getActiveTrip();
        if (res.data && res.data.status !== 'Canceled' && res.data.status !== 'Completed') {
          setActiveTripId(res.data.id);
          if (res.data.status === 'Active') setActiveTripDetails(res.data);
        }
      } catch (err) {}
    };
    recoverSession();
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === "OK" && results[0]) originRef.current.value = results[0].formatted_address;
          setIsLocating(false);
        });
      }, () => setIsLocating(false)
    );
  };

  const resetUI = () => {
    setActiveTripId(null);
    setActiveTripDetails(null);
    setDirectionsResponse(null);
    setBookingMessage('');
    setFare(null);
    setDistance('');
    setDuration('');
    setDriverPos(null);
    if (originRef.current) originRef.current.value = '';
    if (destinationRef.current) destinationRef.current.value = '';
  };

  const handleCancelTrip = async () => {
    if (!activeTripId) return;
    if (!window.confirm("Abort this ride request?")) return;
    try {
      await tripAPI.cancelTrip(activeTripId);
      alertedTripId.current = activeTripId;
      resetUI();
    } catch (err) { alert("Cancellation failed."); }
  };

  async function calculateRoute() {
    if (originRef.current.value === '' || destinationRef.current.value === '') return;
    const directionsService = new window.google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
    setDistanceKm(parseDistanceKm(results.routes[0].legs[0].distance.text));
    setDurationMinutes(parseDurationMinutes(results.routes[0].legs[0].duration.text));

    const estimate = await tripAPI.estimateFare({
      pickup_location: originRef.current.value,
      destination: destinationRef.current.value,
      distance_km: parseDistanceKm(results.routes[0].legs[0].distance.text),
      duration_minutes: parseDurationMinutes(results.routes[0].legs[0].duration.text),
    });
    setFare(estimate.data.estimated_fare);
  }

  const requestRide = async () => {
    if (!fare) return;
    try {
        const response = await tripAPI.bookRide({
          pickup_location: originRef.current.value,
          destination: destinationRef.current.value,
          distance_km: distanceKm,
          duration_minutes: durationMinutes,
          fare: fare,
        });
        setActiveTripId(response.data.id);
        alertedTripId.current = null;
        setBookingMessage('SEARCHING FOR NEARBY DRIVERS...');
    } catch (err) { console.error(err); }
  };

  // 2. POLLING: Detect Driver, Motion, Cancellation, or Completion
  useEffect(() => {
    if (!activeTripId) return;

    const poll = async () => {
      try {
        const res = await tripAPI.getActiveTrip();
        if (res.data) {
          // Detect Cancellation
          if (res.data.status === 'Canceled') {
            if (alertedTripId.current !== res.data.id) {
              alertedTripId.current = res.data.id;
              alert("The driver has canceled. Searching for a new match...");
              resetUI();
            }
            return;
          }

          // Detect Completion (Passenger Notification)
          if (res.data.status === 'Completed') {
              alert("MISSION ACCOMPLISHED: You have reached your destination safely.");
              resetUI();
              return;
          }

          // Update Motion Tracking (Moving the car icon)
          if (res.data.current_lat && res.data.current_lng) {
              setDriverPos({ lat: res.data.current_lat, lng: res.data.current_lng });
          }

          // Set Active Details (Triggers driver info card)
          if (res.data.status === 'Active') {
            setActiveTripDetails(res.data);
            setBookingMessage('DRIVER MATCHED!');
          }
        }
      } catch (err) {
        if (err.response?.status === 404) setBookingMessage('SEARCHING...');
      }
    };

    poll();
    const timer = setInterval(poll, 4000);
    return () => clearInterval(timer);
  }, [activeTripId]);

  // 3. MAP SYNC
  useEffect(() => {
    if (!activeTripDetails || !window.google) return;
    const service = new window.google.maps.DirectionsService();
    service.route({
        origin: activeTripDetails.pickup_location,
        destination: activeTripDetails.destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => { if (status === 'OK') setDirectionsResponse(result); }
    );
  }, [activeTripDetails]);

  if (loadError) return <div className="p-10 text-red-500 font-bold text-center">Map Failure</div>;
  if (!isLoaded) return <div className="h-full w-full bg-white flex items-center justify-center text-black font-black text-xs animate-pulse tracking-widest uppercase">Initializing Secure Terminal...</div>;

  return (
    <div className="h-full bg-white flex flex-col font-sans">
      <div className="h-[52%] relative border-b border-gray-100 text-black">
        <GoogleMap center={center} zoom={15} mapContainerStyle={{ width: '100%', height: '100%' }} options={{ disableDefaultUI: true }}>
          {directionsResponse && <DirectionsRenderer directions={directionsResponse} options={{ polylineOptions: { strokeColor: '#008751', strokeWeight: 6 } }} />}
          {!directionsResponse && <MarkerF position={center} />}
          
          {/* LIVE DRIVER MOTION MARKER */}
          {driverPos && (
              <MarkerF 
                position={driverPos} 
                icon={{
                    url: "https://cdn-icons-png.flaticon.com/512/3202/3202926.png",
                    scaledSize: new window.google.maps.Size(40, 40)
                }}
              />
          )}
        </GoogleMap>

        <div className="absolute top-6 left-6 z-10">
          {activeTripDetails && (
            <div className={`px-5 py-2.5 rounded-full flex items-center gap-3 border shadow-2xl transition-all ${dangerDetected ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-white border-gray-100 text-black'}`}>
              <div className={`w-2 h-2 rounded-full ${dangerDetected ? 'bg-white' : 'bg-[#008751] animate-ping'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {dangerDetected ? 'AI DANGER ALERT' : 'Live Trip Monitored'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="h-[48%] p-8 bg-white overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-4 pb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black tracking-tight flex items-center gap-2 uppercase">
                <Shield className="text-[#008751]" size={24} /> Secure Ride
            </h2>
            <div className="flex items-center gap-3">
                {activeTripId && (
                    <button onClick={handleCancelTrip} className="bg-red-50 text-red-600 border border-red-100 px-4 py-1.5 rounded-full flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                        <XCircle size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Cancel Ride</span>
                    </button>
                )}
                <div className="bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Safety Tier: Gold</span>
                </div>
            </div>
          </div>

          {!activeTripId && (
            <div className="grid md:grid-cols-2 gap-6 mb-8 text-black">
                <div className="flex flex-col relative">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 ml-1">Starting Terminal</label>
                    <MapPin className="absolute left-3 top-9 text-gray-400" size={16} />
                    <Autocomplete className="w-full">
                        <input ref={originRef} placeholder="Pickup Address" className="w-full bg-gray-100 border border-gray-200 p-3 pl-10 pr-10 rounded-xl text-sm focus:border-green-500 focus:bg-white outline-none transition-all" />
                    </Autocomplete>
                    <button onClick={handleUseCurrentLocation} disabled={isLocating} className="absolute right-3 top-8 p-1 hover:bg-gray-200 rounded-md text-[#008751]">
                        <LocateFixed size={18} className={isLocating ? 'animate-spin opacity-50' : ''} />
                    </button>
                </div>
                <div className="flex flex-col relative">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 ml-1">Destination Point</label>
                    <Navigation className="absolute left-3 top-9 text-[#008751]" size={16} />
                    <Autocomplete className="w-full">
                        <input ref={destinationRef} placeholder="Where to?" className="w-full bg-gray-100 border border-gray-200 p-3 pl-10 pr-10 rounded-xl text-sm focus:border-green-500 focus:bg-white outline-none transition-all" />
                    </Autocomplete>
                </div>
            </div>
          )}

          {!activeTripId && (
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <button onClick={calculateRoute} className="flex-1 bg-gray-100 hover:bg-gray-200 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm">Calculate Fare</button>
                <button onClick={requestRide} disabled={!fare} className="flex-1 bg-black hover:bg-[#008751] text-white disabled:opacity-20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95">Request Transport</button>
            </div>
          )}

          {/* DYNAMIC STATUS: SEARCHING OR DRIVER INFORMATION */}
          {activeTripId && (
            <div className="mb-8 p-8 border border-gray-100 rounded-[2.5rem] bg-gray-50 flex flex-col items-center justify-center animate-in fade-in duration-700 text-black">
               {activeTripDetails ? (
                  <div className="w-full flex flex-col items-center text-black">
                    <div className="bg-[#008751]/10 p-4 rounded-full mb-6">
                        <CheckCircle2 size={40} className="text-[#008751]" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-8">Driver Dispatched</h3>
                    
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* DRIVER PROFILE CARD WITH IMAGE */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 flex items-center gap-5 shadow-sm">
                            <div className="w-16 h-16 bg-black rounded-full overflow-hidden border-2 border-[#008751] shadow-lg flex-shrink-0">
                                {activeTripDetails.driver_photo_url ? (
                                    <img src={activeTripDetails.driver_photo_url} className="w-full h-full object-cover" alt="Driver" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white"><User size={24} /></div>
                                )}
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Assigned Pilot</p>
                                <p className="text-sm font-black text-black">{activeTripDetails.driver_name || 'Verified Driver'}</p>
                                <span className="text-[8px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black uppercase mt-1 inline-block">Identity Verified</span>
                            </div>
                        </div>

                        {/* VEHICLE ASSET CARD */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 flex items-center gap-5 shadow-sm">
                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-[#008751]"><Car size={20} /></div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Secure Vehicle</p>
                                <p className="text-sm font-black text-black uppercase leading-tight">
                                    {activeTripDetails.vehicle_model} <br/> 
                                    <span className="text-[#008751]">{activeTripDetails.vehicle_plate}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>
               ) : (
                  <>
                    <Loader2 size={40} className="text-[#008751] animate-spin mb-4" />
                    <p className="text-sm font-black uppercase tracking-tight">Searching for Driver</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-center">Neural Protocol: Linking to local operator network...</p>
                  </>
               )}
            </div>
          )}

          {distance && !activeTripId && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2">
              <ResultCard icon={<Ruler size={14}/>} label="Distance" value={distance} />
              <ResultCard icon={<ClockIcon size={14}/>} label="Duration" value={duration} />
              <ResultCard icon={<CreditCard size={14}/>} label="Payment" value="Cash" />
              <ResultCard icon={<Info size={14}/>} label="Estimated Fare" value={`R ${fare}`} isGreen={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ icon, label, value, isGreen }) => (
    <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-black">
        <div className="flex items-center gap-2 mb-1 text-gray-400">
            {icon}
            <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        <p className={`text-sm font-black ${isGreen ? 'text-[#008751]' : 'text-black'}`}>{value}</p>
    </div>
);

export default PassengerRide;