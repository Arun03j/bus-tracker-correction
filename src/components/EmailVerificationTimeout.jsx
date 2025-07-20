// Email verification timeout component
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Mail, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { signOutUser, getCurrentUser } from '../lib/authService.js';

const EmailVerificationTimeout = ({ onTimeout, onVerified }) => {
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Check verification status every 5 seconds
    const verificationCheck = setInterval(async () => {
      const user = getCurrentUser();
      if (user) {
        await user.reload(); // Refresh user data
        if (user.emailVerified) {
          clearInterval(verificationCheck);
          clearInterval(countdownTimer);
          if (onVerified) {
            onVerified();
          }
          return;
        }
      }
    }, 5000);

    // Countdown timer
    const countdownTimer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(countdownTimer);
          clearInterval(verificationCheck);
          handleTimeout();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      clearInterval(verificationCheck);
      clearInterval(countdownTimer);
    };
  }, []);

  const handleTimeout = async () => {
    setMessage({ 
      type: 'error', 
      text: 'Email verification timeout. You will be redirected to the login page.' 
    });
    
    // Sign out the user and redirect to login
    await signOutUser();
    
    setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
    }, 2000);
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setMessage({ type: '', text: '' });

    try {
      const user = getCurrentUser();
      if (user && !user.emailVerified) {
        await user.sendEmailVerification();
        setMessage({ 
          type: 'success', 
          text: 'Verification email sent! Please check your inbox and spam folder.' 
        });
        // Reset timer to 3 minutes
        setTimeLeft(180);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to resend verification email. Please try again.' 
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await signOutUser();
    if (onTimeout) {
      onTimeout();
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const user = getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-amber-100 rounded-full w-fit">
            <Mail className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-amber-700">
            Email Verification Required
          </CardTitle>
          <CardDescription className="text-center">
            Please check your email and click the verification link to access the bus tracking system.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message.text && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Verification email sent to:
            </p>
            <p className="font-semibold text-gray-900">
              {user?.email}
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 p-4 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-mono font-semibold text-gray-700">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-gray-500">remaining</span>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Didn't receive the email? Check your spam folder or contact support.</p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleResendEmail}
              disabled={isResending || timeLeft <= 0}
              className="w-full"
              variant="outline"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button 
              onClick={handleBackToLogin}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            You will be automatically redirected to the login page if verification is not completed within the time limit.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationTimeout;

