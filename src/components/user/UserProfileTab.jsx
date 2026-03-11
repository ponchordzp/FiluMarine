import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const inputCls = "h-11 pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl";

export default function UserProfileTab({ customer, onUpdate }) {
  const [fullName, setFullName] = useState(customer.full_name || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: data => base44.entities.CustomerUser.update(customer.id, data),
    onSuccess: updated => {
      onUpdate(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    },
  });

  async function handleSaveProfile(e) {
    e.preventDefault();
    updateMutation.mutate({ full_name: fullName, phone });
  }

  async function handleChangePw(e) {
    e.preventDefault();
    setPwError('');
    const hash = await hashPassword(currentPw);
    if (hash !== customer.password_hash) { setPwError('Current password is incorrect.'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    const newHash = await hashPassword(newPw);
    await base44.entities.CustomerUser.update(customer.id, { password_hash: newHash });
    onUpdate({ ...customer, password_hash: newHash });
    setCurrentPw(''); setNewPw('');
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
  }

  const initials = (customer.full_name || customer.username || '?')[0].toUpperCase();

  return (
    <div className="space-y-4">
      {/* Avatar + name */}
      <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, rgba(30,136,229,0.3), rgba(13,95,168,0.3))', border: '1px solid rgba(30,136,229,0.3)' }}>
            {initials}
          </div>
          <div>
            <p className="font-bold text-white">{customer.full_name || customer.username}</p>
            <p className="text-xs text-white/30">@{customer.username}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <Label className="text-white/40 text-xs mb-1.5 block">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <Label className="text-white/40 text-xs mb-1.5 block">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
              <Input value={customer.email} disabled className="h-11 pl-9 bg-white/[0.02] border-white/5 text-white/35 rounded-xl" />
            </div>
          </div>
          <div>
            <Label className="text-white/40 text-xs mb-1.5 block">Phone / WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+52 555 000 0000" className={inputCls} />
            </div>
          </div>
          <Button type="submit" disabled={updateMutation.isPending} className="w-full h-10 rounded-xl text-sm font-semibold" style={{
            background: profileSaved ? 'rgba(16,185,129,0.25)' : 'rgba(30,136,229,0.2)',
            border: profileSaved ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(30,136,229,0.3)',
            color: profileSaved ? '#6ee7b7' : '#60b4ff',
          }}>
            {profileSaved ? <><CheckCircle className="h-4 w-4 mr-1.5 inline" />Saved!</> : updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold text-white/55 flex items-center gap-2">
          <Lock className="h-4 w-4" /> Change Password
        </p>
        <form onSubmit={handleChangePw} className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
            <Input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" className={inputCls} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
            <Input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (8+ characters)" className={`${inputCls} pr-10`} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">{pwError}</p>}
          <Button type="submit" disabled={!currentPw || !newPw} className="w-full h-10 rounded-xl text-sm" style={{
            background: pwSaved ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)',
            border: pwSaved ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.1)',
            color: pwSaved ? '#6ee7b7' : 'rgba(255,255,255,0.6)',
          }}>
            {pwSaved ? <><CheckCircle className="h-4 w-4 mr-1.5 inline" />Password Updated!</> : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}