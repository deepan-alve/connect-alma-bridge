import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/settings/edit-profile', label: '✏️ Edit Profile' },
  { to: '/settings/security', label: '🔒 Security (Future)' },
  { to: '/settings/notifications', label: '🔔 Notifications (Future)' },
];

const SettingsNav = () => (
  <nav className="w-64 flex-shrink-0 bg-gray-50 border-r p-6 space-y-2">
    <h3 className="text-xl font-bold mb-4 text-gray-800">Settings</h3>
    {navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) => 
          `block p-3 rounded-lg font-medium transition-colors ${
            isActive 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`
        }
      >
        {item.label}
      </NavLink>
    ))}
  </nav>
);

export default SettingsNav;