
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Key, UserCheck, UserX, ArrowLeft, Shield, User, Users, Trash, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Admin = () => {
  const { user, isAdmin, getUsers, generateLicenseKey, updateUser, deleteUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState(() => getUsers());
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showRefreshMessage, setShowRefreshMessage] = useState(false);

  // If not authenticated or not admin, redirect
  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/account');
    }
  }, [user, isAdmin, navigate]);

  // Refresh user list when component mounts and when actions are performed
  useEffect(() => {
    setUsers(getUsers());
  }, [getUsers]);

  const handleNavigateBack = () => {
    navigate('/account');
  };

  const handleGenerateLicense = (userId: string) => {
    const licenseKey = generateLicenseKey(userId);
    if (licenseKey) {
      // Update local state to reflect changes
      setUsers(getUsers());
      setShowRefreshMessage(true);
      setTimeout(() => setShowRefreshMessage(false), 3000);
    }
  };

  const confirmDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      const success = deleteUser(userToDelete);
      if (success) {
        // Update local state to reflect changes
        setUsers(getUsers());
        setShowRefreshMessage(true);
        setTimeout(() => setShowRefreshMessage(false), 3000);
      }
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setUserToDelete(null);
  };

  if (!user || !isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyrus-dark p-4">
      <Card className="w-full max-w-4xl bg-cyrus-dark-light border-cyrus-dark-lightest animate-scale-in">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield size={32} className="text-cyrus-gold" />
              <div>
                <CardTitle className="text-2xl font-bold text-white">Admin Dashboard</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage users and license keys
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={handleNavigateBack}
              variant="outline" 
              size="sm"
              className="border-cyrus-dark-lightest text-white hover:bg-cyrus-dark-lightest"
            >
              <ArrowLeft size={16} />
              <span>Back to Account</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showRefreshMessage && (
            <div className="bg-cyrus-blue/20 border border-cyrus-blue rounded-md p-3 flex items-center text-sm text-white mb-4">
              <RefreshCw size={16} className="mr-2 animate-spin" />
              <span>Changes applied successfully</span>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Users size={20} className="mr-2 text-cyrus-blue" />
              User Management
            </h3>
            
            <div className="rounded-md border border-cyrus-dark-lightest overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-cyrus-dark-lighter">
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">License</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyrus-dark-lightest bg-cyrus-dark-light">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-cyrus-dark-lighter transition-colors">
                      <td className="py-3 px-4 text-sm text-white">{u.username}</td>
                      <td className="py-3 px-4 text-sm">
                        {u.isAdmin ? (
                          <span className="flex items-center text-cyrus-gold">
                            <Shield size={14} className="mr-1" /> Admin
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-300">
                            <User size={14} className="mr-1" /> User
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {u.hasLicense ? (
                          <span className="flex items-center text-green-500">
                            <UserCheck size={14} className="mr-1" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center text-red-500">
                            <UserX size={14} className="mr-1" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm flex items-center space-x-2">
                        {!u.hasLicense && (
                          <Button 
                            onClick={() => handleGenerateLicense(u.id)} 
                            size="sm"
                            className="bg-cyrus-blue hover:bg-blue-700"
                          >
                            <Key size={14} />
                            <span>Generate License</span>
                          </Button>
                        )}
                        {u.hasLicense && u.licenseKey && (
                          <div className="text-xs text-gray-400 truncate max-w-[200px]" title={u.licenseKey}>
                            Key: {u.licenseKey}
                          </div>
                        )}
                        {!u.isAdmin && (
                          <Button 
                            onClick={() => confirmDeleteUser(u.id)} 
                            size="sm"
                            variant="destructive"
                            className="ml-2"
                          >
                            <Trash size={14} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-cyrus-dark-lightest pt-4 text-xs text-gray-400">
          <p>Admin controls are restricted to administrator accounts only. All changes are securely logged.</p>
        </CardFooter>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={userToDelete !== null} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="bg-cyrus-dark-light border-cyrus-dark-lightest text-white">
          <DialogHeader>
            <DialogTitle>Confirm User Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              This action cannot be undone. The user will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this user?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete} className="border-cyrus-dark-lightest text-white">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
