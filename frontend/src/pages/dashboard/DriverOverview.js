import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { useAiMonitor } from '../../utils/aiMonitor';
import { 
  Car, CheckCircle, Camera, List, Power, ArrowRight, 
  Settings, MapPin, Navigation, ShieldCheck, RefreshCw, XCircle, CheckCircle2
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
  const [currentPos, setCurrentPos] = useState(center);
  
  const alertedTripId = useRef(null);

  // 1. SYNC ACTIVE TRIP & CANCELLATIONS
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
          alertedTripId.current = null;
        }
      } catch (err) {
        if (activeTrip) { setActiveTrip(null); setDirections(null); }
      }
    };
    syncActiveTrip();
    const timer = setInterval(syncActiveTrip, 5000);
    return () => clearInterval(timer);
  }, [activeTrip]);

  // 2. LIVE MOTION TRACKING (Broadcaster Mode)
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'Active') return;

    // Start watching the driver's physical movement
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCurrentPos(newCoords);
        
        // Broadcast location to the database for the passenger to see
        tripAPI.updateLocation(activeTrip.id, latitude, longitude)
          .catch(err => console.error("Tracking sync failed", err));
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeTrip]);

  // 3. FETCH AVAILABLE MISSIONS
  useEffect(() => {
    if (!isOnline) { setRideRequests([]); return; }
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

  // 4. DRAW ROUTE
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

  // NEW: Mission Completion Logic
  const handleFinishTrip = async () => {
    if (!activeTrip) return;
    if (!window.confirm("Have you reached the destination? Confirm to finalize mission.")) return;
    try {
        await tripAPI.completeTrip(activeTrip.id);
        alert("MISSION ACCOMPLISHED: Records synchronized.");
        setActiveTrip(null);
        setDirections(null);
    } catch (err) { alert("Failed to close mission registry."); }
  };

  const submitVehicle = async () => {
    try {
      const formData = new FormData();
      formData.append('make_model', vehicleForm.make_model);
      formData.append('plate_number', vehicleForm.plate_number);
      if (vehiclePhoto) formData.append('photo', vehiclePhoto);
      await vehicleAPI.registerVehicle(formData);
      setShowVehicleForm(false);
      setVehicleForm({ make_model: '', plate_number: '' });
      setVehiclePhoto(null);
      alert('Vehicle Data Secured');
    } catch (err) { setUploadError('Registry sync failed.'); }
  };

  if (loadError) return <div className="p-10 text-red-500 font-bold text-center">Map System Error</div>;
  if (!isLoaded) return <div className="h-full w-full bg-white flex items-center justify-center text-black font-black text-xs uppercase tracking-widest animate-pulse">Initializing Terminal...</div>;

  return (
    <div className="relative h-full bg-[#f3f4f6] overflow-hidden font-sans text-black">
      <div className="absolute inset-0 z-0">
        <GoogleMap center={currentPos} zoom={14} mapContainerStyle={{ width: '100%', height: '100%' }} options={{ disableDefaultUI: true }}>
          {directions ? (
            <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: '#008751', strokeWeight: 6 } }} />
          ) : ( <MarkerF position={currentPos} /> )}
        </GoogleMap>
      </div>

      {/* TOP OVERLAY: Control Bar */}
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
            <button onClick={() => setShowVehicleForm(true)} className="px-5 py-3.5 rounded-2xl bg-white border border-gray-100 text-black shadow-xl hover:bg-gray-50 transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest">
                <Car size={18} />
                <span>Register Vehicle</span>
            </button>
            <div className="p-3.5 rounded-2xl bg-white border border-gray-100 text-[#008751] shadow-xl"><CheckCircle size={20} /></div>
        </div>
      </div>

      {/* ACTIVE MISSION CARD */}
      {activeTrip && activeTrip.status !== 'Canceled' && (
        <div className="absolute top-24 left-6 z-10 animate-in slide-in-from-left-4 duration-500">
           <div className="bg-white border-l-4 border-[#008751] p-6 rounded-[2rem] shadow-2xl flex items-center justify-between gap-10 min-w-[400px] text-black border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl"><Navigation size={22} className="text-[#008751]" /></div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Mission</p>
                        <p className="text-xs font-black leading-tight truncate max-w-[180px]">En Route to Destination</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={handleFinishTrip} className="bg-[#008751] text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-100">
                        <CheckCircle2 size={14}/> Complete
                    </button>
                    <button onClick={handleCancelTrip} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                        <XCircle size={18} />
                    </button>
                </div>
           </div>
        </div>
      )}

      {/* RIDE REQUESTS SIDEBAR */}
      <div className="absolute bottom-8 left-8 right-8 lg:left-auto lg:right-10 lg:w-[450px] z-10 text-black">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="font-black flex items-center gap-3 tracking-tighter text-xl uppercase"><List size={22} className="text-[#008751]"/> Ride Requests</h3>
            {isRefreshing && <RefreshCw size={14} className="animate-spin text-gray-300" />}
          </div>

          {!isOnline ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] px-10 text-center leading-relaxed">Connection Required</p>
            </div>
          ) : activeTrip ? (
            <div className="py-12 text-center bg-gray-50 rounded-[2.5rem] border border-gray-100">
                <ShieldCheck size={40} className="mx-auto text-[#008751] mb-4 opacity-20" />
                <p className="text-black text-xs font-black uppercase tracking-widest leading-none">Mission Underway</p>
                <p className="text-gray-400 text-[9px] font-bold mt-2 uppercase tracking-widest italic">Live Motion Tracking Active</p>
            </div>
          ) : rideRequests.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Searching...</div>
          ) : (
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {rideRequests.map((trip) => (
                <div key={trip.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] hover:shadow-lg transition-all group relative">
                  <div className="flex justify-between items-start mb-6 text-black">
                    <div className="space-y-4 text-black">
                      <div className="flex items-start gap-3 text-gray-400 text-[11px] font-bold">
                        <MapPin size={14} /> <span className="truncate max-w-[200px]">{trip.pickup_location}</span>
                      </div>
                      <div className="flex items-start gap-3 text-black text-xs font-black">
                        <Navigation className="text-[#008751]" size={14} /> <span className="truncate max-w-[200px]">{trip.destination}</span>
                      </div>
                    </div>
                    <span className="text-[#008751] font-black text-2xl tracking-tighter">R{trip.fare}</span>
                  </div>
                  <button onClick={() => acceptRide(trip.id)} className="w-full bg-black text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-[#008751] transition-all shadow-md active:scale-95 uppercase">Accept Mission</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VEHICLE REGISTRY MODAL */}
      {showVehicleForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in zoom-in duration-300">
            <div className="mb-8">
                <h3 className="text-black text-2xl font-black uppercase tracking-tight">Vehicle Registry</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Update active fleet information</p>
            </div>
            
            <div className="space-y-5">
              <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Make & Model</label>
                  <input
                    className="w-full bg-gray-100 p-4 rounded-2xl text-black outline-none border border-gray-200 focus:border-green-500 transition-all text-sm font-bold"
                    placeholder="Toyota Corolla"
                    value={vehicleForm.make_model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make_model: e.target.value })}
                  />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">License Plate</label>
                  <input
                    className="w-full bg-gray-100 p-4 rounded-2xl text-black outline-none border border-gray-200 focus:border-green-500 transition-all text-sm font-bold"
                    placeholder="ABC 123 GP"
                    value={vehicleForm.plate_number}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
                  />
              </div>

              <label className="border-2 border-dashed border-gray-100 bg-gray-50 p-8 rounded-3xl text-center group cursor-pointer hover:border-[#008751] hover:bg-green-50 transition-all block">
                <Camera className="mx-auto mb-3 text-gray-300 group-hover:text-[#008751]" size={32} />
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                  {vehiclePhoto ? vehiclePhoto.name : 'Upload Vehicle Photo'}
                </p>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setVehiclePhoto(e.target.files?.[0] || null)} />
              </label>

              <div className="flex gap-4 mt-8">
                <button onClick={submitVehicle} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#008751] transition-all active:scale-95 shadow-lg">Secure Data</button>
                <button onClick={() => setShowVehicleForm(false)} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverOverview;