import React from 'react';
import Header from '@/components/layout/Header';
import ProfileSettings from '@/components/shared/ProfileSettings';

const Profile = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex">
        <main className="flex-1 p-4 md:p-8">
          <ProfileSettings />
        </main>
      </div>
    </div>
  );
};

export default Profile;
