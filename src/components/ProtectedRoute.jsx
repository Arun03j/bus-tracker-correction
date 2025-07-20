// Protected route component for manual verification
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import useUserRole from '../hooks/useUserRole.js';
import AuthPage from './AuthPage.jsx';
import PendingVerification from './PendingVerification.jsx';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const { userProfile, isVerified, isPending, loading: roleLoading } = useUserRole();

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

  // If user exists but no profile found, they might be an old user or a new user whose profile hasn't loaded yet
  // In this case, assume pending and show PendingVerification to enforce admin approval
  if (user && !userProfile && !roleLoading) {
    return <PendingVerification user={user} userProfile={null} />;
  }

  // Render protected content if user is authenticated and manually verified
  return children;
};

export default ProtectedRoute;

