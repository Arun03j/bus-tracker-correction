// Notification system for bus updates
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Label } from '@/components/ui/label.jsx';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { 
  Bell, 
  BellOff, 
  Clock, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { 
  collection, 
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuth } from '../hooks/useAuth.jsx';
import useUserRole from '../hooks/useUserRole.js';

const NotificationSystem = () => {
  const { user } = useAuth();
  const { userProfile } = useUserRole();
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    busArrival: true,
    busDelay: true,
    routeChanges: true,
    emergencyAlerts: true,
    selectedRoutes: []
  });
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Listen to user notifications
    if (user) {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationsData = [];
        snapshot.forEach((doc) => {
          notificationsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setNotifications(notificationsData);
        setLoading(false);
      });

      // Listen to routes
      const unsubscribeRoutes = onSnapshot(collection(db, 'routes'), (snapshot) => {
        const routesData = [];
        snapshot.forEach((doc) => {
          routesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setRoutes(routesData);
      });

      // Load user notification settings
      const settingsRef = doc(db, 'userSettings', user.uid);
      const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
          setSettings(prev => ({ ...prev, ...doc.data().notifications }));
        }
      });

      return () => {
        unsubscribeNotifications();
        unsubscribeRoutes();
        unsubscribeSettings();
      };
    }
  }, [user]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  const updateNotificationSettings = async (newSettings) => {
    if (!user) return;

    try {
      await setDoc(doc(db, 'userSettings', user.uid), {
        notifications: newSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    updateNotificationSettings(newSettings);
  };

  const handleRouteSelection = (routeId) => {
    const newRoutes = settings.selectedRoutes.includes(routeId)
      ? settings.selectedRoutes.filter(id => id !== routeId)
      : [...settings.selectedRoutes, routeId];
    
    handleSettingChange('selectedRoutes', newRoutes);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'arrival':
        return <MapPin className="h-4 w-4 text-green-500" />;
      case 'delay':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'route_change':
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type) => {
    switch (type) {
      case 'arrival':
        return <Badge className="bg-green-100 text-green-800">Arrival</Badge>;
      case 'delay':
        return <Badge className="bg-yellow-100 text-yellow-800">Delay</Badge>;
      case 'emergency':
        return <Badge className="bg-red-100 text-red-800">Emergency</Badge>;
      case 'route_change':
        return <Badge className="bg-blue-100 text-blue-800">Route Change</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return '';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Bell className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">Manage your bus tracking notifications</p>
        </div>
      </div>

      {/* Notification Permission */}
      {permission !== 'granted' && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Enable browser notifications to receive real-time bus updates.</span>
            <Button size="sm" onClick={requestNotificationPermission}>
              Enable Notifications
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Customize which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="busArrival">Bus Arrival Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your bus is approaching
                </p>
              </div>
              <Switch
                id="busArrival"
                checked={settings.busArrival}
                onCheckedChange={(checked) => handleSettingChange('busArrival', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="busDelay">Delay Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Be informed about bus delays and schedule changes
                </p>
              </div>
              <Switch
                id="busDelay"
                checked={settings.busDelay}
                onCheckedChange={(checked) => handleSettingChange('busDelay', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="routeChanges">Route Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Updates about route modifications and detours
                </p>
              </div>
              <Switch
                id="routeChanges"
                checked={settings.routeChanges}
                onCheckedChange={(checked) => handleSettingChange('routeChanges', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emergencyAlerts">Emergency Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important safety and service announcements
                </p>
              </div>
              <Switch
                id="emergencyAlerts"
                checked={settings.emergencyAlerts}
                onCheckedChange={(checked) => handleSettingChange('emergencyAlerts', checked)}
              />
            </div>
          </div>

          {/* Route Selection */}
          <div className="space-y-2">
            <Label>Preferred Routes</Label>
            <p className="text-sm text-muted-foreground">
              Select routes you want to receive notifications for
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {routes.map((route) => (
                <Button
                  key={route.id}
                  type="button"
                  variant={settings.selectedRoutes.includes(route.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRouteSelection(route.id)}
                  className="justify-start"
                >
                  {route.routeNumber} - {route.routeName}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
          <CardDescription>
            Your latest bus tracking notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">
                You'll see bus updates and alerts here when they arrive.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    notification.read ? 'bg-muted/30' : 'bg-background'
                  }`}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{notification.title}</h4>
                      <div className="flex items-center gap-2">
                        {getNotificationBadge(notification.type)}
                        <span className="text-xs text-muted-foreground">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    
                    {notification.routeInfo && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {notification.routeInfo.routeNumber}
                        </Badge>
                        {notification.routeInfo.busNumber && (
                          <span>Bus {notification.routeInfo.busNumber}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSystem;