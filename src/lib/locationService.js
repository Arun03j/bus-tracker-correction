// Live location service for managing driver location sharing
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot,
  serverTimestamp,
  query,
  where 
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Start sharing live location for a driver
 */
export const startLocationSharing = async (userId, userEmail, driverInfo) => {
  try {
    console.log('startLocationSharing called with:', { userId, userEmail, driverInfo });

    // Check if geolocation is available
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }
    
    console.log('Getting current position...');
    // Get current position with better error handling
    const position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000
    });

    console.log('Position obtained:', position);

    const locationRef = doc(db, 'driverLocations', userId);
    
    const locationData = {
      userId,
      email: userEmail,
      displayName: driverInfo.displayName || 'Driver',
      busNumber: driverInfo.busNumber || 'Unknown',
      route: driverInfo.route || 'Unknown Route',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || 0,
      speed: position.coords.speed || 0,
      timestamp: serverTimestamp(),
      isActive: true,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    console.log('Saving location data to Firestore:', locationData);

    await setDoc(locationRef, locationData);
    
    console.log('Location sharing started successfully');
    return { success: true, position };
  } catch (error) {
    console.error('Error in startLocationSharing:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to start location sharing'
    };
  }
};

/**
 * Update driver location
 */
export const updateDriverLocation = async (userId, position) => {
  try {
    const locationRef = doc(db, 'driverLocations', userId);
    
    const updateData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || 0,
      speed: position.coords.speed || 0,
      timestamp: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isActive: true
    };

    await setDoc(locationRef, updateData, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating driver location:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update location'
    };
  }
};

/**
 * Stop sharing live location
 */
export const stopLocationSharing = async (userId) => {
  try {
    console.log('Stopping location sharing for user:', userId);
    const locationRef = doc(db, 'driverLocations', userId);
    await deleteDoc(locationRef);
    
    console.log('Location sharing stopped successfully');
    return { success: true };
  } catch (error) {
    console.error('Error stopping location sharing:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current position using Geolocation API
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    console.log('getCurrentPosition called with options:', options);

    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000, // 30 seconds
      ...options
    };

    console.log('Requesting geolocation with options:', defaultOptions);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation success:', position);
        resolve(position);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unknown location error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
};

/**
 * Watch position changes
 */
export const watchPosition = (callback, errorCallback, options = {}) => {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation is not supported by this browser'));
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000, // 30 seconds
    ...options
  };

  return navigator.geolocation.watchPosition(
    callback,
    (error) => {
      let errorMessage = 'Unknown location error';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }
      
      errorCallback(new Error(errorMessage));
    },
    defaultOptions
  );
};

/**
 * Listen to all active driver locations
 */
export const listenToDriverLocations = (callback) => {
  const q = query(
    collection(db, 'driverLocations'),
    where('isActive', '==', true)
  );
  
  return onSnapshot(q, (snapshot) => {
    const drivers = [];
    snapshot.forEach((doc) => {
      drivers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(drivers);
  });
};

/**
 * Check if location services are available
 */
export const isLocationAvailable = () => {
  return 'geolocation' in navigator;
};

/**
 * Request location permission
 */
export const requestLocationPermission = async () => {
  try {
    console.log('Requesting location permission...');
    if (!isLocationAvailable()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    // For mobile devices, we need to be more patient with the timeout
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const timeout = isMobile ? 15000 : 10000;
    
    console.log('Detected mobile device:', isMobile, 'using timeout:', timeout);
    
    // Try to get current position to trigger permission request
    await getCurrentPosition({ 
      timeout: timeout,
      enableHighAccuracy: true,
      maximumAge: 0 // Don't use cached position for permission request
    });
    console.log('Location permission granted');
    return { success: true };
  } catch (error) {
    console.error('Location permission error:', error);
    return { success: false, error: error.message };
  }
};

