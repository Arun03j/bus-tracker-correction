import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Menu, X } from 'lucide-react';
import BusMap from './components/BusMap.jsx';
import BusSidebar from './components/BusSidebar.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import UserProfile from './components/UserProfile.jsx';
import DriverVerificationForm from './components/DriverVerificationForm.jsx';
import AdminUserVerificationPanel from './components/AdminUserVerificationPanel.jsx';
import DriverLocationControl from './components/DriverLocationControl.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import useUserRole from './hooks/useUserRole.js';
import { useBusLocations } from './hooks/useBusData.js';
import './App.css';

// Main App Content Component
const AppContent = () => {
  const { user } = useAuth();
  const { userProfile, isDriver, isStudent, isAdmin, isPending, isVerified } = useUserRole();
  const { buses, loading, connected, refreshData } = useBusLocations();
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-open sidebar on desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    setSelectedDriver(null); // Clear driver selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    setSelectedBus(null); // Clear bus selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };


  // Use only real bus data from Firebase
  const displayBuses = buses;

  // Show verification form for pending drivers
  if (isDriver && isPending && showVerificationForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <DriverVerificationForm
          onSuccess={() => setShowVerificationForm(false)}
          onCancel={() => setShowVerificationForm(false)}
        />
      </div>
    );
  }

  // Show admin dashboard
  if (isAdmin && showAdminDashboard) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowAdminDashboard(false)}
            >
              ← Back to Map
            </Button>
          </div>
          <AdminDashboard />
        </div>
      </div>
    );
  }

  // Show admin panel
  if (isAdmin && showAdminPanel) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowAdminPanel(false)}
            >
              ← Back to Map
            </Button>
          </div>
          <AdminUserVerificationPanel onClose={() => setShowAdminPanel(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-2 left-2 z-[1001] bg-white shadow-lg touch-manipulation min-h-[44px]"
          onClick={toggleSidebar}
          type="button"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-[1000]' : 'relative'} 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-in-out
        ${isMobile ? 'w-full max-w-sm' : 'w-80'}
        bg-background border-r shadow-lg flex flex-col
      `}>
        {/* User Profile Section - Moved to left side below title */}
        <div className="p-2 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base md:text-lg font-bold">Bus Tracker</h1>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="h-8 w-8 p-0 touch-manipulation min-h-[44px] min-w-[44px]"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* User Profile positioned below title */}
          <div className="mb-1">
            <UserProfile compact />
          </div>

          {/* Role-based Action Buttons */}
          <div className="space-y-2">
            {isDriver && isPending && (
              <Button
                variant="outline"
                size="sm"
                className="w-full touch-manipulation min-h-[40px] text-xs"
                onClick={() => setShowVerificationForm(true)}
              >
                Complete Driver Verification
              </Button>
            )}
            
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="w-full touch-manipulation min-h-[40px] text-xs"
                onClick={() => setShowAdminPanel(true)}
              >
                Manage User Verifications
              </Button>
            )}
            
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="w-full touch-manipulation min-h-[40px] text-xs"
                onClick={() => setShowAdminDashboard(true)}
              >
                Admin Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Driver Location Control for verified drivers */}
        {isDriver && isVerified && (
          <div className="border-b">
            <DriverLocationControl />
          </div>
        )}

        {/* Bus/Driver List */}
        <div className="flex-1 overflow-hidden">
          <BusSidebar
            buses={displayBuses}
            selectedBus={selectedBus}
            onBusSelect={handleBusSelect}
            selectedDriver={selectedDriver}
            onDriverSelect={handleDriverSelect}
            loading={loading}
            connected={connected}
            onRefresh={refreshData}
          />
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
          onClick={() => setSidebarOpen(false)}
          role="button"
          aria-label="Close menu"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSidebarOpen(false);
            }
          }}
        />
      )}

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        <BusMap
          buses={displayBuses}
          selectedBus={selectedBus}
          onBusSelect={handleBusSelect}
          selectedDriver={selectedDriver}
          onDriverSelect={handleDriverSelect}
          className="h-full"
        />
        
        {/* Info Panel for selected items */}
        {(selectedBus || selectedDriver) && (
          <div className={`absolute ${isMobile ? 'top-16 left-2 right-2' : 'top-4 right-4'} bg-white rounded-lg shadow-lg p-3 ${isMobile ? '' : 'max-w-sm'} z-[500]`}>
            {selectedBus && (
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2">{selectedBus.busId}</h3>
                <div className="space-y-1 text-xs md:text-sm">
                  <p><strong>Route:</strong> {selectedBus.route}</p>
                  <p><strong>Status:</strong> {selectedBus.status}</p>
                  <p><strong>Speed:</strong> {selectedBus.speed || 0} km/h</p>
                </div>
              </div>
            )}
            
            {selectedDriver && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="font-semibold text-base md:text-lg">Live Driver</h3>
                </div>
                <div className="space-y-1 text-xs md:text-sm">
                  <p><strong>Driver:</strong> {selectedDriver.displayName}</p>
                  <p><strong>Bus:</strong> {selectedDriver.busNumber}</p>
                  <p><strong>Route:</strong> {selectedDriver.route}</p>
                  <p><strong>Speed:</strong> {Math.round((selectedDriver.speed || 0) * 3.6)} km/h</p>
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 touch-manipulation min-h-[44px] min-w-[44px] bg-white hover:bg-gray-100 rounded-full shadow-sm"
              type="button"
              onClick={() => {
                setSelectedBus(null);
                setSelectedDriver(null);
              }}
              aria-label="Close info panel"
            >
              <span className="text-lg font-bold">×</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component with Authentication
function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;

