
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { encryptData, decryptData, hashPassword, comparePasswords } from '@/utils/encryption';

// User and auth types
export type User = {
  id: string;
  username: string;
  isAdmin: boolean;
  hasLicense: boolean;
  licenseKey?: string;
  // Store hashed password in user object
  passwordHash: string;
  // Add created date
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasLicense: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  activateLicense: (licenseKey: string) => Promise<boolean>;
  getUsers: () => User[];
  generateLicenseKey: (userId: string) => string;
  updateUser: (userId: string, updates: Partial<Omit<User, 'id' | 'passwordHash'>>) => boolean;
  deleteUser: (userId: string) => boolean;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users including admin with hashed password
const DEFAULT_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    isAdmin: true,
    hasLicense: true,
    licenseKey: 'admin-license',
    passwordHash: hashPassword('admin'), // Store hashed password 
    createdAt: new Date().toISOString()
  }
];

// Valid license keys
const VALID_LICENSE_KEYS = ['admin-123-321'];

// Storage keys
const USERS_STORAGE_KEY = 'encrypted_users';
const CURRENT_USER_STORAGE_KEY = 'encrypted_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    try {
      // Try to load encrypted users from localStorage
      const encryptedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (encryptedUsers) {
        const decryptedUsers = decryptData(encryptedUsers);
        return JSON.parse(decryptedUsers);
      }
      return DEFAULT_USERS;
    } catch (error) {
      console.error('Error loading users:', error);
      return DEFAULT_USERS;
    }
  });

  // Initialize authentication state from localStorage
  useEffect(() => {
    try {
      const encryptedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (encryptedUser) {
        const decryptedUser = decryptData(encryptedUser);
        setUser(JSON.parse(decryptedUser));
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }, []);

  // Save users to localStorage when they change
  useEffect(() => {
    try {
      const encryptedUsers = encryptData(JSON.stringify(users));
      localStorage.setItem(USERS_STORAGE_KEY, encryptedUsers);
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }, [users]);

  // Save current user to localStorage when it changes
  useEffect(() => {
    try {
      if (user) {
        const encryptedUser = encryptData(JSON.stringify(user));
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, encryptedUser);
      } else {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving current user:', error);
    }
  }, [user]);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Find user in our user database
    const foundUser = users.find(u => u.username === username);
    
    if (foundUser) {
      // Check if password matches using secure comparison
      if (comparePasswords(password, foundUser.passwordHash)) {
        setUser(foundUser);
        toast.success(`Welcome ${username}!`);
        return true;
      }
    }

    toast.error('Invalid username or password');
    return false;
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    // Check if username already exists
    if (users.some(u => u.username === username)) {
      toast.error('Username already exists');
      return false;
    }

    // Create new user with hashed password
    const newUser: User = {
      id: Date.now().toString(),
      username,
      isAdmin: false,
      hasLicense: false,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    // Update users array
    setUsers([...users, newUser]);
    
    // Log in as the new user
    setUser(newUser);
    toast.success('Registration successful!');
    
    // Log the registration event (in a real app, this could be sent to a secure server)
    console.log(`New user registered: ${username} at ${new Date().toISOString()}`);
    
    return true;
  };

  const logout = () => {
    setUser(null);
    toast.info('Logged out successfully');
  };

  const activateLicense = async (licenseKey: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to activate a license');
      return false;
    }

    // Check if the license key is valid
    if (VALID_LICENSE_KEYS.includes(licenseKey)) {
      // Update the user's license status
      const updatedUser = { ...user, hasLicense: true, licenseKey };
      setUser(updatedUser);
      
      // Update in the users array
      const updatedUsers = users.map(u => 
        u.id === user.id ? updatedUser : u
      );
      setUsers(updatedUsers);
      
      toast.success('License activated successfully!');
      return true;
    }

    toast.error('Invalid license key');
    return false;
  };

  const getUsers = (): User[] => {
    // Return user data without exposing password hashes
    return users.map(u => ({
      ...u,
      passwordHash: '[PROTECTED]' // Don't expose actual hash
    })) as User[];
  };

  const generateLicenseKey = (userId: string): string => {
    if (!user?.isAdmin) {
      toast.error('Only administrators can generate license keys');
      return '';
    }

    // Generate a license key (in a real app, this would be more secure)
    const licenseKey = `license-${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Add to valid keys
    VALID_LICENSE_KEYS.push(licenseKey);
    
    // Update the user if a userId is provided
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, hasLicense: true, licenseKey } : u
    );
    
    setUsers(updatedUsers);
    
    toast.success('License key generated successfully');
    return licenseKey;
  };

  const updateUser = (userId: string, updates: Partial<Omit<User, 'id' | 'passwordHash'>>): boolean => {
    if (!user?.isAdmin) {
      toast.error('Only administrators can update users');
      return false;
    }

    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) {
      toast.error('User not found');
      return false;
    }

    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, ...updates } : u
    );
    
    setUsers(updatedUsers);
    
    // If updating the current user, update the user state as well
    if (user.id === userId) {
      setUser({ ...user, ...updates });
    }
    
    toast.success('User updated successfully');
    return true;
  };

  const deleteUser = (userId: string): boolean => {
    if (!user?.isAdmin) {
      toast.error('Only administrators can delete users');
      return false;
    }

    // Prevent deleting the admin account
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      toast.error('User not found');
      return false;
    }

    if (userToDelete.isAdmin) {
      toast.error('Cannot delete admin account');
      return false;
    }

    // If deleting the current user, log out
    if (user.id === userId) {
      logout();
    }

    // Remove the user from the users array
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    
    toast.success('User deleted successfully');
    return true;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    hasLicense: user?.hasLicense || false,
    login,
    register,
    logout,
    activateLicense,
    getUsers,
    generateLicenseKey,
    updateUser,
    deleteUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
