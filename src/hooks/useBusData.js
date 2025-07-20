// Custom React hook for managing bus tracking data
import { useState, useEffect, useCallback } from 'react';
import { subscribeToBusLocations, subscribeToBus } from '../lib/busService.js';

/**
 * Hook for managing all bus locations with real-time updates
 * @returns {Object} Bus data and state
 */
export const useBusLocations = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToBusLocations((busData) => {
      setBuses(busData);
      setLoading(false);
      setConnected(true);
      setError(null);
    });

    // Handle connection errors
    const handleError = (err) => {
      setError(err.message || 'Connection error');
      setConnected(false);
      setLoading(false);
    };

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const refreshData = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  return {
    buses,
    loading,
    error,
    connected,
    refreshData
  };
};

/**
 * Hook for managing a specific bus with real-time updates
 * @param {string} busId - Bus ID to track
 * @returns {Object} Bus data and state
 */
export const useBus = (busId) => {
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!busId) {
      setBus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToBus(busId, (busData) => {
      setBus(busData);
      setLoading(false);
      setError(null);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [busId]);

  return {
    bus,
    loading,
    error
  };
};

/**
 * Hook for managing selected bus state
 * @returns {Object} Selected bus state and controls
 */
export const useSelectedBus = () => {
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);

  const selectBus = useCallback((bus) => {
    setSelectedBusId(bus?.id || null);
    setSelectedBus(bus || null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBusId(null);
    setSelectedBus(null);
  }, []);

  return {
    selectedBusId,
    selectedBus,
    selectBus,
    clearSelection
  };
};

