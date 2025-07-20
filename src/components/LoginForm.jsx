// Login form component
import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { signIn, resetPassword } from '../lib/authService.js';
import { useAuthForm } from '../hooks/useAuth.jsx';

const LoginForm = ({ onSwitchToSignup, onLoginSuccess }) => {
  const { formData, errors, loading, setLoading, updateField, validateForm, resetForm } = useAuthForm();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm('signin')) {
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        resetForm();
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Please enter your email address first.' });
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(formData.email);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
      if (result.success) {
        setShowForgotPassword(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send reset email. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Sign in to access the bus tracking system
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {message.text && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="pl-10 pr-10"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="link"
              className="px-0 font-normal"
              onClick={() => setShowForgotPassword(!showForgotPassword)}
              disabled={loading}
            >
              Forgot password?
            </Button>
          </div>

          {showForgotPassword && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Enter your email address and we'll send you a password reset link.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleForgotPassword}
                disabled={loading || !formData.email}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send Reset Email
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Button
              type="button"
              variant="link"
              className="px-0 font-normal"
              onClick={onSwitchToSignup}
              disabled={loading}
            >
              Sign up
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;

