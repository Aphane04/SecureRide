import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Car, User, CheckCircle, Camera, List, Power, ArrowRight, Settings } from 'lucide-react';

const DriverDash = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const [isOnline, setIsOnline] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  if (!isLoaded) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0a0a] text-white overflow-hidden">
      
      {/* Sidebar: Status & Settings */}
      <div className="w-full lg:w-80 bg-[#121212] p-8 border-r border-gray-900 flex flex-col gap-10 overflow-y-auto">
        <div className="flex justify-between items-center">
          <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
            <User className="text-gray-400" />
          </div>
          <Settings className="text-gray-600 hover:text-white cursor-pointer" size={20} />
        </div>

        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`w-full py-5 rounded-3xl font-black text-sm tracking-widest flex items-center justify-center gap-3 transition-all ${isOnline ? 'bg-[#008751] shadow-[0_0_30px_rgba(0,135,81,0.2)]' : 'bg-gray-800 text-gray-500'}`}
        >
          <Power size={18} /> {isOnline ? 'ONLINE' : 'GO ONLINE'}
        </button>

        <nav className="space-y-4">
          <div onClick={() => setShowVehicleForm(true)} className="p-4 bg-black rounded-2xl border border-gray-800 flex items-center gap-4 cursor-pointer hover:border-[#008751] transition group">
            <Car className="text-gray-600 group-hover:text-green-500" size={20} />
            <span className="text-sm font-bold">Register Vehicle</span>
          </div>
          <div className="p-4 bg-black rounded-2xl border border-gray-800 flex items-center gap-4">
            <CheckCircle className="text-[#008751]" size={20} />
            <div>
              <p className="text-xs font-bold">Verification</p>
              <p className="text-[10px] text-green-500 uppercase font-black">Active</p>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Map View */}
      <div className="flex-1 relative">
        <GoogleMap
          center={{ lat: -26.2041, lng: 28.0473 }}
          zoom={14}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{ disableDefaultUI: true }}
        >
          <Marker position={{ lat: -26.2041, lng: 28.0473 }} />
        </GoogleMap>

        {/* Requests Modal (Overlay) */}
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
                {/* Mock Trip Request */}
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
      </div>

      {/* Vehicle Registration Modal */}
      {showVehicleForm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50 backdrop-blur-md">
           <div className="bg-[#121212] w-full max-w-lg p-10 rounded-[40px] border border-gray-800 shadow-2xl">
              <h3 className="text-white text-2xl font-black mb-8">Vehicle Details</h3>
              <div className="space-y-4">
                <input className="w-full bg-black p-4 rounded-2xl text-white outline-none border-b border-gray-800 focus:border-green-500" placeholder="Vehicle Make & Model" />
                <input className="w-full bg-black p-4 rounded-2xl text-white outline-none border-b border-gray-800 focus:border-green-500" placeholder="License Plate Number" />
                
                <div className="border-2 border-dashed border-gray-800 p-10 rounded-3xl text-center group cursor-pointer hover:border-[#008751] transition">
                  <Camera className="mx-auto mb-4 text-gray-700 group-hover:text-green-500" size={32} />
                  <p className="text-xs text-gray-500 font-bold uppercase">Upload License & Car Photo</p>
                </div>

                <div className="flex gap-4 mt-8">
                  <button onClick={() => setShowVehicleForm(false)} className="flex-1 bg-[#008751] py-4 rounded-2xl font-bold">Submit</button>
                  <button onClick={() => setShowVehicleForm(false)} className="flex-1 bg-gray-800 py-4 rounded-2xl font-bold">Cancel</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DriverDash;