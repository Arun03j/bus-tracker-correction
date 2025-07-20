// Signup form component with role selection
import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle, Car, GraduationCap } from 'lucide-react';
import { signUp } from '../lib/authService.js';
import { useAuthForm } from '../hooks/useAuth.jsx';

const SignupForm = ({ onSwitchToLogin, onSignupSuccess }) => {
  const { formData, errors, loading, setLoading, updateField, validateForm, resetForm } = useAuthForm();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm('signup')) {
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(formData.email, formData.password, formData.displayName, selectedRole);        if (result.success) {
          setMessage({ type: 'success', text: result.message });
          resetForm();
          // Do NOT call onSignupSuccess here, as it would redirect to the main app.
          // The ProtectedRoute will handle showing PendingVerification.
        } else {   setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const strengthLevels = [
      { text: 'Very Weak', color: 'bg-red-500' },
      { text: 'Weak', color: 'bg-orange-500' },
      { text: 'Fair', color: 'bg-yellow-500' },
      { text: 'Good', color: 'bg-blue-500' },
      { text: 'Strong', color: 'bg-green-500' }
    ];

    return { strength, ...strengthLevels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Join the bus tracking system
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {message.text && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>I am a:</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedRole === 'student'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <GraduationCap className="h-6 w-6" />
                  <span className="text-sm font-medium">Student</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('driver')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedRole === 'driver'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Car className="h-6 w-6" />
                  <span className="text-sm font-medium">Bus Driver</span>
                </div>
              </button>
            </div>
            {selectedRole === 'driver' && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                Driver accounts require admin approval before access is granted.
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your full name"
                value={formData.displayName}
                onChange={(e) => updateField('displayName', e.target.value)}
                className={`pl-10 ${errors.displayName ? 'border-red-500' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.displayName && (
              <p className="text-sm text-red-600">{errors.displayName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{passwordStrength.text}</span>
                </div>
              </div>
            )}
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Passwords match</span>
              </div>
            )}
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              Sign in
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SignupForm;

