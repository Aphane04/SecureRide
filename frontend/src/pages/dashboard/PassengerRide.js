import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import { useAiMonitor } from '../../utils/aiMonitor';
import { 
  Shield, MapPin, Navigation, Search, Info, 
  CreditCard, Ruler, Clock as ClockIcon, LocateFixed, XCircle 
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

  const originRef = useRef();
  const destinationRef = useRef();

  const { dangerDetected } = useAiMonitor(activeTripId);

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

  const handleCancelTrip = async () => {
    if (!activeTripId) return;
    if (!window.confirm("Do you want to stop this ride request?")) return;

    try {
      await tripAPI.cancelTrip(activeTripId);
      setActiveTripId(null);
      setActiveTripDetails(null);
      setDirectionsResponse(null);
      setBookingMessage('Trip Canceled.');
      setFare(null);
      setDistance('');
      setDuration('');
      if (originRef.current) originRef.current.value = '';
      if (destinationRef.current) destinationRef.current.value = '';
    } catch (err) {
      alert("Failed to cancel trip. It may already be accepted.");
    }
  };

  async function calculateRoute() {
    if (originRef.current.value === '' || destinationRef.current.value === '') return;
    const directionsService = new window.google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });

    const distText = results.routes[0].legs[0].distance.text;
    const durText = results.routes[0].legs[0].duration.text;

    setDirectionsResponse(results);
    setDistance(distText);
    setDuration(durText);

    const km = parseDistanceKm(distText);
    const mins = parseDurationMinutes(durText);
    setDistanceKm(km);
    setDurationMinutes(mins);

    const estimate = await tripAPI.estimateFare({
      pickup_location: originRef.current.value,
      destination: destinationRef.current.value,
      distance_km: km,
      duration_minutes: mins,
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
        setBookingMessage('Request Sent. Waiting for Driver...');
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!activeTripId) return;
    const poll = async () => {
      try {
        const res = await tripAPI.getActiveTrip();
        setActiveTripDetails(res.data);
        setBookingMessage('Driver Match Confirmed');
      } catch (err) {}
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [activeTripId]);

  useEffect(() => {
    if (!activeTripDetails || directionsResponse || !window.google) return;
    const service = new window.google.maps.DirectionsService();
    service.route({
        origin: activeTripDetails.pickup_location,
        destination: activeTripDetails.destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => { if (status === 'OK') setDirectionsResponse(result); }
    );
  }, [activeTripDetails, directionsResponse]);

  if (loadError) return <div className="p-10 text-red-500 font-bold">Map System Error</div>;
  if (!isLoaded) return <div className="h-full w-full bg-white flex items-center justify-center text-black font-black text-xs uppercase tracking-widest animate-pulse">Initializing Secure Maps...</div>;

  const inputClass = "w-full bg-gray-100 border border-gray-200 text-black p-3 pl-10 pr-10 rounded-xl text-sm focus:border-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-400";
  const labelClass = "text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 ml-1";

  return (
    <div className="h-full bg-white flex flex-col font-sans">
      
      {/* Map Section */}
      <div className="h-[52%] relative border-b border-gray-100">
        <GoogleMap center={center} zoom={15} mapContainerStyle={{ width: '100%', height: '100%' }} options={{ disableDefaultUI: true }}>
          {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
          {!directionsResponse && <MarkerF position={center} />}
        </GoogleMap>

        <div className="absolute top-6 left-6 z-10">
          {activeTripDetails && (
            <div className={`px-5 py-2.5 rounded-full flex items-center gap-3 border shadow-2xl transition-all ${dangerDetected ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-white border-gray-100 text-black'}`}>
              <div className={`w-2 h-2 rounded-full ${dangerDetected ? 'bg-white' : 'bg-[#008751] animate-ping'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {dangerDetected ? 'AI DANGER ALERT - CONTACTING LAW' : 'Live Trip Monitored'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="h-[48%] p-8 bg-white overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
                <Shield className="text-[#008751]" size={24} /> REQUEST RIDE
            </h2>
            
            <div className="flex items-center gap-3">
                {/* CANCEL BUTTON: Functional and matching the white theme */}
                {activeTripId && (
                    <button 
                        onClick={handleCancelTrip}
                        className="bg-red-50 text-red-600 border border-red-100 px-4 py-1.5 rounded-full flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all group"
                    >
                        <XCircle size={14} className="group-hover:rotate-90 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Cancel Trip</span>
                    </button>
                )}
                <div className="bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Safety Tier: Gold</span>
                </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col">
              <label className={labelClass}>Starting Terminal</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                <Autocomplete className="w-full">
                  <input ref={originRef} placeholder="Pickup Address" className={inputClass} />
                </Autocomplete>
                <button onClick={handleUseCurrentLocation} disabled={isLocating} className="absolute right-3 top-2.5 p-1 hover:bg-gray-200 rounded-md text-[#008751]">
                  <LocateFixed size={18} className={isLocating ? 'animate-spin opacity-50' : ''} />
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Destination Point</label>
              <div className="relative">
                <Navigation className="absolute left-3 top-3.5 text-[#008751]" size={16} />
                <Autocomplete className="w-full">
                  <input ref={destinationRef} placeholder="Where to?" className={inputClass} />
                </Autocomplete>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <button onClick={calculateRoute} className="flex-1 bg-gray-100 hover:bg-gray-200 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Calculate Fare
            </button>
            <button onClick={requestRide} disabled={!fare || activeTripId} className="flex-1 bg-black hover:bg-[#008751] text-white disabled:opacity-20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95">
              Request Transport
            </button>
          </div>

          {distance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2">
              <ResultCard icon={<Ruler size={14}/>} label="Distance" value={distance} />
              <ResultCard icon={<ClockIcon size={14}/>} label="Duration" value={duration} />
              <ResultCard icon={<CreditCard size={14}/>} label="Payment" value="Cash" />
              <ResultCard icon={<Info size={14}/>} label="Estimated Fare" value={`R ${fare}`} isGreen={true} />
            </div>
          )}

          {bookingMessage && (
            <div className="mt-8 text-center border-t border-gray-50 pt-6">
                <p className="text-[10px] font-black text-[#008751] uppercase tracking-[0.3em] animate-pulse">
                    {bookingMessage}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ icon, label, value, isGreen }) => (
    <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-1 text-gray-400">
            {icon}
            <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        <p className={`text-sm font-black ${isGreen ? 'text-[#008751]' : 'text-black'}`}>{value}</p>
    </div>
);

export default PassengerRide;