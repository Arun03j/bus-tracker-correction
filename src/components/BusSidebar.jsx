// Sidebar component for displaying buses and live driver locations
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  MapPin, 
  Clock, 
  Route, 
  Zap, 
  RefreshCw, 
  Bus, 
  User, 
  Navigation,
  Circle
} from 'lucide-react';
import { formatLastUpdated } from '../lib/busService.js';
import { listenToDriverLocations } from '../lib/locationService.js';

const BusSidebar = ({ 
  buses = [], 
  selectedBus = null, 
  onBusSelect = () => {},
  selectedDriver = null,
  onDriverSelect = () => {},
  loading = false,
  connected = true,
  onRefresh = () => {}
}) => {
  const [driverLocations, setDriverLocations] = useState([]);
  const [activeTab, setActiveTab] = useState('buses');

  // Listen to live driver locations
  useEffect(() => {
    const unsubscribe = listenToDriverLocations((drivers) => {
      setDriverLocations(drivers);
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'outline';
    }
  };

  const formatSpeed = (speed) => {
    if (!speed || speed === 0) return 'Stationary';
    return `${Math.round(speed * 3.6)} km/h`;
  };

  const isDriverRecent = (timestamp) => {
    if (!timestamp) return false;
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return (new Date() - date) < 300000; // 5 minutes
  };

  return (
    <div className="sidebar w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-2 border-b">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base md:text-lg font-bold">JPR Bus Tracker</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={connected ? 'text-green-700' : 'text-red-700'}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Tabs for Buses and Live Drivers */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-2 mt-2">
          <TabsTrigger value="buses" className="flex items-center gap-2">
            <Bus className="h-4 w-4" />
            Buses ({buses.length})
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Live ({driverLocations.length})
          </TabsTrigger>
        </TabsList>

        {/* Buses Tab */}
        <TabsContent value="buses" className="flex-1 mt-2">
          <ScrollArea className="h-full px-2">
            <div className="space-y-1 pb-2">
              {loading && buses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Loading buses...
                </div>
              ) : buses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bus className="h-8 w-8 mx-auto mb-2" />
                  No buses available
                </div>
              ) : (
                buses.map((bus) => (
                  <Card
                    key={bus.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedBus?.id === bus.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => onBusSelect(bus)}
                  >
                    <CardHeader className="pb-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base md:text-lg">{bus.busId}</CardTitle>
                        <Badge variant={getStatusBadgeVariant(bus.status)}>
                          {bus.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1 text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-muted-foreground" />
                          <span>{bus.route}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span>{bus.speed || 0} km/h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatLastUpdated(bus.lastUpdated)}</span>
                        </div>
                        {bus.latitude && bus.longitude && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-mono">
                              {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Live Drivers Tab */}
        <TabsContent value="drivers" className="flex-1 mt-2">
          <ScrollArea className="h-full px-2">
            <div className="space-y-1 pb-2">
              {driverLocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="h-8 w-8 mx-auto mb-2" />
                  <p>No live drivers</p>
                  <p className="text-xs mt-1">Drivers will appear here when they start sharing location</p>
                </div>
              ) : (
                driverLocations.map((driver) => {
                  const isRecent = isDriverRecent(driver.timestamp);
                  
                  return (
                    <Card
                      key={driver.id}
                      className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                        isRecent ? 'border-l-green-500 bg-green-50' : 'border-l-orange-500 bg-orange-50'
                      } ${
                        selectedDriver?.id === driver.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => onDriverSelect(driver)}
                    >
                      <CardHeader className="pb-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <Circle className={`h-3 w-3 ${isRecent ? 'text-green-500 animate-pulse' : 'text-orange-500'}`} fill="currentColor" />
                            {driver.displayName || 'Driver'}
                          </CardTitle>
                          <Badge variant={isRecent ? 'default' : 'secondary'} className="text-xs">
                            {isRecent ? 'LIVE' : 'OFFLINE'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1 text-xs md:text-sm">
                          <div className="flex items-center gap-2">
                            <Bus className="h-4 w-4 text-muted-foreground" />
                            <span>{driver.busNumber || 'Unknown Bus'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-muted-foreground" />
                            <span>{driver.route || 'Unknown Route'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <span>{formatSpeed(driver.speed)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatLastUpdated(driver.timestamp)}</span>
                          </div>
                          {driver.latitude && driver.longitude && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-mono">
                                {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
                              </span>
                            </div>
                          )}
                          
                          {isRecent && (
                            <div className="mt-1 p-1 bg-green-100 rounded text-xs text-green-800">
                              🔴 Real-time tracking active
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusSidebar;