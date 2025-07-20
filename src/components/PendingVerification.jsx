// Pending verification component for users awaiting admin approval
import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Clock, User, Mail, ArrowLeft } from 'lucide-react';
import { signOutUser } from '../lib/authService.js';

const PendingVerification = ({ user, userProfile }) => {
  const handleSignOut = async () => {
    await signOutUser();
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'driver':
        return 'Bus Driver';
      case 'student':
        return 'Student';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'driver':
        return 'Your driver verification request is being reviewed. Once approved, you will be able to share your live location for bus tracking.';
      case 'student':
        return 'Your account is being reviewed. Once approved, you will be able to view bus locations and track live drivers.';
      default:
        return 'Your account is being reviewed by an administrator. You will receive access once approved.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-amber-100 rounded-full w-fit">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-amber-700">
            Account Pending Verification
          </CardTitle>
          <CardDescription className="text-center">
            Your account is awaiting admin approval before you can access the bus tracking system.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-700">
              <strong>Status:</strong> Your account has been created successfully and is currently under review.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-semibold text-gray-900">{userProfile?.displayName || user?.displayName || 'User'}</p>
                <p className="text-sm text-gray-600">{getRoleDisplayName(userProfile?.role || 'student')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-semibold text-gray-900">{user?.email}</p>
                <p className="text-sm text-gray-600">Registered Email</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <p className="text-sm text-blue-700 mb-3">
              {getRoleDescription(userProfile?.role || 'student')}
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• An administrator will review your account details</li>
              {userProfile?.role === 'driver' && userProfile?.driverInfo && (
                <li>• Your driver information and credentials will be verified</li>
              )}
              <li>• You will receive access once approved</li>
              <li>• This process typically takes 24-48 hours</li>
            </ul>
          </div>

          {userProfile?.isRejected && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Application Rejected:</strong> Your verification request was not approved. 
                {userProfile?.adminNotes && (
                  <span> Reason: {userProfile.adminNotes}</span>
                )}
                Please contact the administrator for more information.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-gray-600">
            <p>Need help? Contact the administrator for assistance.</p>
          </div>

          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sign Out
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Account created: {userProfile?.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingVerification;

