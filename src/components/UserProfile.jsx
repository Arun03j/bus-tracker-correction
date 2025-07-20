// User profile component with logout functionality
import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu.jsx';
import { User, LogOut, Mail, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { signOutUser } from '../lib/authService.js';

const UserProfile = ({ compact = false }) => {
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOutUser();
      // The auth state change will automatically redirect to login
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setDropdownOpen(false);
    }
  };

  if (!user) return null;

  // Compact version for header/navbar
  if (compact) {
    return (
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2 w-full justify-start p-2 touch-manipulation h-auto min-h-[44px]"
            type="button"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm truncate block">{user.displayName || 'User'}</span>
              <span className="text-xs text-muted-foreground truncate block">{user.email}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-64 z-[1002]"
          side="bottom"
          sideOffset={4}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <Mail className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm">{user.displayName || 'User'}</span>
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Shield className="mr-2 h-4 w-4" />
            {user.emailVerified ? 'Verified' : 'Unverified'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-red-600 focus:text-red-600"
            onSelect={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full profile card version
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>User Profile</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {user.displayName || 'User'}
            </h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email Status:</span>
            <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
              {user.emailVerified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">User ID:</span>
            <span className="text-sm font-mono">{user.uid.slice(0, 8)}...</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserProfile;

