import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Car, CheckCircle, Camera, List, Power, ArrowRight, Settings } from 'lucide-react';
import { vehicleAPI } from '../../utils/api';

const DriverOverview = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const [isOnline, setIsOnline] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ make_model: '', plate_number: '' });
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [uploadError, setUploadError] = useState('');

  if (!isLoaded) return null;

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
      setUploadError('');
      alert('Vehicle registered');
    } catch (err) {
      setUploadError(err.response?.data?.detail || err.message || 'Failed to upload vehicle.');
    }
  };

  return (
    <div className="relative h-[calc(100vh-64px)]">
      <GoogleMap
        center={{ lat: -26.2041, lng: 28.0473 }}
        zoom={14}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{ disableDefaultUI: true }}
      >
        <Marker position={{ lat: -26.2041, lng: 28.0473 }} />
      </GoogleMap>

      <div className="absolute top-6 left-6 flex items-center gap-4 z-10">
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`px-6 py-3 rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 transition-all ${
            isOnline ? 'bg-[#008751] shadow-[0_0_30px_rgba(0,135,81,0.2)]' : 'bg-[#121212]'
          }`}
        >
          <Power size={16} /> {isOnline ? 'ONLINE' : 'GO ONLINE'}
        </button>
        <button
          onClick={() => setShowVehicleForm(true)}
          className="px-5 py-3 rounded-2xl bg-[#121212] border border-gray-800 flex items-center gap-2 text-xs font-bold"
        >
          <Car size={16} /> Register Vehicle
        </button>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#121212] border border-gray-800">
          <CheckCircle className="text-[#008751]" size={16} />
          <span className="text-[10px] font-black uppercase text-green-500">Verification Active</span>
        </div>
        <Settings className="text-gray-600 hover:text-white cursor-pointer" size={18} />
      </div>

      <div className="absolute bottom-8 left-8 right-8 lg:left-auto lg:right-10 lg:w-[450px]">
        <div className="bg-[#121212]/95 backdrop-blur-2xl p-8 rounded-[40px] border border-gray-800 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-white flex items-center gap-2"><List size={18}/> Ride Requests</h3>
            <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-900 px-3 py-1 rounded-full">3 Nearby</span>
          </div>

          {!isOnline ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-800 rounded-3xl">
              <p className="text-gray-600 text-sm font-bold italic tracking-wide">Connect to see live passenger requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-black p-6 rounded-3xl border border-green-900/10 hover:border-[#008751] transition-all">
                <div className="flex justify-between items-start mb-4">
                   <div>
                     <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Pick up: Rosebank Mall</p>
                     <p className="text-white text-sm font-black">To: OR Tambo Int.</p>
                   </div>
                   <span className="text-[#008751] font-black text-lg">R320.00</span>
                </div>
                <button className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#008751] hover:text-white transition">
                  ACCEPT RIDE <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showVehicleForm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50 backdrop-blur-md">
          <div className="bg-[#121212] w-full max-w-lg p-10 rounded-[40px] border border-gray-800 shadow-2xl">
            <h3 className="text-white text-2xl font-black mb-8">Vehicle Details</h3>
            {uploadError && <div className="text-red-400 text-sm mb-4">{uploadError}</div>}
            <div className="space-y-4">
              <input
                className="w-full bg-black p-4 rounded-2xl text-white outline-none border-b border-gray-800 focus:border-green-500"
                placeholder="Vehicle Make & Model"
                value={vehicleForm.make_model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, make_model: e.target.value })}
              />
              <input
                className="w-full bg-black p-4 rounded-2xl text-white outline-none border-b border-gray-800 focus:border-green-500"
                placeholder="License Plate Number"
                value={vehicleForm.plate_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
              />

              <label className="border-2 border-dashed border-gray-800 p-10 rounded-3xl text-center group cursor-pointer hover:border-[#008751] transition block">
                <Camera className="mx-auto mb-4 text-gray-700 group-hover:text-green-500" size={32} />
                <p className="text-xs text-gray-500 font-bold uppercase">Upload License & Car Photo</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setVehiclePhoto(e.target.files?.[0] || null)}
                />
              </label>

              <div className="flex gap-4 mt-8">
                <button onClick={submitVehicle} className="flex-1 bg-[#008751] py-4 rounded-2xl font-bold">Submit</button>
                <button onClick={() => setShowVehicleForm(false)} className="flex-1 bg-gray-800 py-4 rounded-2xl font-bold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverOverview;