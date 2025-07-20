// Admin panel for managing driver verifications
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog.jsx';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Truck, 
  FileText,
  Shield,
  Loader2
} from 'lucide-react';
import { 
  getPendingDriverVerifications, 
  verifyDriver, 
  VERIFICATION_STATUS 
} from '../lib/userRoleService.js';

const AdminDriverPanel = () => {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingDrivers();
  }, []);

  const loadPendingDrivers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await getPendingDriverVerifications();
      if (result.success) {
        setPendingDrivers(result.data);
      } else {
        setError(result.error || 'Failed to load pending verifications');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading pending drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = (driver, action) => {
    setSelectedDriver(driver);
    setActionType(action);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const confirmVerificationAction = async () => {
    if (!selectedDriver) return;

    setProcessing(true);
    
    try {
      const status = actionType === 'approve' 
        ? VERIFICATION_STATUS.APPROVED 
        : VERIFICATION_STATUS.REJECTED;
      
      const result = await verifyDriver(selectedDriver.id, status, adminNotes);
      
      if (result.success) {
        // Remove the driver from pending list
        setPendingDrivers(prev => 
          prev.filter(driver => driver.id !== selectedDriver.id)
        );
        setDialogOpen(false);
        setSelectedDriver(null);
      } else {
        setError(result.error || 'Failed to update verification status');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating verification:', err);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading pending verifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Driver Verification Management</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pendingDrivers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Verifications</h3>
            <p className="text-muted-foreground">
              All driver verification requests have been processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingDrivers.map((driver) => (
            <Card key={driver.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {driver.displayName || 'Unknown User'}
                  </CardTitle>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                </div>
                <CardDescription>
                  Email: {driver.email} • Requested: {formatDate(driver.driverInfo?.requestedAt)}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>License:</strong> {driver.driverInfo?.licenseNumber || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Bus:</strong> {driver.driverInfo?.busNumber || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Route:</strong> {driver.driverInfo?.route || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Phone:</strong> {driver.driverInfo?.phoneNumber || 'N/A'}
                    </span>
                  </div>
                </div>

                {driver.driverInfo?.additionalInfo && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Additional Info:</strong> {driver.driverInfo.additionalInfo}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleVerificationAction(driver, 'approve')}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  
                  <Button
                    onClick={() => handleVerificationAction(driver, 'reject')}
                    variant="destructive"
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verification Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Driver Verification
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'This user will be able to share their live location as a verified driver.'
                : 'This user will not be able to share their location and may need to reapply.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p><strong>Driver:</strong> {selectedDriver.displayName}</p>
                <p><strong>Email:</strong> {selectedDriver.email}</p>
                <p><strong>Bus Number:</strong> {selectedDriver.driverInfo?.busNumber}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotes">
                  Admin Notes {actionType === 'reject' && '(Required for rejection)'}
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    actionType === 'approve' 
                      ? 'Optional notes about the approval...'
                      : 'Please provide a reason for rejection...'
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmVerificationAction}
              disabled={processing || (actionType === 'reject' && !adminNotes.trim())}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `${actionType === 'approve' ? 'Approve' : 'Reject'} Driver`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDriverPanel;

