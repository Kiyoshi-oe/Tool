
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from location state, or default to home
  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      return;
    }

    let success;
    if (isLogin) {
      success = await login(username, password);
    } else {
      success = await register(username, password);
    }

    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyrus-dark p-4">
      <Card className="w-full max-w-md bg-cyrus-dark-light border-cyrus-dark-lightest animate-scale-in">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Shield size={48} className="text-cyrus-blue" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isLogin ? 'Login to Cyrus Resource Tool' : 'Create an Account'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isLogin 
              ? 'Enter your credentials to access your account'
              : 'Register to start using the Cyrus Resource Tool'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              id="username"
              label="Username"
              type="text"
              value={username}
              onChange={setUsername}
              placeholder="Enter your username"
              required
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              required
            />
            <Button 
              type="submit" 
              className="w-full bg-cyrus-blue hover:bg-blue-700"
            >
              {isLogin ? (
                <><LogIn size={16} /><span>Login</span></>
              ) : (
                <><UserPlus size={16} /><span>Register</span></>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-cyrus-blue hover:underline focus:outline-none"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
