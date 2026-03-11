import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Anchor, Mail, User, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Symbol', ok: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const barColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-400'];
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 h-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= score ? barColors[score] : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-white/55' : 'text-white/20'}`}>
            {c.ok ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-white/15" />}
            {c.label}
          </span>
        ))}
        {score > 0 && <span className="text-xs font-medium ml-auto" style={{ color: score >= 4 ? '#6ee7b7' : score >= 3 ? '#60b4ff' : '#fb923c' }}>{labels[score]}</span>}
      </div>
    </div>
  );
}

export default function UserLogin() {
  const [tab, setTab] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  useEffect(() => {
    if (localStorage.getItem('filuCustomerUser')) {
      window.location.href = createPageUrl('Users');
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const hash = await hashPassword(loginPw);
      const [byEmail, byUsername] = await Promise.all([
        base44.entities.CustomerUser.filter({ email: loginId.toLowerCase() }),
        base44.entities.CustomerUser.filter({ username: loginId.toLowerCase() }),
      ]);
      const found = [...byEmail, ...byUsername].find(u => u.password_hash === hash && u.is_active !== false);
      if (!found) { setError('Invalid credentials. Please try again.'); return; }
      localStorage.setItem('filuCustomerUser', JSON.stringify(found));
      window.location.href = createPageUrl('Users');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regPw !== regConfirm) { setError('Passwords do not match.'); return; }
    if (regPw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const [byEmail, byUsername] = await Promise.all([
        base44.entities.CustomerUser.filter({ email: regEmail.toLowerCase() }),
        base44.entities.CustomerUser.filter({ username: regUsername.toLowerCase() }),
      ]);
      if (byEmail.length > 0) { setError('Email already registered.'); return; }
      if (byUsername.length > 0) { setError('Username already taken.'); return; }
      const hash = await hashPassword(regPw);
      const newUser = await base44.entities.CustomerUser.create({
        full_name: regName,
        email: regEmail.toLowerCase(),
        username: regUsername.toLowerCase(),
        password_hash: hash,
        is_active: true,
      });
      localStorage.setItem('filuCustomerUser', JSON.stringify(newUser));
      window.location.href = createPageUrl('Users');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "h-11 pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus-visible:border-[#1e88e5]/60 focus-visible:ring-[#1e88e5]/20";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(150deg, #040d1a 0%, #0a1f3d 55%, #071429 100%)' }}>
      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #1e88e5, transparent)', transform: 'translate(40%, -40%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #0d5fa8, transparent)', transform: 'translate(-40%, 40%)' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Ocean wave bottom decoration */}
        <svg className="absolute bottom-0 left-0 right-0 w-full opacity-[0.08]" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="#1e88e5"/>
          <path d="M0,80 C240,40 480,100 720,80 C960,60 1200,100 1440,80 L1440,120 L0,120 Z" fill="#0d5fa8" opacity="0.6"/>
        </svg>
      </div>

      {/* Back link */}
      <div className="relative z-10 p-4 safe-area-top">
        <button onClick={() => window.location.href = createPageUrl('Home')} className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </button>
      </div>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Brand with nautical flags */}
          <div className="text-center mb-7">
            {/* Nautical flags F-I-L-U */}
            <div className="flex items-end justify-center gap-1.5 mb-4">
              {/* F - Foxtrot: White diamond on red */}
              <div className="w-9 h-7 bg-red-600 relative flex items-center justify-center shadow-lg rounded-sm">
                <div className="w-4 h-4 bg-white transform rotate-45" style={{ boxShadow: '0 0 4px rgba(255,255,255,0.3)' }}></div>
              </div>
              {/* I - India: Yellow circle on black */}
              <div className="w-9 h-7 bg-black flex items-center justify-center shadow-lg rounded-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="w-4 h-4 bg-yellow-400 rounded-full" style={{ boxShadow: '0 0 6px rgba(251,191,36,0.4)' }}></div>
              </div>
              {/* L - Lima: Yellow and black quarters */}
              <div className="w-9 h-7 grid grid-cols-2 grid-rows-2 shadow-lg rounded-sm overflow-hidden">
                <div className="bg-yellow-400"></div>
                <div className="bg-black"></div>
                <div className="bg-black"></div>
                <div className="bg-yellow-400"></div>
              </div>
              {/* U - Uniform: Red and white quarters */}
              <div className="w-9 h-7 grid grid-cols-2 grid-rows-2 shadow-lg rounded-sm overflow-hidden">
                <div className="bg-red-600"></div>
                <div className="bg-white"></div>
                <div className="bg-white"></div>
                <div className="bg-red-600"></div>
              </div>
            </div>
            {/* Bottom accent line under flags */}
            <div className="w-20 h-px mx-auto mb-4 opacity-30" style={{ background: 'linear-gradient(90deg, transparent, #1e88e5, transparent)' }} />
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: 'rgba(30,136,229,0.15)', border: '1px solid rgba(30,136,229,0.3)' }}>
              <Anchor className="h-7 w-7 text-[#1e88e5]" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">FILU <span className="text-blue-200/50 font-light text-2xl">Marine</span></h1>
            <p className="text-white/35 text-sm mt-1">Your ocean adventures, all in one place</p>
            {/* Decorative dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full" style={{ background: `rgba(30,136,229,${0.15 + i * 0.08})` }} />
              ))}
            </div>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(24px)' }}>
            <Tabs value={tab} onValueChange={v => { setTab(v); setError(''); }}>
              <TabsList className="w-full rounded-xl mb-5 p-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <TabsTrigger value="login" className="flex-1 rounded-[10px] text-sm font-medium data-[state=active]:text-white text-white/40 data-[state=active]:bg-[#1e88e5]/30 py-2">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="flex-1 rounded-[10px] text-sm font-medium data-[state=active]:text-white text-white/40 data-[state=active]:bg-[#1e88e5]/30 py-2">Create Account</TabsTrigger>
              </TabsList>

              {/* Sign In */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label className="text-white/45 text-xs mb-1.5 block">Email or Username</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                      <Input value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="your@email.com" className={inputCls} required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/45 text-xs mb-1.5 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                      <Input type={showPw ? 'text' : 'password'} value={loginPw} onChange={e => setLoginPw(e.target.value)} placeholder="••••••••" className={`${inputCls} pr-10`} required />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-semibold text-sm mt-1" style={{ background: 'linear-gradient(135deg, #1e88e5, #0d5fa8)', border: 'none' }}>
                    {loading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Create Account */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <Label className="text-white/45 text-xs mb-1.5 block">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                      <Input value={regName} onChange={e => setRegName(e.target.value)} placeholder="John Doe" className={inputCls} required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/45 text-xs mb-1.5 block">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                      <Input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="your@email.com" className={inputCls} required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/45 text-xs mb-1.5 block">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                      <Input value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="johndoe" className={inputCls} required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/45 text-xs mb-1.5 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                      <Input type={showPw ? 'text' : 'password'} value={regPw} onChange={e => setRegPw(e.target.value)} placeholder="Create a strong password" className={`${inputCls} pr-10`} required />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={regPw} />
                  </div>
                  <div>
                    <Label className="text-white/45 text-xs mb-1.5 block">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                      <Input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="••••••••" className={inputCls} required />
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #1e88e5, #0d5fa8)', border: 'none' }}>
                    {loading ? 'Creating account…' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-center text-white/15 text-xs mt-5 px-4">
            Your bookings are linked by email — use the same email you booked with
          </p>
        </div>
      </div>
    </div>
  );
}