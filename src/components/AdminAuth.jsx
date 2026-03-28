import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Legacy superadmin fallback credentials
const LEGACY_USERNAME = 'Ponchordzp';
const LEGACY_PASSWORD_HASH = ''; // will be computed lazily

export default function AdminAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('app_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setIsAuthenticated(true);
      } catch {}
    }
    setCheckingSession(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check legacy hardcoded superadmin
    if (username === LEGACY_USERNAME && password === 'Miniclip1!') {
      const user = { id: 'legacy', username: LEGACY_USERNAME, full_name: 'Super Admin', role: 'superadmin', assigned_boat: '' };
      sessionStorage.setItem('app_user', JSON.stringify(user));
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    // Look up user in AppUser entity
    const pwHash = await hashPassword(password);
    const users = await base44.entities.AppUser.list();
    const match = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password_hash === pwHash
    );

    if (!match) {
      setError('Invalid username or password');
      setLoading(false);
      return;
    }
    if (match.is_active === false) {
      setError('This account has been deactivated. Contact your administrator.');
      setLoading(false);
      return;
    }

    // Update last_login
    base44.entities.AppUser.update(match.id, { last_login: new Date().toISOString() });

    const user = {
      id: match.id,
      username: match.username,
      full_name: match.full_name || match.username,
      role: match.role,
      assigned_boat: match.assigned_boat || '',
      operator: match.operator || '',
    };
    sessionStorage.setItem('app_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('app_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsername('');
    setPassword('');
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-[#1e88e5] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f1e2e] flex items-center justify-center p-6">
        <Link
          to={createPageUrl('Home')}
          className="fixed top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1e88e5] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <p className="text-slate-500 text-sm">Sign in with your credentials</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                  {error}
                </div>
              )}
              <Button type="submit" disabled={loading} className="w-full bg-[#1e88e5] hover:bg-[#1976d2]">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}