// React hook for managing user roles and verification
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth.jsx';
import { 
  getUserProfile, 
  createUserProfile, 
  listenToUserProfile,
  canShareLocation,
  USER_ROLES,
  VERIFICATION_STATUS 
} from '../lib/userRoleService.js';

export const useUserRole = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      setCanShare(false);
      return;
    }

    setLoading(true);
    
    // Listen to user profile changes
    const unsubscribe = listenToUserProfile(user.uid, async (result) => {
      if (result.success) {
        setUserProfile(result.data);
        setError(null);
        
        // Check if user can share location
        const canShareResult = await canShareLocation(user.uid);
        setCanShare(canShareResult);
      } else {
        // If profile doesn't exist, create a default student profile
        if (result.error === 'User profile not found') {
          try {
            await createUserProfile(
              user.uid, 
              user.email, 
              user.displayName || 'User',
              USER_ROLES.STUDENT
            );
          } catch (createError) {
            setError('Failed to create user profile');
            console.error('Error creating user profile:', createError);
          }
        } else {
          setError(result.error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const isDriver = userProfile?.role === USER_ROLES.DRIVER;
  const isStudent = userProfile?.role === USER_ROLES.STUDENT;
  const isAdmin = userProfile?.role === USER_ROLES.ADMIN;
  const isVerified = userProfile?.isVerified;
  const isPending = userProfile?.isPending;
  const isRejected = userProfile?.isRejected === true;

  return {
    userProfile,
    loading,
    error,
    canShare,
    isDriver,
    isStudent,
    isAdmin,
    isVerified,
    isPending,
    isRejected,
    USER_ROLES,
    VERIFICATION_STATUS
  };
};

export default useUserRole;

