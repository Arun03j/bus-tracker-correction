// Firestore service functions for bus tracking
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  doc,
  getDoc,
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase.js';

// Collection reference
const BUSES_COLLECTION = 'buses';

/**
 * Subscribe to real-time bus location updates
 * @param {Function} callback - Function to call when data updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToBusLocations = (callback) => {
  const busesRef = collection(db, BUSES_COLLECTION);
  
  // Don't filter by status initially to show all buses
  const q = query(busesRef);

  return onSnapshot(q, (snapshot) => {
    const buses = [];
    snapshot.forEach((doc) => {
      const busData = {
        id: doc.id,
        ...doc.data()
      };
      
      // Only add buses with valid coordinates
      if (busData.latitude && busData.longitude) {
        buses.push(busData);
      }
    });
    
    // If no buses found, add some demo data for testing
    if (buses.length === 0) {
      const demoBuses = [
        {
          id: 'demo-bus-1',
          busId: 'B001',
          latitude: 40.7128,
          longitude: -74.0060,
          route: 'Route 1 - Downtown',
          status: 'active',
          speed: 25,
          heading: 90,
          lastUpdated: new Date()
        },
        {
          id: 'demo-bus-2',
          busId: 'B002',
          latitude: 40.7589,
          longitude: -73.9851,
          route: 'Route 2 - Uptown',
          status: 'active',
          speed: 30,
          heading: 180,
          lastUpdated: new Date()
        },
        {
          id: 'demo-bus-3',
          busId: 'B003',
          latitude: 40.7505,
          longitude: -73.9934,
          route: 'Route 3 - Crosstown',
          status: 'maintenance',
          speed: 0,
          heading: 0,
          lastUpdated: new Date()
        }
      ];
      callback(demoBuses);
      return;
    }
    
    // Sort by lastUpdated in memory to avoid composite index requirement
    buses.sort((a, b) => {
      const aTime = a.lastUpdated?.seconds || 0;
      const bTime = b.lastUpdated?.seconds || 0;
      return bTime - aTime;
    });
    
    callback(buses);
  }, (error) => {
    console.error('Error listening to bus locations:', error);
    // Provide demo data on error
    const demoBuses = [
      {
        id: 'demo-bus-1',
        busId: 'B001',
        latitude: 40.7128,
        longitude: -74.0060,
        route: 'Route 1 - Downtown',
        status: 'active',
        speed: 25,
        heading: 90,
        lastUpdated: new Date()
      }
    ];
    callback(demoBuses);
  });
};

/**
 * Get all buses (one-time fetch)
 * @returns {Promise<Array>} Array of bus objects
 */
export const getAllBuses = async () => {
  try {
    const busesRef = collection(db, BUSES_COLLECTION);
    const snapshot = await getDocs(busesRef);
    const buses = [];
    
    snapshot.forEach((doc) => {
      buses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return buses;
  } catch (error) {
    console.error('Error fetching buses:', error);
    return [];
  }
};

/**
 * Get a specific bus by ID
 * @param {string} busId - Bus ID
 * @returns {Promise<Object|null>} Bus object or null
 */
export const getBusById = async (busId) => {
  try {
    const busRef = doc(db, BUSES_COLLECTION, busId);
    const busSnap = await getDoc(busRef);
    
    if (busSnap.exists()) {
      return {
        id: busSnap.id,
        ...busSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching bus:', error);
    return null;
  }
};

/**
 * Subscribe to a specific bus updates
 * @param {string} busId - Bus ID
 * @param {Function} callback - Function to call when data updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToBus = (busId, callback) => {
  const busRef = doc(db, BUSES_COLLECTION, busId);
  
  return onSnapshot(busRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to bus:', error);
    callback(null);
  });
};

/**
 * Format timestamp for display
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted time string
 */
export const formatLastUpdated = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
};

