// Map component for displaying buses and live driver locations
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button.jsx';
import { MapPin, Loader2 } from 'lucide-react';
import { listenToDriverLocations } from '../lib/locationService.js';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ensure Leaflet CSS is loaded
import 'leaflet/dist/leaflet.css';

// Custom blue marker icon for user location
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-location-marker',
    html: `
      <div style="
        background-color: #3b82f6;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 8px solid #3b82f6;
        "></div>
      </div>
    `,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -38]
  });
};
// Custom bus icon for static bus data
const createBusIcon = (status = 'active') => {
  const color = status === 'active' ? '#2563eb' : '#6b7280';
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  });
};

// Custom driver icon for live driver locations
const createDriverIcon = (isActive = true) => {
  const color = isActive ? '#16a34a' : '#dc2626';
  return L.divIcon({
    className: 'custom-driver-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background-color: #fbbf24;
          border-radius: 50%;
          border: 1px solid white;
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component to handle map updates
const MapUpdater = ({ 
  buses, 
  selectedBus, 
  onBusSelect, 
  driverLocations, 
  selectedDriver, 
  onDriverSelect,
  userLocation,
  onShowUserLocation 
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedBus && selectedBus.latitude && selectedBus.longitude) {
      map.setView([selectedBus.latitude, selectedBus.longitude], 15);
    }
  }, [selectedBus, map]);

  useEffect(() => {
    if (selectedDriver && selectedDriver.latitude && selectedDriver.longitude) {
      map.setView([selectedDriver.latitude, selectedDriver.longitude], 15);
    }
  }, [selectedDriver, map]);

  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [userLocation, map]);

  // Expose map instance to parent component
  useEffect(() => {
    if (onShowUserLocation) {
      onShowUserLocation(map);
    }
  }, [map, onShowUserLocation]);
  return null;
};

const BusMap = ({ 
  buses = [], 
  selectedBus, 
  onBusSelect,
  selectedDriver,
  onDriverSelect,
  className = "" 
}) => {
  const [driverLocations, setDriverLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force map resize on mobile orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);
  // Listen to live driver locations
  useEffect(() => {
    const unsubscribe = listenToDriverLocations((drivers) => {
      setDriverLocations(drivers);
    });

    return () => unsubscribe();
  }, []);

  const handleShowUserLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const formatSpeed = (speed) => {
    if (!speed || speed === 0) return 'Stationary';
    return `${Math.round(speed * 3.6)} km/h`;
  };

  const formatAccuracy = (accuracy) => {
    if (!accuracy) return 'Unknown';
    return accuracy < 1000 ? `${Math.round(accuracy)}m` : `${(accuracy / 1000).toFixed(1)}km`;
  };

  // Default center (New York City)
  const defaultCenter = [40.7128, -74.0060];
  
  // Calculate center based on available data
  const getMapCenter = () => {
    const allLocations = [
      ...buses.filter(bus => bus.latitude && bus.longitude),
      ...driverLocations.filter(driver => driver.latitude && driver.longitude)
    ];
    
    if (allLocations.length === 0) return defaultCenter;
    
    const avgLat = allLocations.reduce((sum, loc) => sum + loc.latitude, 0) / allLocations.length;
    const avgLng = allLocations.reduce((sum, loc) => sum + loc.longitude, 0) / allLocations.length;
    
    return [avgLat, avgLng];
  };

  // Force map to resize when component mounts
  useEffect(() => {
    if (mapReady && mapRef.current) {
      // Multiple resize attempts for mobile compatibility
      const timers = [100, 300, 500, 1000].map(delay => 
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, delay)
      );
      
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [mapReady]);

  return (
    <div className={`h-full w-full relative ${className}`} style={{ minHeight: isMobile ? '100vh' : '400px' }}>
      {/* Show My Location Button */}
      <div className={`absolute z-[1000] pointer-events-auto ${
        isMobile ? 'bottom-20 right-4' : 'top-4 left-4'
      }`}>
        <Button
          onClick={handleShowUserLocation}
          disabled={locationLoading}
          className={`bg-blue-600 hover:bg-blue-700 text-white shadow-lg touch-manipulation min-h-[44px] ${
            isMobile ? 'rounded-full w-14 h-14 p-0' : ''
          }`}
          size="sm"
        >
          {locationLoading ? (
            <Loader2 className={`h-4 w-4 animate-spin ${isMobile ? '' : 'mr-2'}`} />
          ) : (
            <MapPin className={`h-4 w-4 ${isMobile ? '' : 'mr-2'}`} />
          )}
          {!isMobile && 'Show My Location'}
        </Button>
      </div>

      {/* Location Error Alert */}
      {locationError && (
        <div className={`absolute z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg pointer-events-auto ${
          isMobile ? 'bottom-36 left-4 right-4' : 'top-16 left-4 right-4'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm">{locationError}</span>
            <button
              onClick={() => setLocationError('')}
              className="text-red-700 hover:text-red-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <MapContainer
        center={getMapCenter()}
        zoom={13}
        zoomControl={true}
        className={`h-full w-full map-container ${isMobile ? 'mobile-map' : ''}`}
        style={{ 
          height: isMobile ? '100vh' : '100%', 
          width: '100%', 
          minHeight: isMobile ? '100vh' : '400px',
          position: 'relative',
          zIndex: 1
        }}
        ref={mapRef}
        whenReady={(mapInstance) => {
          mapRef.current = mapInstance;
          setMapReady(true);
          
          // Multiple resize attempts for mobile
          [50, 100, 200, 500].forEach(delay => {
            setTimeout(() => {
              if (mapInstance && mapInstance.invalidateSize) {
                mapInstance.invalidateSize();
              }
            }, delay);
          });
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        <MapUpdater 
          buses={buses}
          selectedBus={selectedBus}
          onBusSelect={onBusSelect}
          driverLocations={driverLocations}
          selectedDriver={selectedDriver}
          onDriverSelect={onDriverSelect}
          userLocation={userLocation}
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserLocationIcon()}
          >
            <Popup>
              <div className="p-2 min-w-[150px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h3 className="font-semibold text-lg text-blue-600">Your Location</h3>
                </div>
                <p className="text-sm text-gray-600">
                  This is your current location based on your device's GPS.
                </p>
                <p className="text-xs text-gray-500 mt-2 font-mono">
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        {/* Static Bus Markers */}
        {buses.map((bus) => {
          if (!bus.latitude || !bus.longitude) return null;
          
          return (
            <Marker
              key={`bus-${bus.id}`}
              position={[bus.latitude, bus.longitude]}
              icon={createBusIcon(bus.status)}
              eventHandlers={{
                click: () => onBusSelect && onBusSelect(bus)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg mb-2">{bus.busId}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Route:</strong> {bus.route}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        bus.status === 'active' ? 'bg-green-100 text-green-800' :
                        bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bus.status}
                      </span>
                    </p>
                    <p><strong>Speed:</strong> {bus.speed || 0} km/h</p>
                    <p><strong>Last Updated:</strong> {formatLastUpdated(bus.lastUpdated)}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {bus.latitude.toFixed(6)}, {bus.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Driver Markers */}
        {driverLocations.map((driver) => {
          if (!driver.latitude || !driver.longitude) return null;
          
          const isRecent = driver.timestamp && 
            (new Date() - new Date(driver.timestamp.seconds * 1000)) < 300000; // 5 minutes
          
          return (
            <Marker
              key={`driver-${driver.id}`}
              position={[driver.latitude, driver.longitude]}
              icon={createDriverIcon(isRecent)}
              eventHandlers={{
                click: () => onDriverSelect && onDriverSelect(driver)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[220px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="font-semibold text-lg">Live Driver</h3>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p><strong>Driver:</strong> {driver.displayName || 'Unknown'}</p>
                    <p><strong>Bus Number:</strong> {driver.busNumber || 'N/A'}</p>
                    <p><strong>Route:</strong> {driver.route || 'N/A'}</p>
                    <p><strong>Speed:</strong> {formatSpeed(driver.speed)}</p>
                    <p><strong>Accuracy:</strong> {formatAccuracy(driver.accuracy)}</p>
                    <p><strong>Last Update:</strong> {formatLastUpdated(driver.timestamp)}</p>
                    
                    <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs text-green-800 font-medium">
                        🔴 LIVE TRACKING
                      </p>
                      <p className="text-xs text-green-700">
                        Real-time location from driver's device
                      </p>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {driver.latitude.toFixed(6)}, {driver.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default BusMap;

