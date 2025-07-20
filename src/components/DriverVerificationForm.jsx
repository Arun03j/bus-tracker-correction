// Driver verification request form component
import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Truck, User, Phone, MapPin, FileText, Loader2 } from 'lucide-react';
import { requestDriverVerification } from '../lib/userRoleService.js';
import { useAuth } from '../hooks/useAuth.jsx';

const DriverVerificationForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    licenseNumber: '',
    busNumber: '',
    route: '',
    phoneNumber: '',
    additionalInfo: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.licenseNumber || !formData.busNumber || !formData.route || !formData.phoneNumber) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting driver verification with data:', formData);
      const result = await requestDriverVerification(user.uid, formData);
      
      if (result.success) {
        console.log('Driver verification submitted successfully');
        onSuccess && onSuccess();
      } else {
        console.error('Driver verification failed:', result.error);
        setError(result.error || 'Failed to submit verification request');
      }
    } catch (err) {
      console.error('Driver verification error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Request Driver Verification
        </CardTitle>
        <CardDescription>
          Submit your information to become a verified bus driver and share your live location with students.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">
                <FileText className="h-4 w-4 inline mr-1" />
                Driver's License Number *
              </Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                placeholder="Enter your license number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="busNumber">
                <Truck className="h-4 w-4 inline mr-1" />
                Bus Number *
              </Label>
              <Input
                id="busNumber"
                name="busNumber"
                value={formData.busNumber}
                onChange={handleInputChange}
                placeholder="e.g., B001, Bus-15"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="route">
                <MapPin className="h-4 w-4 inline mr-1" />
                Route/Area *
              </Label>
              <Input
                id="route"
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                placeholder="e.g., Downtown - University"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number *
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Your contact number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">
              Additional Information
            </Label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleInputChange}
              placeholder="Any additional information about your driving experience, schedule, etc."
              rows={3}
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your request will be reviewed by an administrator</li>
              <li>• You'll be notified about the verification status in the app</li>
              <li>• Once approved, you can start sharing your live location</li>
              <li>• Students will be able to track your bus in real-time</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Verification Request'
            )}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default DriverVerificationForm;

