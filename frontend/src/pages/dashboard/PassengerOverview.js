import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const center = { lat: -26.2041, lng: 28.0473 };

const PassengerOverview = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  if (!isLoaded) return <div className="bg-black h-screen flex items-center justify-center text-green-500">Initializing Maps...</div>;

  return (
    <div className="h-[calc(100vh-64px)]">
      <GoogleMap
        center={center}
        zoom={15}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{ disableDefaultUI: true }}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
};

export default PassengerOverview;