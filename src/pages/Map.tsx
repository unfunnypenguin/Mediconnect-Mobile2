import React from 'react';
import Header from '@/components/layout/Header';
import MapView from '@/components/shared/MapView';

const Map = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex">
        <main className="flex-1 p-4 md:p-8">
          <MapView />
        </main>
      </div>
    </div>
  );
};

export default Map;
