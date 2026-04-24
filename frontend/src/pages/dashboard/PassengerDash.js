import React, { useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { useAiMonitor } from '../../utils/aiMonitor';
import { Shield, MapPin, Navigation, Phone, History, Bell, Search, Clock } from 'lucide-react';

const center = { lat: -26.2041, lng: 28.0473 }; // Default Johannesburg

const PassengerDash = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [activeTrip, setActiveTrip] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const originRef = useRef();
  const destinationRef = useRef();

  // AI Monitor Hook - listens for danger words once activeTrip is set
  const { dangerDetected } = useAiMonitor(activeTrip);

  async function calculateRoute() {
    if (originRef.current.value === '' || destinationRef.current.value === '') return;
    
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
    // Mocking an active trip start
    setActiveTrip(101); 
  }

  if (!isLoaded) return <div className="bg-black h-screen flex items-center justify-center text-green-500">Initializing Maps...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0a0a] text-white overflow-hidden">
      
      {/* Sidebar Area */}
      <div className="w-full lg:w-[400px] p-6 bg-[#121212] border-r border-gray-900 flex flex-col gap-6 z-20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-[#008751]" size={20} /> SecureRide
          </h2>
          <Bell className="text-gray-500 cursor-pointer" size={20} />
        </div>

        {/* Booking Card */}
        <div className="bg-black p-6 rounded-3xl border border-gray-800 shadow-2xl">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Request a Ride</p>
          <div className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-gray-600" size={16} />
              <Autocomplete className="w-full">
                <input ref={originRef} placeholder="Pickup Location" className="w-full bg-[#121212] border-none p-3 pl-10 rounded-xl text-sm focus:ring-1 focus:ring-green-500 outline-none" />
              </Autocomplete>
            </div>
            <div className="relative">
              <Navigation className="absolute left-3 top-3.5 text-green-600" size={16} />
              <Autocomplete className="w-full">
                <input ref={destinationRef} placeholder="Where to?" className="w-full bg-[#121212] border-none p-3 pl-10 rounded-xl text-sm focus:ring-1 focus:ring-green-500 outline-none" />
              </Autocomplete>
            </div>
            <button onClick={calculateRoute} className="w-full bg-[#008751] hover:bg-green-700 py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2">
              <Search size={18}/> Find Secure Ride
            </button>
          </div>

          {distance && (
            <div className="mt-6 pt-6 border-t border-gray-900 flex justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400"><Clock size={14}/> {duration}</div>
              <div className="text-sm font-bold text-green-500 underline">{distance}</div>
            </div>
          )}
        </div>

        {/* Info Tabs */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-[#1a1a1a] p-4 rounded-2xl text-center border border-transparent hover:border-gray-700 transition">
            <Phone size={20} className="mx-auto mb-2 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Emergency</span>
          </button>
          <button onClick={() => setShowHistory(!showHistory)} className="bg-[#1a1a1a] p-4 rounded-2xl text-center border border-transparent hover:border-gray-700 transition">
            <History size={20} className="mx-auto mb-2 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">History</span>
          </button>
        </div>

        {showHistory && (
          <div className="bg-black/50 p-4 rounded-2xl border border-gray-900">
             <p className="text-[10px] text-gray-600 mb-2 font-bold">RECENT TRIPS</p>
             <div className="text-xs text-gray-500 italic">No trip history found.</div>
          </div>
        )}
      </div>

      {/* Map View */}
      <div className="flex-1 relative">
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{ disableDefaultUI: true }}
          onLoad={(map) => setMap(map)}
        >
          {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
          {!directionsResponse && <Marker position={center} />}
        </GoogleMap>

        {/* AI Monitoring Overlay */}
        <div className="absolute top-8 left-8 z-10 flex flex-col gap-4">
          {activeTrip && (
            <div className={`px-6 py-3 rounded-full flex items-center gap-3 border shadow-2xl transition-all ${dangerDetected ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-green-900/40 border-green-500/50 backdrop-blur-md'}`}>
              <div className={`w-2 h-2 rounded-full ${dangerDetected ? 'bg-white' : 'bg-green-500 animate-ping'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {dangerDetected ? 'DANGER DETECTED - CONTACTING LAW' : 'AI Safety Protocol Active'}
              </span>
            </div>
          )}
        </div>

        {/* Panic Button */}
        <button className="absolute bottom-10 right-10 w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:scale-105 active:scale-95 transition-all group">
          <div className="flex flex-col items-center">
             <Shield size={32} className="text-white mb-1" />
             <span className="text-[10px] font-black tracking-tighter">S O S</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default PassengerDash;