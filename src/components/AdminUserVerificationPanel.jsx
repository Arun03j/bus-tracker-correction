// Enhanced admin panel for manual user verification with mobile optimization
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Mail, 
  Car, 
  GraduationCap,
  Shield,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { verifyDriver } from '../lib/userRoleService.js';

const AdminUserVerificationPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listen to pending users
    const pendingQuery = query(
      collection(db, 'users'),
      where("isPending", "==", true)
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
        .filter(user => user.isVerified === false)
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
      setPendingUsers(users);
      setLoading(false);
    });

    // Listen to verified users
    const verifiedQuery = query(
      collection(db, 'users'),
      where("isVerified", "==", true)
    );

    const unsubscribeVerified = onSnapshot(verifiedQuery, (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
        .sort((a, b) => {
          const aTime = a.verifiedAt?.seconds || 0;
          const bTime = b.verifiedAt?.seconds || 0;
          return bTime - aTime;
        });
      setVerifiedUsers(users);
    });

    return () => {
      unsubscribePending();
      unsubscribeVerified();
    };
  }, []);

  const handleApproveUser = async (userId, userEmail) => {
    setActionLoading(true);
    setError('');
    try {
      const result = await verifyDriver(userId, true, `Approved by ${user.email}`);
      
      if (!result.success) {
        setError(result.error || 'Failed to approve user');
        return;
      }

      // You could also send a notification email here if needed
      console.log(`User ${userEmail} approved by ${user.email}`);
    } catch (error) {
      console.error('Error approving user:', error);
      setError('An unexpected error occurred while approving user');
    } finally {
      setActionLoading(false);
      setSelectedUser(null);
    }
  };

  const handleRejectUser = async (userId, userEmail) => {
    setActionLoading(true);
    setError('');
    try {
      const result = await verifyDriver(userId, false, `Rejected by ${user.email}`);
      
      if (!result.success) {
        setError(result.error || 'Failed to reject user');
        return;
      }

      console.log(`User ${userEmail} rejected by ${user.email}`);
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('An unexpected error occurred while rejecting user');
    } finally {
      setActionLoading(false);
      setSelectedUser(null);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'driver':
        return <Car className="h-4 w-4" />;
      case 'student':
        return <GraduationCap className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'driver':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const UserCard = ({ user: userData, isPending = true }) => (
    <Card className="mb-4">
      <CardContent className="p-3 sm:p-4">
        {/* Mobile-first layout */}
        <div className="space-y-3">
          {/* User info section */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {getRoleIcon(userData.role)}
              <div>
                <h3 className="font-semibold text-sm sm:text-base truncate">{userData.displayName}</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{userData.email}</p>
              </div>
            </div>
            <Badge className={getRoleBadgeColor(userData.role)}>
              {userData.role}
            </Badge>
          </div>
          
          {/* Action buttons section */}
          {isPending ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedUser(userData)}
                    className="w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Review User Application</DialogTitle>
                    <DialogDescription>
                      Review the details and approve or reject this user's access.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-gray-600">{userData.displayName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-gray-600 break-all">{userData.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Role</label>
                        <p className="text-sm text-gray-600 capitalize">{userData.role}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Applied</label>
                        <p className="text-sm text-gray-600">
                          {userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    
                    {userData.role === 'driver' && (
                      <div className="space-y-3">
                        <Alert>
                          <Car className="h-4 w-4" />
                          <AlertDescription>
                            This user is applying for driver access. Drivers can share their live location for bus tracking.
                          </AlertDescription>
                        </Alert>
                        
                        {userData.driverInfo && (
                          <div className="p-3 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">Driver Information</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">License:</span> {userData.driverInfo.licenseNumber}
                              </div>
                              <div>
                                <span className="font-medium">Bus Number:</span> {userData.driverInfo.busNumber}
                              </div>
                              <div>
                                <span className="font-medium">Route:</span> {userData.driverInfo.route}
                              </div>
                              <div>
                                <span className="font-medium">Phone:</span> {userData.driverInfo.phoneNumber}
                              </div>
                            </div>
                            {userData.driverInfo.additionalInfo && (
                              <div className="mt-2">
                                <span className="font-medium">Additional Info:</span>
                                <p className="text-sm text-muted-foreground mt-1">{userData.driverInfo.additionalInfo}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:space-x-2 space-y-2 sm:space-y-0">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRejectUser(userData.id, userData.email)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {actionLoading ? 'Rejecting...' : 'Reject'}
                    </Button>
                    <Button 
                      onClick={() => handleApproveUser(userData.id, userData.email)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto order-1 sm:order-2"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {actionLoading ? 'Approving...' : 'Approve'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Quick action buttons for mobile */}
              <div className="flex gap-2 sm:hidden">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRejectUser(userData.id, userData.email)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleApproveUser(userData.id, userData.email)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">User Verification Panel</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage user access and verification</p>
        </div>
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Close Panel
        </Button>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger value="pending" className="flex items-center space-x-2 text-xs sm:text-sm py-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">({pendingUsers.length})</span>
            <span className="hidden sm:inline">({pendingUsers.length})</span>
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center space-x-2 text-xs sm:text-sm py-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Verified</span>
            <span className="sm:hidden">({verifiedUsers.length})</span>
            <span className="hidden sm:inline">({verifiedUsers.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Clock className="h-5 w-5" />
                <span>Pending Verification</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Users waiting for admin approval to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] sm:h-96">
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pending users</p>
                  </div>
                ) : (
                  pendingUsers.map(userData => (
                    <UserCard key={userData.id} user={userData} isPending={true} />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <UserCheck className="h-5 w-5" />
                <span>Verified Users</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Users who have been approved and have access to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] sm:h-96">
                {verifiedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No verified users yet</p>
                  </div>
                ) : (
                  verifiedUsers.map(userData => (
                    <UserCard key={userData.id} user={userData} isPending={false} />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserVerificationPanel;
            {isPending ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUser(userData)}
                    >
                      <Eye className="h-4 w-4 sm:mr-1" />
                      Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Review User Application</DialogTitle>
                      <DialogDescription>
                        Review the details and approve or reject this user's access.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <p className="text-sm text-gray-600">{userData.displayName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <p className="text-sm text-gray-600">{userData.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Role</label>
                          <p className="text-sm text-gray-600 capitalize">{userData.role}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Applied</label>
                          <p className="text-sm text-gray-600">
                            {userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                      
                      {userData.role === 'driver' && (
                        <div className="space-y-3">
                          <Alert>
                            <Car className="h-4 w-4" />
                            <AlertDescription>
                              This user is applying for driver access. Drivers can share their live location for bus tracking.
                            </AlertDescription>
                          </Alert>
                          
                          {userData.driverInfo && (
                            <div className="p-3 bg-muted rounded-lg">
                              <h4 className="font-medium mb-2">Driver Information</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">License:</span> {userData.driverInfo.licenseNumber}
                                </div>
                                <div>
                                  <span className="font-medium">Bus Number:</span> {userData.driverInfo.busNumber}
                                </div>
                                <div>
                                  <span className="font-medium">Route:</span> {userData.driverInfo.route}
                                </div>
                                <div>
                                  <span className="font-medium">Phone:</span> {userData.driverInfo.phoneNumber}
                                </div>
                              </div>
                              {userData.driverInfo.additionalInfo && (
                                <div className="mt-2">
                                  <span className="font-medium">Additional Info:</span>
                                  <p className="text-sm text-muted-foreground mt-1">{userData.driverInfo.additionalInfo}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleRejectUser(userData.id, userData.email)}
                        disabled={actionLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {actionLoading ? 'Rejecting...' : 'Reject'}
                      </Button>
                      <Button 
                        onClick={() => handleApproveUser(userData.id, userData.email)}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {actionLoading ? 'Approving...' : 'Approve'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  };
  

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Verification Panel</h1>
          <p className="text-gray-600">Manage user access and verification</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close Panel
        </Button>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pending ({pendingUsers.length})</span>
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4" />
            <span>Verified ({verifiedUsers.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Pending Verification</span>
              </CardTitle>
              <CardDescription>
                Users waiting for admin approval to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] sm:h-96">
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pending users</p>
                  </div>
                ) : (
                  pendingUsers.map(userData => (
                    <UserCard key={userData.id} user={userData} isPending={true} />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5" />
                <span>Verified Users</span>
              </CardTitle>
              <CardDescription>
                Users who have been approved and have access to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] sm:h-96">
                {verifiedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No verified users yet</p>
                  </div>
                ) : (
                  verifiedUsers.map(userData => (
                    <UserCard key={userData.id} user={userData} isPending={false} />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserVerificationPanel;
