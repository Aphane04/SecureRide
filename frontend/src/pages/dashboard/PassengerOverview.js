import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

// Keep your original center coordinates
const center = { lat: -26.2041, lng: 28.0473 };

// Technical fix: Move this outside to stop the infinite loop error
const libraries = ['places']; 

const PassengerOverview = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    // REPLACE WITH YOUR KEY: This fixes the "NoApiKeys" error
    googleMapsApiKey: "AIzaSyA83A7s1BCXBGOXnNAR362CkdeLPKYkGDQ", 
    libraries: libraries,
  });

  // Keep your original loading screen design
  if (!isLoaded) {
    return (
      <div className="bg-black h-screen flex items-center justify-center text-green-500">
        Initializing Maps...
      </div>
    );
  }

  // If there is an error, show it (helps with debugging)
  if (loadError) {
    return (
      <div className="bg-black h-screen flex items-center justify-center text-red-500">
        Error loading maps...
      </div>
    );
  }

  return (
    // Keep your original height and layout
    <div className="h-[calc(100vh-64px)]">
      <GoogleMap
        center={center}
        zoom={15}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{ disableDefaultUI: true }}
      >
        {/* Use MarkerF to ensure the pin shows up in React 18 */}
        <MarkerF position={center} />
      </GoogleMap>
    </div>
  );
};

export default PassengerOverview;