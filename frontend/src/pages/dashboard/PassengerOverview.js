import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

// FIX 1: Move libraries OUTSIDE the component to stop the infinite reloading loop
const libraries = ['places']; 
const center = { lat: -26.2041, lng: 28.0473 };

const PassengerOverview = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    // FIX 2: If this still fails, replace the process.env line below 
    // with your actual key string "AIza..." just to test it.
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  // Add an error catch so you can see exactly what's wrong in the UI
  if (loadError) {
    return (
      <div className="bg-black h-screen flex flex-col items-center justify-center text-red-500 p-4">
        <h1 className="text-xl font-bold">Map Load Error</h1>
        <p>{loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-black h-screen flex items-center justify-center text-green-500">
        Initializing Maps...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)]">
      <GoogleMap
        center={center}
        zoom={15}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{ 
          disableDefaultUI: true,
          // This ID is required for the new "Advanced Markers" 
          // You can create a Map ID in Google Console or leave it out for now
          mapId: 'DEMO_MAP_ID' 
        }}
      >
        {/* FIX 3: Use MarkerF (F for Functional) instead of Marker to solve React 18 compatibility */}
        <MarkerF position={center} />
      </GoogleMap>
    </div>
  );
};

export default PassengerOverview;