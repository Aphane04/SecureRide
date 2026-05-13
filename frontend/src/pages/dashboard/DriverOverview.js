import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { 
  Car, CheckCircle, Camera, List, Power, ArrowRight, 
  Settings, MapPin, Navigation, ShieldCheck, RefreshCw, XCircle 
} from 'lucide-react';
import { tripAPI, vehicleAPI } from '../../utils/api';

const libraries = ['places'];
const center = { lat: -26.2041, lng: 28.0473 };

const DriverOverview = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyA83A7s1BCXBGOXnNAR362CkdeLPKYkGDQ",
    libraries: libraries,
  });

  const [isOnline, setIsOnline] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ make_model: '', plate_number: '' });
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [rideRequests, setRideRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [directions, setDirections] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const alertedTripId = useRef(null); // FIX: Prevents repeated alerts

  useEffect(() => {
    const syncActiveTrip = async () => {
      try {
        const res = await tripAPI.getActiveTrip();
        if (res.data) {
          if (res.data.status === 'Canceled') {
            if (alertedTripId.current !== res.data.id) {
                alertedTripId.current = res.data.id;
                alert("MISSION ABORTED: The passenger has canceled this request.");
                setActiveTrip(null);
                setDirections(null);
            }
            return;
          }
          setActiveTrip(res.data);
          alertedTripId.current = null; // Clear if trip is Active
        }
      } catch (err) {
        if (activeTrip) {
            setActiveTrip(null);
            setDirections(null);
        }
      }
    };
    syncActiveTrip();
    const timer = setInterval(syncActiveTrip, 5000);
    return () => clearInterval(timer);
  }, [activeTrip]);

  useEffect(() => {
    if (!isOnline) {
      setRideRequests([]);
      return;
    }
    const loadRequests = async () => {
      try {
        setIsRefreshing(true);
        const res = await tripAPI.getRideRequests();
        setRideRequests(res.data);
      } catch (err) {} finally { setIsRefreshing(false); }
    };
    loadRequests();
    const timer = setInterval(loadRequests, 5000);
    return () => clearInterval(timer);
  }, [isOnline]);

  useEffect(() => {
    if (!activeTrip || !window.google || activeTrip.status === 'Canceled') {
      setDirections(null);
      return;
    }
    const service = new window.google.maps.DirectionsService();
    service.route({
        origin: activeTrip.pickup_location,
        destination: activeTrip.destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => { if (status === 'OK') setDirections(result); }
    );
  }, [activeTrip]);

  const acceptRide = async (tripId) => {
    try {
      const res = await tripAPI.acceptRide(tripId);
      setActiveTrip(res.data);
      alertedTripId.current = null;
      setRideRequests((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) { alert('Mission already claimed.'); }
  };

  const handleCancelTrip = async () => {
    if (!activeTrip) return;
    if (!window.confirm("Abort current mission?")) return;
    try {
      await tripAPI.cancelTrip(activeTrip.id);
      alertedTripId.current = activeTrip.id;
      setActiveTrip(null);
      setDirections(null);
    } catch (err) { alert("Error processing cancellation."); }
  };

  const submitVehicle = async () => {
    try {
      const formData = new FormData();
      formData.append('make_model', vehicleForm.make_model);
      formData.append('plate_number', vehicleForm.plate_number);
      if (vehiclePhoto) formData.append('photo', vehiclePhoto);
      await vehicleAPI.registerVehicle(formData);
      setShowVehicleForm(false);
      alert('Vehicle Data Secured');
    } catch (err) { setUploadError('Registry sync failed.'); }
  };

  if (loadError) return <div className="p-10 text-red-500 font-bold">Map System Error</div>;
  if (!isLoaded) return <div className="h-full w-full bg-white flex items-center justify-center text-black font-black text-xs uppercase tracking-widest animate-pulse">Initializing...</div>;

  return (
    <div className="relative h-full bg-[#f3f4f6] overflow-hidden font-sans text-black">
      <div className="absolute inset-0 z-0">
        <GoogleMap center={center} zoom={14} mapContainerStyle={{ width: '100%', height: '100%' }} options={{ disableDefaultUI: true }}>
          {directions ? (
            <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: '#008751', strokeWeight: 6 } }} />
          ) : ( <MarkerF position={center} /> )}
        </GoogleMap>
      </div>

      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
            <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-8 py-3.5 rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center gap-3 transition-all duration-300 shadow-2xl ${
                isOnline ? 'bg-[#008751] text-white shadow-[0_0_30px_rgba(0,135,81,0.3)]' : 'bg-white border border-gray-100 text-gray-500'
            }`}
            >
            <Power size={16} /> {isOnline ? 'NETWORK ONLINE' : 'GO ONLINE'}
            </button>
            <div className="hidden md:flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-gray-100 shadow-xl text-black">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-ping' : 'bg-gray-300'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Scanning' : 'Offline'}</span>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => setShowVehicleForm(true)} className="p-3.5 rounded-2xl bg-white border border-gray-100 text-black shadow-xl hover:bg-gray-50 transition-colors"><Car size={20} /></button>
            <div className="p-3.5 rounded-2xl bg-white border border-gray-100 text-[#008751] shadow-xl"><CheckCircle size={20} /></div>
        </div>
      </div>

      {activeTrip && activeTrip.status !== 'Canceled' && (
        <div className="absolute top-24 left-6 z-10 animate-in slide-in-from-left-4 duration-500">
           <div className="bg-white border-l-4 border-[#008751] p-5 rounded-2xl shadow-2xl flex items-center justify-between gap-6 min-w-[320px] text-black">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl"><Navigation size={20} className="text-[#008751]" /></div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Mission</p>
                        <p className="text-xs font-black leading-tight truncate max-w-[150px]">En Route to Pickup</p>
                    </div>
                </div>
                <button onClick={handleCancelTrip} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors flex flex-col items-center gap-1">
                  <XCircle size={20} />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Cancel</span>
                </button>
           </div>
        </div>
      )}

      <div className="absolute bottom-8 left-8 right-8 lg:left-auto lg:right-10 lg:w-[450px] z-10 text-black">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="font-black flex items-center gap-3 tracking-tighter text-xl uppercase"><List size={22} className="text-[#008751]"/> Ride Requests</h3>
            {isRefreshing && <RefreshCw size={14} className="animate-spin text-gray-300" />}
          </div>

          {!isOnline ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] px-10 text-center">Connection Required</p>
            </div>
          ) : activeTrip ? (
            <div className="py-12 text-center bg-gray-50 rounded-[2.5rem] border border-gray-100">
                <ShieldCheck size={40} className="mx-auto text-[#008751] mb-4 opacity-20" />
                <p className="text-black text-xs font-black uppercase tracking-widest leading-none">Mission Underway</p>
            </div>
          ) : rideRequests.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Searching...</div>
          ) : (
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {rideRequests.map((trip) => (
                <div key={trip.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] hover:shadow-lg transition-all group relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 text-gray-400 text-[11px] font-bold">
                        <MapPin size={14} /> <span className="truncate max-w-[200px]">{trip.pickup_location}</span>
                      </div>
                      <div className="flex items-start gap-3 text-black text-xs font-black">
                        <Navigation className="text-[#008751]" size={14} /> <span className="truncate max-w-[200px]">{trip.destination}</span>
                      </div>
                    </div>
                    <span className="text-[#008751] font-black text-2xl tracking-tighter">R{trip.fare}</span>
                  </div>
                  <button onClick={() => acceptRide(trip.id)} className="w-full bg-black text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-[#008751] transition-all shadow-md">ACCEPT MISSION</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverOverview;