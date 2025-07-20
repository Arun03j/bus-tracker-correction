// Authentication page component
import React, { useState } from 'react';
import LoginForm from './LoginForm.jsx';
import SignupForm from './SignupForm.jsx';
import { MapPin, Bus } from 'lucide-react';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleSwitchToSignup = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  const handleAuthSuccess = (user) => {
    if (onAuthSuccess) {
      onAuthSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary rounded-lg">
              <Bus className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bus Tracker</h1>
              <p className="text-gray-600">Real-time Bus Location Tracking</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Track buses in real-time with precision
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Monitor bus locations, routes, and status updates with our advanced 
              tracking system powered by Firebase and interactive maps.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Real-time Tracking</h3>
                <p className="text-gray-600 text-sm">
                  Live location updates with precise GPS coordinates
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fleet Management</h3>
                <p className="text-gray-600 text-sm">
                  Monitor multiple buses with status indicators
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Analytics Dashboard</h3>
                <p className="text-gray-600 text-sm">
                  Comprehensive insights and reporting tools
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <blockquote className="text-gray-700 italic">
              "This bus tracking system has revolutionized our fleet management. 
              Real-time updates and intuitive interface make it incredibly easy to use."
            </blockquote>
            <div className="mt-3 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JD</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">John Doe</p>
                <p className="text-gray-600 text-sm">Fleet Manager</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Authentication Forms */}
        <div className="w-full">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-primary rounded-lg">
                <Bus className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bus Tracker</h1>
                <p className="text-gray-600">Real-time Bus Location Tracking</p>
              </div>
            </div>
          </div>

          <div className="transition-all duration-300 ease-in-out">
            {isLogin ? (
              <LoginForm 
                onSwitchToSignup={handleSwitchToSignup}
                onLoginSuccess={handleAuthSuccess}
              />
            ) : (
              <SignupForm 
                onSwitchToLogin={handleSwitchToLogin}
                onSignupSuccess={handleAuthSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

