import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { 
  Car, CheckCircle, Camera, List, Power, ArrowRight, 
  Settings, MapPin, Navigation, ShieldCheck, RefreshCw, XCircle, CheckCircle2, AlertTriangle, User
} from 'lucide-react';
import { tripAPI, vehicleAPI, authAPI } from '../../utils/api';

const libraries = ['places'];
const center = { lat: -26.2041, lng: 28.0473 };
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
  const [isUploading, setIsUploading] = useState(false);

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
  }, [isOnline]);

  const validateFileSize = (file) => {
    if (!file) return null;
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
      return `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed: ${sizeMB}MB`;
    }
    return null;
  };

  const validateFileType = (file) => {
    if (!file) return null;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPEG or PNG images only.';
    }
    return null;
  };

  const handlePhotoChange = (e, setPhoto) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const sizeError = validateFileSize(file);
      const typeError = validateFileType(file);
      
      if (sizeError || typeError) {
        setUploadError(sizeError || typeError);
        return;
      }
      setUploadError('');
    }
    setPhoto(file);
  };

  const submitVehicle = async () => {
    if (!vehicleForm.make_model?.trim()) {
      return setUploadError("Please enter vehicle make and model.");
    }
    if (!vehicleForm.plate_number?.trim()) {
      return setUploadError("Please enter license plate number.");
    }
    if (!driverFacePhoto) {
      return setUploadError("Please upload your facial image for biometric verification.");
    }

    // Validate files before submission
    const photoSizeError = vehiclePhoto ? validateFileSize(vehiclePhoto) : null;
    const facePhotoSizeError = validateFileSize(driverFacePhoto);
    const photoTypeError = vehiclePhoto ? validateFileType(vehiclePhoto) : null;
    const facePhotoTypeError = validateFileType(driverFacePhoto);

    if (photoSizeError || facePhotoSizeError || photoTypeError || facePhotoTypeError) {
      setUploadError(photoSizeError || facePhotoSizeError || photoTypeError || facePhotoTypeError);
      return;
    }

    try {
      setIsUploading(true);
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
      alert('Vehicle Data and Biometrics Secured.');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Registry sync failed. Please try again.';
      setUploadError(errorMsg);
      console.error('Vehicle registration error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const acceptRide = async (trip_id) => {
    try {
      await tripAPI.acceptRide(trip_id);
      const tripRes = await tripAPI.getActiveTrip();
      if (tripRes.data) {
        setActiveTrip(tripRes.data);
      }
    } catch (err) { alert("Acceptance failed."); }
  };

  const finalize = async () => {
    try {
      await tripAPI.completeTrip(activeTrip.id);
      setActiveTrip(null);
      setDirections(null);
      alert("Mission Accomplished.");
    } catch (err) { alert("Finalization failed."); }
  };

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2 italic">Driver Dashboard</h1>
          <p className="text-gray-500 text-sm uppercase tracking-widest">Secure Ride Operations</p>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <div>
                <p className="text-xs text-gray-400 uppercase font-black tracking-widest mb-2">ONLINE STATUS</p>
                <button 
                  onClick={() => setIsOnline(!isOnline)}
                  className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                    isOnline ? 'bg-[#008751] text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isOnline ? '✓ Online' : 'Offline'}
                </button>
            </div>
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

        {/* ACTIVE MISSION CARD */}
        {activeTrip && activeTrip.status !== 'Canceled' && (
          <div className="absolute top-24 left-6 z-10 animate-in slide-in-from-left-4 duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 w-96">
              <h4 className="font-black text-sm uppercase mb-4">🚗 Active Mission</h4>
              <p className="text-xs text-gray-600 mb-4"><strong>From:</strong> {activeTrip.pickup_location}</p>
              <p className="text-xs text-gray-600 mb-6"><strong>To:</strong> {activeTrip.destination}</p>
              <button onClick={finalize} className="w-full bg-[#008751] text-white py-2 rounded-lg font-black text-xs uppercase">Complete Mission</button>
            </div>
          </div>
        )}

        {/* Requests List */}
        {isOnline && rideRequests.length > 0 && (
          <div className="mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <h3 className="text-lg font-black uppercase mb-6">Available Missions ({rideRequests.length})</h3>
            <div className="space-y-4">
              {rideRequests.map((trip) => (
                <div key={trip.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-sm font-black mb-2">{trip.pickup_location} → {trip.destination}</p>
                    <p className="text-xs text-gray-500">{trip.distance_km}km • {trip.duration_minutes}min</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[#008751] font-black text-2xl tracking-tighter">R{trip.fare}</span>
                  </div>
                  <button onClick={() => acceptRide(trip.id)} className="w-full bg-black text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-[#008751] transition-all active:scale-95 uppercase">Accept Mission</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VEHICLE MODAL */}
      {showVehicleForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in zoom-in duration-300 text-black">
            <div className="mb-8">
                <h3 className="text-black text-2xl font-black uppercase tracking-tight italic">Vehicle Registry</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Update active fleet and driver information</p>
            </div>
            
            {uploadError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-600 text-[10px] font-black uppercase">{uploadError}</p>
              </div>
            )}
            
            <div className="space-y-5">
              <input 
                className="w-full bg-gray-100 p-4 rounded-2xl text-black border border-gray-100 outline-none focus:border-green-500 font-bold text-sm" 
                placeholder="e.g. Toyota Corolla"
                value={vehicleForm.make_model} 
                onChange={(e) => setVehicleForm({ ...vehicleForm, make_model: e.target.value })} 
                disabled={isUploading}
              />
              <input 
                className="w-full bg-gray-100 p-4 rounded-2xl text-black border border-gray-100 outline-none focus:border-green-500 font-bold text-sm" 
                placeholder="License Plate Number"
                value={vehicleForm.plate_number} 
                onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })} 
                disabled={isUploading}
              />

              {/* GRID FOR DUAL UPLOADS */}
              <div className="grid grid-cols-2 gap-4">
                {/* 1. Vehicle Photo */}
                <label className="border-2 border-dashed border-gray-100 bg-gray-50 p-6 rounded-3xl text-center group cursor-pointer hover:border-[#008751] transition-all block">
                    <Camera className="mx-auto mb-2 text-gray-300" size={24} />
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">{vehiclePhoto ? 'Car Photo OK' : 'Upload Car'}</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handlePhotoChange(e, setVehiclePhoto)}
                      disabled={isUploading}
                    />
                </label>

                {/* 2. Driver Face Photo */}
                <label className="border-2 border-dashed border-gray-100 bg-gray-50 p-6 rounded-3xl text-center group cursor-pointer hover:border-[#008751] transition-all block">
                    <User className="mx-auto mb-2 text-gray-300" size={24} />
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">{driverFacePhoto ? 'Face Photo OK' : 'Upload Face'}</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handlePhotoChange(e, setDriverFacePhoto)}
                      disabled={isUploading}
                    />
                </label>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={submitVehicle} 
                  disabled={isUploading}
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#008751] transition-all active:scale-95 shadow-lg disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Secure Registry'}
                </button>
                <button 
                  onClick={() => {
                    setShowVehicleForm(false);
                    setUploadError('');
                  }}
                  disabled={isUploading}
                  className="flex-1 bg-gray-200 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverOverview;
