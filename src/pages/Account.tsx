
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { UserRound, Key, LogOut, Shield, Users } from 'lucide-react';

const Account = () => {
  const { user, logout, activateLicense, isAdmin, hasLicense } = useAuth();
  const [licenseKey, setLicenseKey] = useState('');
  const navigate = useNavigate();

  // If not authenticated, redirect to login
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (licenseKey.trim()) {
      const success = await activateLicense(licenseKey);
      if (success) {
        setLicenseKey('');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToAdmin = () => {
    navigate('/admin');
  };

  const navigateToTool = () => {
    navigate('/');
  };

  if (!user) {
    return null; // Will redirect to login via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyrus-dark p-4">
      <Card className="w-full max-w-lg bg-cyrus-dark-light border-cyrus-dark-lightest animate-scale-in">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <UserRound size={32} className="text-cyrus-blue" />
            <div>
              <CardTitle className="text-2xl font-bold text-white">Account</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your account and license information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">User Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-gray-400">Username:</div>
              <div className="text-white font-medium">{user.username}</div>
              
              <div className="text-gray-400">Account Type:</div>
              <div className="text-white font-medium">
                {isAdmin ? (
                  <span className="flex items-center text-cyrus-gold">
                    <Shield size={16} className="mr-1" /> Administrator
                  </span>
                ) : (
                  'Standard User'
                )}
              </div>
              
              <div className="text-gray-400">License Status:</div>
              <div className="text-white font-medium">
                {hasLicense ? (
                  <span className="text-green-500">Active</span>
                ) : (
                  <span className="text-red-500">Inactive</span>
                )}
              </div>
              
              {user.licenseKey && (
                <>
                  <div className="text-gray-400">License Key:</div>
                  <div className="text-white font-medium">{user.licenseKey}</div>
                </>
              )}
            </div>
          </div>
          
          {/* License Activation (only show if not licensed) */}
          {!hasLicense && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">License Activation</h3>
              <form onSubmit={handleActivateLicense} className="space-y-4">
                <FormField
                  id="licenseKey"
                  label="License Key"
                  type="text"
                  value={licenseKey}
                  onChange={setLicenseKey}
                  placeholder="Enter your license key"
                  helperText="Enter your license key to activate editor mode"
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full bg-cyrus-blue hover:bg-blue-700"
                >
                  <Key size={16} />
                  <span>Activate License</span>
                </Button>
              </form>
            </div>
          )}

          {/* Navigate to Tool button */}
          <Button 
            onClick={navigateToTool}
            className="w-full bg-cyrus-blue hover:bg-blue-700"
          >
            <span>Open Cyrus Resource Tool</span>
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 border-t border-cyrus-dark-lightest pt-4">
          {isAdmin && (
            <Button 
              onClick={navigateToAdmin}
              className="w-full bg-cyrus-dark-lighter hover:bg-cyrus-dark-lightest"
            >
              <Users size={16} />
              <span>Admin Dashboard</span>
            </Button>
          )}
          
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="w-full border-cyrus-dark-lightest text-white hover:bg-cyrus-dark-lightest"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Account;
