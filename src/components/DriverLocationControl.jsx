// Driver location control component
import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { 
  MapPin, 
  Play, 
  Square, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Navigation,
  Clock,
  Zap
} from 'lucide-react';
import useLocationSharing from '../hooks/useLocationSharing.js';
import useUserRole from '../hooks/useUserRole.js';

const DriverLocationControl = () => {
  const { userProfile, canShare, isDriver, isVerified } = useUserRole();
  const {
    isSharing,
    loading,
    error,
    locationPermission,
    currentPosition,
    accuracy,
    canStartSharing,
    needsPermission,
    toggleSharing,
    requestPermission,
    clearError
  } = useLocationSharing();

  // Don't show for non-drivers
  if (!isDriver) {
    return null;
  }

  // Show verification status for unverified drivers
  if (!isVerified) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 mx-2 mb-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Clock className="h-5 w-5" />
            Driver Verification Pending
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Your driver verification is being reviewed. You'll be able to share your location once approved.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleToggleSharing = async () => {
    console.log('Button clicked, calling toggleSharing...');
    
    // Clear any existing errors
    clearError();
    
    // For mobile devices, we need to handle permissions more carefully
    if (!canStartSharing && needsPermission) {
      console.log('Requesting permission first...');
      const permResult = await requestPermission();
      if (!permResult.success) {
        console.error('Permission request failed:', permResult.error);
        return;
      }
    }
    
    const result = await toggleSharing();
    console.log('Toggle result:', result);
    
    if (!result.success && result.error) {
      console.error('Toggle sharing failed:', result.error);
    }
  };

  const formatAccuracy = (acc) => {
    if (!acc) return 'Unknown';
    return acc < 1000 ? `${Math.round(acc)}m` : `${(acc / 1000).toFixed(1)}km`;
  };

  const formatCoordinates = (position) => {
    if (!position) return 'No location';
    const lat = position.coords.latitude.toFixed(6);
    const lng = position.coords.longitude.toFixed(6);
    return `${lat}, ${lng}`;
  };

  const getLocationStatus = () => {
    if (isSharing) return { text: 'Active', color: 'bg-green-500', icon: CheckCircle };
    if (loading) return { text: 'Starting...', color: 'bg-yellow-500', icon: Loader2 };
    return { text: 'Inactive', color: 'bg-gray-500', icon: Square };
  };

  const status = getLocationStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-2 mx-2 mb-2">
      <Card className={`${isSharing ? 'border-green-200 bg-green-50' : ''} overflow-hidden`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="text-sm md:text-base">Live Location</span>
            </div>
            <Badge 
              variant="secondary" 
              className={`${status.color} text-white flex items-center gap-1`}
            >
              <StatusIcon className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              {status.text}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Share your real-time location with students so they can track your bus.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearError}
                  className="h-auto p-1"
                >
                  ×
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {needsPermission && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Location access is required to share your position. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-1"
                  onClick={requestPermission}
                  disabled={loading}
                >
                  Grant permission
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Driver Info */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-muted rounded-lg text-xs md:text-sm">
            <div>
              <p className="font-medium">Bus Number</p>
              <p className="text-muted-foreground">
                {userProfile?.driverInfo?.busNumber || 'Not set'}
              </p>
            </div>
            <div>
              <p className="font-medium">Route</p>
              <p className="text-muted-foreground">
                {userProfile?.driverInfo?.route || 'Not set'}
              </p>
            </div>
          </div>

          {/* Location Info */}
          {isSharing && currentPosition && (
            <div className="space-y-1 p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <Navigation className="h-4 w-4" />
                <span className="font-medium text-xs">Location Active</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Accuracy:</span>
                  <span>{formatAccuracy(accuracy)}</span>
                  {currentPosition.coords.speed && (
                    <>
                      <span>•</span>
                      <Zap className="h-3 w-3" />
                      <span>{Math.round(currentPosition.coords.speed * 3.6)} km/h</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && !isSharing && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer">Debug Info</summary>
              <div className="mt-1 p-2 bg-gray-100 rounded text-xs">
                <p>canStartSharing: {canStartSharing.toString()}</p>
                <p>locationPermission: {locationPermission}</p>
                <p>isDriver: {isDriver.toString()}, isVerified: {isVerified.toString()}</p>
                <p>needsPermission: {needsPermission.toString()}</p>
                <p>navigator.geolocation: {('geolocation' in navigator).toString()}</p>
              </div>
            </details>
          )}

          {/* Control Button */}
          <Button
            onClick={handleToggleSharing}
            disabled={loading}
            className={`w-full ${isSharing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} touch-manipulation`}
            size="default"
            type="button"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSharing ? 'Stopping...' : 'Starting...'}
              </>
            ) : isSharing ? (
              <>
                <Square className="mr-2 h-4 w-4" />
                Stop Sharing Location
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Sharing Location
              </>
            )}
          </Button>

          {isSharing && (
            <div className="text-xs text-green-700 text-center px-2 bg-green-50 rounded py-1">
              🔴 Live • Students can track your bus
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverLocationControl;

