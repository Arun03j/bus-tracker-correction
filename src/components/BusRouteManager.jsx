// Bus route management component for admins
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  Route,
  Save,
  X
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const BusRouteManager = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRoute, setEditingRoute] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    routeName: '',
    routeNumber: '',
    startPoint: '',
    endPoint: '',
    stops: '',
    estimatedDuration: '',
    operatingHours: '',
    description: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'routes'), (snapshot) => {
      const routesData = [];
      snapshot.forEach((doc) => {
        routesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setRoutes(routesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      routeName: '',
      routeNumber: '',
      startPoint: '',
      endPoint: '',
      stops: '',
      estimatedDuration: '',
      operatingHours: '',
      description: ''
    });
    setEditingRoute(null);
  };

  const handleAddRoute = async () => {
    if (!formData.routeName || !formData.routeNumber) {
      setError('Route name and number are required');
      return;
    }

    try {
      await addDoc(collection(db, 'routes'), {
        ...formData,
        stops: formData.stops.split(',').map(stop => stop.trim()).filter(stop => stop),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      });

      setShowAddDialog(false);
      resetForm();
      setError('');
    } catch (err) {
      setError('Failed to add route');
      console.error('Error adding route:', err);
    }
  };

  const handleEditRoute = (route) => {
    setFormData({
      routeName: route.routeName || '',
      routeNumber: route.routeNumber || '',
      startPoint: route.startPoint || '',
      endPoint: route.endPoint || '',
      stops: Array.isArray(route.stops) ? route.stops.join(', ') : '',
      estimatedDuration: route.estimatedDuration || '',
      operatingHours: route.operatingHours || '',
      description: route.description || ''
    });
    setEditingRoute(route.id);
  };

  const handleUpdateRoute = async () => {
    if (!formData.routeName || !formData.routeNumber) {
      setError('Route name and number are required');
      return;
    }

    try {
      await updateDoc(doc(db, 'routes', editingRoute), {
        ...formData,
        stops: formData.stops.split(',').map(stop => stop.trim()).filter(stop => stop),
        updatedAt: serverTimestamp()
      });

      resetForm();
      setError('');
    } catch (err) {
      setError('Failed to update route');
      console.error('Error updating route:', err);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await deleteDoc(doc(db, 'routes', routeId));
      } catch (err) {
        setError('Failed to delete route');
        console.error('Error deleting route:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Route className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Route Management</h2>
          <p className="text-muted-foreground">Manage bus routes and schedules</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Route</DialogTitle>
              <DialogDescription>
                Create a new bus route with stops and schedule information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="routeName">Route Name *</Label>
                <Input
                  id="routeName"
                  value={formData.routeName}
                  onChange={(e) => handleInputChange('routeName', e.target.value)}
                  placeholder="e.g., Downtown Express"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="routeNumber">Route Number *</Label>
                <Input
                  id="routeNumber"
                  value={formData.routeNumber}
                  onChange={(e) => handleInputChange('routeNumber', e.target.value)}
                  placeholder="e.g., R001"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startPoint">Start Point</Label>
                <Input
                  id="startPoint"
                  value={formData.startPoint}
                  onChange={(e) => handleInputChange('startPoint', e.target.value)}
                  placeholder="e.g., Central Station"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endPoint">End Point</Label>
                <Input
                  id="endPoint"
                  value={formData.endPoint}
                  onChange={(e) => handleInputChange('endPoint', e.target.value)}
                  placeholder="e.g., University Campus"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Duration</Label>
                <Input
                  id="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                  placeholder="e.g., 45 minutes"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="operatingHours">Operating Hours</Label>
                <Input
                  id="operatingHours"
                  value={formData.operatingHours}
                  onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                  placeholder="e.g., 6:00 AM - 10:00 PM"
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="stops">Stops (comma-separated)</Label>
                <Textarea
                  id="stops"
                  value={formData.stops}
                  onChange={(e) => handleInputChange('stops', e.target.value)}
                  placeholder="e.g., Main Street, City Hall, Shopping Mall, Hospital"
                  rows={3}
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Additional route information..."
                  rows={2}
                />
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRoute}>
                <Save className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {routes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Routes Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first bus route to get started.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </CardContent>
          </Card>
        ) : (
          routes.map((route) => (
            <Card key={route.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Route className="h-5 w-5" />
                      {route.routeName}
                    </CardTitle>
                    <CardDescription>
                      Route {route.routeNumber} • {route.estimatedDuration}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={route.isActive ? 'default' : 'secondary'}>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRoute(route)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRoute(route.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Route:</strong> {route.startPoint} → {route.endPoint}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Hours:</strong> {route.operatingHours}
                    </span>
                  </div>
                </div>
                
                {route.stops && route.stops.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Stops:</p>
                    <div className="flex flex-wrap gap-1">
                      {route.stops.map((stop, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {stop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {route.description && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">{route.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Route Dialog */}
      <Dialog open={!!editingRoute} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
            <DialogDescription>
              Update route information and schedule details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editRouteName">Route Name *</Label>
              <Input
                id="editRouteName"
                value={formData.routeName}
                onChange={(e) => handleInputChange('routeName', e.target.value)}
                placeholder="e.g., Downtown Express"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editRouteNumber">Route Number *</Label>
              <Input
                id="editRouteNumber"
                value={formData.routeNumber}
                onChange={(e) => handleInputChange('routeNumber', e.target.value)}
                placeholder="e.g., R001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editStartPoint">Start Point</Label>
              <Input
                id="editStartPoint"
                value={formData.startPoint}
                onChange={(e) => handleInputChange('startPoint', e.target.value)}
                placeholder="e.g., Central Station"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editEndPoint">End Point</Label>
              <Input
                id="editEndPoint"
                value={formData.endPoint}
                onChange={(e) => handleInputChange('endPoint', e.target.value)}
                placeholder="e.g., University Campus"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editEstimatedDuration">Duration</Label>
              <Input
                id="editEstimatedDuration"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                placeholder="e.g., 45 minutes"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editOperatingHours">Operating Hours</Label>
              <Input
                id="editOperatingHours"
                value={formData.operatingHours}
                onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                placeholder="e.g., 6:00 AM - 10:00 PM"
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="editStops">Stops (comma-separated)</Label>
              <Textarea
                id="editStops"
                value={formData.stops}
                onChange={(e) => handleInputChange('stops', e.target.value)}
                placeholder="e.g., Main Street, City Hall, Shopping Mall, Hospital"
                rows={3}
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Additional route information..."
                rows={2}
              />
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleUpdateRoute}>
              <Save className="h-4 w-4 mr-2" />
              Update Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusRouteManager;