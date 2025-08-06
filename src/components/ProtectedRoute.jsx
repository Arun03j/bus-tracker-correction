// Protected route component for manual verification
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import useUserRole from '../hooks/useUserRole.js';
import AuthPage from './AuthPage.jsx';
import PendingVerification from './PendingVerification.jsx';
import BusMap from './BusMap.jsx';
import BusSidebar from './BusSidebar.jsx';
import { useBusLocations } from '../hooks/useBusData.js';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const { userProfile, isVerified, isPending, loading: roleLoading } = useUserRole();
  const { buses, loading: busLoading, connected } = useBusLocations();

  // Show loading spinner while authentication state is being determined
  if (!initialized || loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication page if user is not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show pending verification if user is not verified by admin
  if (user && !isVerified && isPending) {
    return <PendingVerification user={user} userProfile={userProfile} />;
  }

  // If user exists but no profile found, show a basic map view while profile loads
  if (user && !userProfile && !roleLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-80 bg-card border-r p-4">
          <h1 className="text-lg font-bold mb-4">JPR Bus Tracker</h1>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
        <div className="flex-1">
          <BusMap buses={buses} />
        </div>
      </div>
    );
  }

  // Render protected content if user is authenticated and manually verified
  return children;
};

export default ProtectedRoute;

