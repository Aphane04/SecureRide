import React, { useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { useAiMonitor } from '../../utils/aiMonitor';
import { Shield, MapPin, Navigation, Search } from 'lucide-react';
import { tripAPI } from '../../utils/api';

const center = { lat: -26.2041, lng: 28.0473 };

const parseDistanceKm = (text) => {
  if (!text) return 0;
  const [valueStr, unit] = text.split(' ');
  const value = parseFloat(valueStr.replace(',', '.'));
  if (unit.toLowerCase().startsWith('m')) return value / 1000;
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
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [fare, setFare] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [activeTrip, setActiveTrip] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const originRef = useRef();
  const destinationRef = useRef();

  const { dangerDetected } = useAiMonitor(activeTrip);

  async function calculateRoute() {
    if (originRef.current.value === '' || destinationRef.current.value === '') return;

    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      travelMode: google.maps.TravelMode.DRIVING,
    });

    const distanceText = results.routes[0].legs[0].distance.text;
    const durationText = results.routes[0].legs[0].duration.text;

    setDirectionsResponse(results);
    setDistance(distanceText);
    setDuration(durationText);

    const km = parseDistanceKm(distanceText);
    const mins = parseDurationMinutes(durationText);
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
    const response = await tripAPI.bookRide({
      pickup_location: originRef.current.value,
      destination: destinationRef.current.value,
      distance_km: distanceKm,
      duration_minutes: durationMinutes,
      fare,
    });
    setActiveTrip(response.data.id);
    setBookingMessage('Ride request sent. Driver is being matched.');
  };

  if (!isLoaded) return <div className="bg-black h-screen flex items-center justify-center text-green-500">Initializing Maps...</div>;

  return (
    <div className="h-[calc(100vh-64px)] bg-[#0f0f0f] text-white">
      {/* Map at Top */}
      <div className="h-[55%] relative">
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

        <div className="absolute top-6 left-6 z-10">
          {activeTrip && (
            <div className={`px-5 py-2 rounded-full flex items-center gap-3 border shadow-2xl transition-all ${dangerDetected ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-green-900/40 border-green-500/50 backdrop-blur-md'}`}>
              <div className={`w-2 h-2 rounded-full ${dangerDetected ? 'bg-white' : 'bg-green-500 animate-ping'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {dangerDetected ? 'DANGER DETECTED - CONTACTING LAW' : 'AI Safety Protocol Active'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form at Bottom */}
      <div className="h-[45%] p-6 border-t border-gray-900 bg-[#121212] overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Shield className="text-[#008751]" size={20} /> Request a Ride
          </h2>

          <div className="bg-black p-6 rounded-3xl border border-gray-800 shadow-2xl">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Trip Details</p>
            <div className="grid md:grid-cols-2 gap-4">
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
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <button onClick={calculateRoute} className="flex-1 bg-[#008751] hover:bg-green-700 py-3 rounded-2xl font-bold transition flex items-center justify-center gap-2">
                <Search size={18}/> Calculate Fare
              </button>
              <button
                onClick={requestRide}
                disabled={!fare}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 py-3 rounded-2xl font-bold"
              >
                Request Ride (Cash)
              </button>
            </div>

            {distance && (
              <div className="mt-5 pt-4 border-t border-gray-900 grid md:grid-cols-4 gap-3 text-sm">
                <div className="text-gray-400">Distance: <span className="text-white font-semibold">{distance}</span></div>
                <div className="text-gray-400">Duration: <span className="text-white font-semibold">{duration}</span></div>
                <div className="text-gray-400">Payment: <span className="text-green-500 font-semibold">Cash</span></div>
                <div className="text-gray-400">Fare: <span className="text-green-500 font-semibold">R {fare ?? '...'}</span></div>
              </div>
            )}

            {bookingMessage && (
              <div className="mt-3 text-xs text-green-400">{bookingMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerRide;