import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { 
  Car, CheckCircle, Camera, List, Power, ArrowRight, 
  Settings, MapPin, Navigation, ShieldCheck, RefreshCw, XCircle, CheckCircle2, AlertTriangle, User
} from 'lucide-react';
import { tripAPI, vehicleAPI, authAPI } from '../../utils/api';

const libraries = ['places'];
const center = { lat: -26.2041, lng: 28.0473 };

const DriverOverview = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyA83A7s1BCXBGOXnNAR362CkdeLPKYkGDQ",
    libraries: libraries,
  });

  const [isOnline, setIsOnline] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ make_model: '', plate_number: '' });
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [driverFacePhoto, setDriverFacePhoto] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const [rideRequests, setRideRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [directions, setDirections] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPos, setCurrentPos] = useState(center);
  
  const alertedTripId = useRef(null);

  useEffect(() => {
    const initSync = async () => {
      try {
        const profileRes = await authAPI.getProfile();
        if (profileRes.data.has_vehicle) {
          setHasVehicle(true);
        }
        const tripRes = await tripAPI.getActiveTrip();
        if (tripRes.data) {
          setActiveTrip(tripRes.data);
        }
      } catch (err) {
        console.log("Initial sync: No active session found.");
      }
    };
    initSync();
  }, []);

  useEffect(() => {
    const syncCancellations = async () => {
      try {
        const res = await tripAPI.getActiveTrip();
        if (res.data && res.data.status === 'Canceled') {
          if (alertedTripId.current !== res.data.id) {
            alertedTripId.current = res.data.id;
            alert("MISSION ABORTED: The passenger has canceled.");
            setActiveTrip(null);
            setDirections(null);
          }
        }
      } catch (err) {}
    };
    const timer = setInterval(syncCancellations, 5000);
    return () => clearInterval(timer);
  }, [activeTrip]);

  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'Active') return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentPos({ lat: latitude, lng: longitude });
        tripAPI.updateLocation(activeTrip.id, latitude, longitude).catch(() => {});
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeTrip]);

  useEffect(() => {
    if (!isOnline) { setRideRequests([]); return; }
    const loadRequests = async () => {
      try {
        setIsRefreshing(true);
        const res = await tripAPI.getRideRequests();
        setRideRequests(res.data);
      } catch (err) {
        console.error("Sync Error:", err);
      } finally { setIsRefreshing(false); }
    };
    loadRequests();
    const timer = setInterval(loadRequests, 5000);
    return () => clearInterval(timer);
  }, [isOnline]);

  useEffect(() => {
    if (!activeTrip || !window.google || activeTrip.status === 'Canceled' || activeTrip.status === 'Completed') {
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

  const handleToggleOnline = () => {
    if (!hasVehicle) {
      alert("REGISTRATION REQUIRED: Please register your vehicle details before entering the network.");
      setShowVehicleForm(true);
      return;
    }
    setIsOnline(!isOnline);
  };

  const acceptRide = async (tripId) => {
    try {
      const res = await tripAPI.acceptRide(tripId);
      setActiveTrip(res.data);
      setRideRequests((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) { alert('Mission already claimed.'); }
  };

  const handleFinishTrip = async () => {
    if (!window.confirm("Confirm destination reached?")) return;
    try {
      await tripAPI.completeTrip(activeTrip.id);
      setActiveTrip(null);
      setDirections(null);
      alert("Mission Accomplished.");
    } catch (err) { alert("Finalization failed."); }
  };

  // FIXED: Added the missing handleCancelTrip function to prevent blank screen crash
  const handleCancelTrip = async () => {
    if (!activeTrip) return;
    if (!window.confirm("Are you sure you want to cancel this mission?")) return;
    try {
      await tripAPI.cancelTrip(activeTrip.id);
      setActiveTrip(null);
      setDirections(null);
      alert("Mission Canceled.");
    } catch (err) {
      alert("Cancellation failed.");
    }
  };

  const submitVehicle = async () => {
    if (!vehicleForm.make_model || !vehicleForm.plate_number) {
      return alert("Please fill in vehicle details.");
    }
    if (!driverFacePhoto && !hasVehicle) {
      return alert("Please upload your facial image for biometric verification.");
    }

    try {
      setUploadError('');
      const formData = new FormData();
      formData.append('make_model', vehicleForm.make_model);
      formData.append('plate_number', vehicleForm.plate_number);
      if (vehiclePhoto) formData.append('photo', vehiclePhoto);
      if (driverFacePhoto) formData.append('driver_photo', driverFacePhoto);
      
      await vehicleAPI.registerVehicle(formData);
      
      setHasVehicle(true); 
      setShowVehicleForm(false);
      setVehicleForm({ make_model: '', plate_number: '' });
      setVehiclePhoto(null);
      setDriverFacePhoto(null);
      alert('Vehicle Registry and Biometrics Secured.');
      window.location.reload();
    } catch (err) { 
      const errorMessage = err.response?.data?.detail || 
                          (err.response?.status === 413 ? "File is too large for the server (Max 5MB)." : "Registry sync failed.");
      setUploadError(errorMessage); 
    }
  };

  if (loadError) return <div className="p-10 text-red-500 font-bold text-center">Map Failure</div>;
  if (!isLoaded) return <div className="h-full w-full bg-white flex items-center justify-center text-black font-black text-xs uppercase animate-pulse">Initializing...</div>;

  return (
    <div className="relative h-full bg-[#f3f4f6] overflow-hidden font-sans text-black">
      <div className="absolute inset-0 z-0">
        <GoogleMap center={currentPos} zoom={14} mapContainerStyle={{ width: '100%', height: '100%' }} options={{ disableDefaultUI: true }}>
          <MarkerF position={currentPos} />
          {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: '#008751', strokeWeight: 5 } }} />}
        </GoogleMap>
      </div>

      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
            <button onClick={handleToggleOnline} className={`px-8 py-3.5 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all duration-300 shadow-2xl ${isOnline ? 'bg-[#008751] text-white shadow-[0_0_30px_rgba(0,135,81,0.3)]' : 'bg-white border border-gray-100 text-gray-500'}`}>
                <Power size={16} /> {isOnline ? 'NETWORK ONLINE' : 'GO ONLINE'}
            </button>
            {!hasVehicle && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl border border-red-100 flex items-center gap-2 shadow-xl animate-pulse">
                <AlertTriangle size={14} />
                <span className="text-[9px] font-black uppercase">Registry Missing</span>
              </div>
            )}
        </div>
        <div className="flex items-center gap-3">
            {!hasVehicle && (
                <button onClick={() => setShowVehicleForm(true)} className="px-5 py-3.5 rounded-2xl bg-black text-white shadow-xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all">
                    <Car size={18} />
                    <span>Register Vehicle</span>
                </button>
            )}
            <div className={`p-3.5 rounded-2xl bg-white border border-gray-100 shadow-xl transition-all ${hasVehicle ? 'text-[#008751]' : 'text-gray-300'}`}>
                <CheckCircle size={20} />
            </div>
        </div>
      </div>

      {activeTrip && activeTrip.status === 'Active' && (
        <div className="absolute top-24 left-6 z-10 animate-in slide-in-from-left-4 duration-500">
           <div className="bg-white border-l-4 border-[#008751] p-6 rounded-[2rem] shadow-2xl flex items-center justify-between gap-10 min-w-[380px] border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl"><Navigation size={22} className="text-[#008751]" /></div>
                    <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p><p className="text-xs font-black leading-tight">En Route</p></div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleFinishTrip} className="bg-[#008751] text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase hover:bg-green-700 shadow-lg">Complete</button>
                    <button onClick={handleCancelTrip} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><XCircle size={18} /></button>
                </div>
           </div>
        </div>
      )}

      <div className="absolute bottom-8 left-8 right-8 lg:left-auto lg:right-10 lg:w-[450px] z-10">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="font-black text-black flex items-center gap-3 tracking-tighter text-xl uppercase"><List size={22} className="text-[#008751]"/> Ride Requests</h3>
            {isRefreshing && <RefreshCw size={14} className="animate-spin text-gray-300" />}
          </div>
          {!hasVehicle ? (
            <div className="py-12 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 px-10">
                <Car size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-black text-xs font-black uppercase tracking-widest">Unauthorized Access</p>
                <p className="text-gray-400 text-[10px] mt-2 font-bold uppercase text-center">You must register your vehicle photo and facial image before you can see nearby passenger requests.</p>
            </div>
          ) : !isOnline ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] px-6">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] text-center">Connect to Network to start receiving passenger missions</p>
            </div>
          ) : activeTrip ? (
            <div className="py-12 text-center bg-green-50 rounded-[2.5rem] px-6">
               <ShieldCheck size={40} className="mx-auto text-[#008751] mb-4" />
               <p className="text-[#008751] text-[10px] font-black uppercase tracking-widest">Active Mission in Progress</p>
               <p className="text-gray-500 text-[9px] mt-2 font-bold uppercase">Follow the GPS coordinates to the destination.</p>
            </div>
          ) : rideRequests.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Searching...</div>
          ) : (
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {rideRequests.map((trip) => (
                <div key={trip.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] hover:shadow-lg transition-all group relative text-black">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 text-gray-400 text-[11px] font-bold"><MapPin size={14} /> <span className="truncate max-w-[200px]">{trip.pickup_location}</span></div>
                      <div className="flex items-start gap-3 text-black text-xs font-black"><Navigation className="text-[#008751]" size={14} /> <span className="truncate max-w-[200px]">{trip.destination}</span></div>
                    </div>
                    <span className="text-[#008751] font-black text-2xl tracking-tighter">R{trip.fare}</span>
                  </div>
                  <button onClick={() => acceptRide(trip.id)} className="w-full bg-black text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-[#008751] transition-all active:scale-95 uppercase">Accept Mission</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showVehicleForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in zoom-in duration-300 text-black">
            <div className="mb-8">
                <h3 className="text-black text-2xl font-black uppercase tracking-tight italic">Vehicle Registry</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Update active fleet and driver information</p>
            </div>
            {uploadError && <div className="text-red-500 text-[10px] font-black uppercase mb-4">{uploadError}</div>}
            <div className="space-y-5">
              <input className="w-full bg-gray-100 p-4 rounded-2xl text-black border border-gray-100 outline-none focus:border-green-500 font-bold text-sm" placeholder="e.g. Toyota Corolla"
                value={vehicleForm.make_model} onChange={(e) => setVehicleForm({ ...vehicleForm, make_model: e.target.value })} />
              <input className="w-full bg-gray-100 p-4 rounded-2xl text-black border border-gray-100 outline-none focus:border-green-500 font-bold text-sm" placeholder="License Plate Number"
                value={vehicleForm.plate_number} onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })} />

              <div className="grid grid-cols-2 gap-4">
                <label className="border-2 border-dashed border-gray-100 bg-gray-50 p-6 rounded-3xl text-center group cursor-pointer hover:border-[#008751] transition-all block">
                    <Camera className="mx-auto mb-2 text-gray-300" size={24} />
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">{vehiclePhoto ? 'Car Photo OK' : 'Upload Car'}</p>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setVehiclePhoto(e.target.files?.[0] || null)} />
                </label>
                <label className="border-2 border-dashed border-gray-100 bg-gray-50 p-6 rounded-3xl text-center group cursor-pointer hover:border-[#008751] transition-all block">
                    <User className="mx-auto mb-2 text-gray-300" size={24} />
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">{driverFacePhoto ? 'Face Photo OK' : 'Upload Face'}</p>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setDriverFacePhoto(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={submitVehicle} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#008751] transition-all active:scale-95 shadow-lg">Secure Registry</button>
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