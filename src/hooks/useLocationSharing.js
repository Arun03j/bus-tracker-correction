// React hook for managing live location sharing
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth.jsx';
import useUserRole from './useUserRole.js';
import {
  startLocationSharing,
  updateDriverLocation,
  stopLocationSharing,
  watchPosition,
  requestLocationPermission,
  isLocationAvailable
} from '../lib/locationService.js';

export const useLocationSharing = () => {
  const { user } = useAuth();
  const { userProfile, canShare, isDriver, isVerified } = useUserRole();
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationPermission, setLocationPermission] = useState('unknown');
  const [currentPosition, setCurrentPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const checkLocationPermission = async () => {
    if (!isLocationAvailable()) {
      setLocationPermission('unavailable');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(result.state);
      
      result.addEventListener('change', () => {
        setLocationPermission(result.state);
      });
    } catch (err) {
      // Fallback for browsers that don't support permissions API
      setLocationPermission('unknown');
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Requesting location permission...');
      const result = await requestLocationPermission();
      if (result.success) {
        setLocationPermission('granted');
        console.log('Permission granted successfully');
        return { success: true };
      } else {
        console.error('Permission denied:', result.error);
        setError(result.error);
        setLocationPermission('denied');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Permission request error:', err);
      const errorMsg = 'Failed to request location permission';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const startSharing = async () => {
    console.log('Starting location sharing...', { 
      canShare, 
      isDriver, 
      isVerified, 
      userProfile: userProfile?.role,
      user: !!user 
    });

    if (!isDriver || !isVerified) {
      setError('Only verified drivers can share location');
      return { success: false };
    }

    if (!user || !userProfile) {
      setError('User not authenticated');
      return { success: false };
    }

    setLoading(true);
    setError('');

    try {
      // Request permission if needed
      if (locationPermission !== 'granted' && locationPermission !== 'unknown') {
        console.log('Requesting location permission...');
        const permResult = await requestPermission();
        if (!permResult.success) {
          setLoading(false);
          return permResult;
        }
      }

      // Start location sharing
      console.log('Starting location sharing with data:', {
        displayName: userProfile.displayName,
        busNumber: userProfile.driverInfo?.busNumber,
        route: userProfile.driverInfo?.route
      });

      const result = await startLocationSharing(user.uid, user.email, {
        displayName: userProfile.displayName,
        busNumber: userProfile.driverInfo?.busNumber,
        route: userProfile.driverInfo?.route
      });

      if (result.success) {
        console.log('Location sharing started successfully');
        setIsSharing(true);
        setCurrentPosition(result.position);
        setAccuracy(result.position.coords.accuracy);
        
        // Start watching position changes
        startWatchingPosition();
        
        return { success: true };
      } else {
        console.error('Failed to start location sharing:', result.error);
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error in startSharing:', err);
      const errorMsg = 'Failed to start location sharing';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const stopSharing = async () => {
    setLoading(true);
    setError('');

    try {
      // Stop watching position
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }

      // Remove from database
      const result = await stopLocationSharing(user.uid);
      
      if (result.success) {
        setIsSharing(false);
        setCurrentPosition(null);
        setAccuracy(null);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Failed to stop location sharing';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const startWatchingPosition = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = watchPosition(
      async (position) => {
        setCurrentPosition(position);
        setAccuracy(position.coords.accuracy);
        
        // Update location in database
        try {
          const updateResult = await updateDriverLocation(user.uid, position);
          if (!updateResult.success) {
            setError('Failed to update location');
          }
        } catch (err) {
          setError('Location update failed');
        }
      },
      (error) => {
        setError(`Location tracking error: ${error.message}`);
        
        // If there's a critical error, stop sharing
        if (error.code === error.PERMISSION_DENIED) {
          stopSharing();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  const toggleSharing = async () => {
    console.log('Toggle sharing called, current state:', isSharing);
    
    // Clear any existing errors first
    setError('');
    
    if (isSharing) {
      return await stopSharing();
    } else {
      return await startSharing();
    }
  };

  const canStartSharing = isDriver && isVerified && !loading;

  const needsPermission = locationPermission === 'denied';

  return {
    isSharing,
    loading,
    error,
    locationPermission,
    currentPosition,
    accuracy,
    canStartSharing,
    needsPermission,
    canShare: isDriver && isVerified,
    startSharing,
    stopSharing,
    toggleSharing,
    requestPermission,
    clearError: () => setError('')
  };
};

export default useLocationSharing;

