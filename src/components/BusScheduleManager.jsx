// Bus schedule management component
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog.jsx';
import { 
  Plus, 
  Clock, 
  Calendar, 
  Bus,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const BusScheduleManager = () => {
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    routeId: '',
    busNumber: '',
    departureTime: '',
    arrivalTime: '',
    frequency: '',
    daysOfWeek: [],
    isActive: true
  });

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    // Listen to schedules
    const schedulesQuery = query(
      collection(db, 'schedules'),
      orderBy('departureTime', 'asc')
    );
    
    const unsubscribeSchedules = onSnapshot(schedulesQuery, (snapshot) => {
      const schedulesData = [];
      snapshot.forEach((doc) => {
        schedulesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setSchedules(schedulesData);
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

    return () => {
      unsubscribeSchedules();
      unsubscribeRoutes();
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      busNumber: '',
      departureTime: '',
      arrivalTime: '',
      frequency: '',
      daysOfWeek: [],
      isActive: true
    });
    setEditingSchedule(null);
  };

  const handleAddSchedule = async () => {
    if (!formData.routeId || !formData.busNumber || !formData.departureTime) {
      setError('Route, bus number, and departure time are required');
      return;
    }

    try {
      const selectedRoute = routes.find(r => r.id === formData.routeId);
      
      await addDoc(collection(db, 'schedules'), {
        ...formData,
        routeName: selectedRoute?.routeName || '',
        routeNumber: selectedRoute?.routeNumber || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setShowAddDialog(false);
      resetForm();
      setError('');
    } catch (err) {
      setError('Failed to add schedule');
      console.error('Error adding schedule:', err);
    }
  };

  const handleEditSchedule = (schedule) => {
    setFormData({
      routeId: schedule.routeId || '',
      busNumber: schedule.busNumber || '',
      departureTime: schedule.departureTime || '',
      arrivalTime: schedule.arrivalTime || '',
      frequency: schedule.frequency || '',
      daysOfWeek: schedule.daysOfWeek || [],
      isActive: schedule.isActive !== false
    });
    setEditingSchedule(schedule.id);
  };

  const handleUpdateSchedule = async () => {
    if (!formData.routeId || !formData.busNumber || !formData.departureTime) {
      setError('Route, bus number, and departure time are required');
      return;
    }

    try {
      const selectedRoute = routes.find(r => r.id === formData.routeId);
      
      await updateDoc(doc(db, 'schedules', editingSchedule), {
        ...formData,
        routeName: selectedRoute?.routeName || '',
        routeNumber: selectedRoute?.routeNumber || '',
        updatedAt: serverTimestamp()
      });

      resetForm();
      setError('');
    } catch (err) {
      setError('Failed to update schedule');
      console.error('Error updating schedule:', err);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteDoc(doc(db, 'schedules', scheduleId));
      } catch (err) {
        setError('Failed to delete schedule');
        console.error('Error deleting schedule:', err);
      }
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedule Management</h2>
          <p className="text-muted-foreground">Manage bus schedules and timetables</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Schedule</DialogTitle>
              <DialogDescription>
                Create a new bus schedule for a specific route.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="routeSelect">Route *</Label>
                <Select value={formData.routeId} onValueChange={(value) => handleInputChange('routeId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.routeNumber} - {route.routeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="busNumber">Bus Number *</Label>
                <Input
                  id="busNumber"
                  value={formData.busNumber}
                  onChange={(e) => handleInputChange('busNumber', e.target.value)}
                  placeholder="e.g., B001"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Departure Time *</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => handleInputChange('departureTime', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Time</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Input
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  placeholder="e.g., Every 30 minutes"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={formData.daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleDayToggle(day.value)}
                    >
                      {day.label.slice(0, 3)}
                    </Button>
                  ))}
                </div>
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
              <Button onClick={handleAddSchedule}>
                Add Schedule
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
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Schedules Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first bus schedule to get started.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bus className="h-5 w-5" />
                      Bus {schedule.busNumber}
                    </CardTitle>
                    <CardDescription>
                      {schedule.routeNumber} - {schedule.routeName}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Departure:</strong> {formatTime(schedule.departureTime)}
                    </span>
                  </div>
                  
                  {schedule.arrivalTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Arrival:</strong> {formatTime(schedule.arrivalTime)}
                      </span>
                    </div>
                  )}
                  
                  {schedule.frequency && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Frequency:</strong> {schedule.frequency}
                      </span>
                    </div>
                  )}
                </div>
                
                {schedule.daysOfWeek && schedule.daysOfWeek.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Operating Days:</p>
                    <div className="flex flex-wrap gap-1">
                      {schedule.daysOfWeek.map((day) => (
                        <Badge key={day} variant="outline" className="text-xs capitalize">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Schedule Dialog */}
      <Dialog open={!!editingSchedule} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update bus schedule information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editRouteSelect">Route *</Label>
              <Select value={formData.routeId} onValueChange={(value) => handleInputChange('routeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.routeNumber} - {route.routeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editBusNumber">Bus Number *</Label>
              <Input
                id="editBusNumber"
                value={formData.busNumber}
                onChange={(e) => handleInputChange('busNumber', e.target.value)}
                placeholder="e.g., B001"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDepartureTime">Departure Time *</Label>
                <Input
                  id="editDepartureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => handleInputChange('departureTime', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editArrivalTime">Arrival Time</Label>
                <Input
                  id="editArrivalTime"
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editFrequency">Frequency</Label>
              <Input
                id="editFrequency"
                value={formData.frequency}
                onChange={(e) => handleInputChange('frequency', e.target.value)}
                placeholder="e.g., Every 30 minutes"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={formData.daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.label.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSchedule}>
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusScheduleManager;