// src/pages/Settings.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import SettingsNav from '@/components/SettingsNav'; // Import the navigation sidebar

const SettingsLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* 1. Settings Sidebar Navigation */}
      {/* This component provides the links (e.g., Edit Profile) */}
      <SettingsNav />
      
      {/* 2. Main Content Area */}
      <main className="flex-1 p-8">
        <div className="bg-white p-6 rounded-lg shadow-lg min-h-full">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Account Settings</h1>
          
          {/* 🚨 CRITICAL: The <Outlet /> renders the specific nested content.
              When the URL is /settings/edit-profile, EditProfile.tsx appears here.
          */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// IMPORTANT: Rename the export to match the file name convention and App.tsx import
export default SettingsLayout;