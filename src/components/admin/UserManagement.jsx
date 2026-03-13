import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, Shield, Anchor, Users, CheckCircle, XCircle, Key, Building2, Settings } from 'lucide-react';
import RolePermissionsManager from './RolePermissionsManager';
import { format, parseISO } from 'date-fns';

const OPERATOR_STORAGE_KEY = 'filu_operators';
function loadOperators() {
  try { const raw = localStorage.getItem(OPERATOR_STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return [{ id: 'filu', name: 'FILU', color: '#1e88e5' }];
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('At least one special character');
  return errors;
}

const roleConfig = {
  superadmin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800', icon: Shield, description: 'Full access — can create users, manage all boats and settings' },
  operator_admin: { label: 'Operator Admin', color: 'bg-orange-100 text-orange-800', icon: Building2, description: 'Full access scoped to their operator fleet — cannot edit the global checklist template' },
  admin: { label: 'Admin (Boat Owner)', color: 'bg-blue-100 text-blue-800', icon: Anchor, description: 'Can view Bookings, Dates, Dashboard & their assigned boat' },
  crew: { label: 'Crew', color: 'bg-emerald-100 text-emerald-800', icon: Users, description: 'Can view Bookings, Dates, Dashboard & fill maintenance on their assigned boat' }
};

const emptyForm = { username: '', full_name: '', email: '', role: 'crew', assigned_boat: '', operator: '', is_active: true, password: '', confirm_password: '' };

const ROLE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'superadmin', label: 'Super Admins' },
  { value: 'operator_admin', label: 'Operator Admins' },
  { value: 'admin', label: 'Admins' },
  { value: 'crew', label: 'Crew' },
];

function getOperatorForUser(user, operators) {
  if (!user) return null;
  const userOp = (user.operator || '').toLowerCase();
  if (userOp) return operators.find(o => o.name.toLowerCase() === userOp) || null;
  // Default: FILU
  return operators.find(o => o.name.toLowerCase() === 'filu') || null;
}

export default function UserManagement({ currentUser, operatorFilter: externalOperatorFilter = 'all' }) {
  const isOperatorAdmin = currentUser?.role === 'operator_admin';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const currentUserOperator = currentUser?.operator || 'FILU';
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [roleTab, setRoleTab] = useState('all');
  const [localOperatorFilter, setLocalOperatorFilter] = useState('all');

  // Use external filter when set (from global operator dropdown), otherwise use local filter
  const operatorFilter = externalOperatorFilter !== 'all' ? externalOperatorFilter : localOperatorFilter;

  const operators = loadOperators();

  const { data: appUsers = [] } = useQuery({ queryKey: ['app-users'], queryFn: () => base44.entities.AppUser.list('-created_date') });
  const { data: boats = [] } = useQuery({ queryKey: ['boats'], queryFn: () => base44.entities.BoatInventory.list() });

  const createMutation = useMutation({ mutationFn: (data) => base44.entities.AppUser.create(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-users'] }) });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.AppUser.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-users'] }) });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.AppUser.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-users'] }) });

  const openCreate = () => { setEditingUser(null); setForm(emptyForm); setError(''); setDialogOpen(true); };
  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, full_name: user.full_name || '', email: user.email || '', role: user.role, assigned_boat: user.assigned_boat || '', operator: user.operator || '', is_active: user.is_active !== false, password: '', confirm_password: '' });
    setError(''); setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    // Only superadmin can create superadmin users
    if (!editingUser && form.role === 'superadmin' && !isSuperAdmin) { setError('Only SuperAdmin can create SuperAdmin users'); return; }
    if (!editingUser) {
      if (!form.password) { setError('Password is required'); return; }
      const pwErrors = validatePassword(form.password);
      if (pwErrors.length > 0) { setError('Password requirements: ' + pwErrors.join(', ')); return; }
      if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    }
    const existing = appUsers.find(u => u.username.toLowerCase() === form.username.toLowerCase() && u.id !== editingUser?.id);
    if (existing) { setError('Username already exists'); return; }
    setSaving(true);
    // Operator admins always assign their own operator to new users
    const operatorValue = isOperatorAdmin ? currentUserOperator : form.operator.trim();
    const payload = { username: form.username.trim(), full_name: form.full_name.trim(), email: form.email.trim(), role: form.role, assigned_boat: form.role === 'admin' || form.role === 'crew' ? form.assigned_boat : '', operator: operatorValue, is_active: form.is_active };
    if (!editingUser || form.password) payload.password_hash = await hashPassword(form.password || '');
    if (editingUser) { await updateMutation.mutateAsync({ id: editingUser.id, data: payload }); }
    else { await createMutation.mutateAsync(payload); }
    setSaving(false); setDialogOpen(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword) return;
    const pwErrors = validatePassword(newPassword);
    if (pwErrors.length > 0) { alert('Password requirements not met: ' + pwErrors.join(', ')); return; }
    setResetSaving(true);
    const hash = await hashPassword(newPassword);
    await updateMutation.mutateAsync({ id: resetPasswordUser.id, data: { password_hash: hash } });
    setResetSaving(false); setResetPasswordUser(null); setNewPassword('');
  };

  const toggleActive = async (user) => { await updateMutation.mutateAsync({ id: user.id, data: { is_active: !user.is_active } }); };

  const pwErrors = form.password ? validatePassword(form.password) : [];

  // Operator admins only see users from their own operator
  const scopedUsers = isOperatorAdmin
    ? appUsers.filter(u => {
        const op = getOperatorForUser(u, operators);
        return op?.name?.toLowerCase() === currentUserOperator.toLowerCase();
      })
    : appUsers;

  // Filtered users
  const filteredUsers = scopedUsers.filter(u => {
    const roleMatch = roleTab === 'all' || u.role === roleTab;
    let opMatch = true;
    if (operatorFilter !== 'all') {
      const op = getOperatorForUser(u, operators);
      opMatch = op?.name?.toLowerCase() === operatorFilter.toLowerCase();
    }
    return roleMatch && opMatch;
  });

  const countByRole = (role) => scopedUsers.filter(u => u.role === role).length;
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-purple-100 text-2xl font-semibold">User Management</h2>
          <p className="text-sm text-purple-200/70 mt-1">Create and manage users, roles, and boat assignments</p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button variant="outline" size="sm" onClick={() => setPermissionsOpen(o => !o)} className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Settings className="h-4 w-4" />
              {permissionsOpen ? 'Hide' : 'Role Permissions'}
            </Button>
          )}
          <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />Create User
          </Button>
        </div>
      </div>

      {/* Role Permissions Manager — SuperAdmin only */}
      {isSuperAdmin && permissionsOpen && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <RolePermissionsManager />
        </div>
      )}

      {/* Role legend */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(roleConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Card key={key} className="border-2" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${key === 'superadmin' ? 'bg-purple-100' : key === 'admin' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                    <Icon className={`h-4 w-4 ${key === 'superadmin' ? 'text-purple-600' : key === 'admin' ? 'text-blue-600' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-purple-100">{cfg.label}</p>
                    <p className="text-xs text-purple-200/70 mt-0.5">{cfg.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role tabs + operator filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
          {ROLE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setRoleTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${roleTab === tab.value ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/8'}`}
            >
              {tab.label}
              {tab.value !== 'all' && <span className="ml-1.5 opacity-60">({countByRole(tab.value)})</span>}
              {tab.value === 'all' && <span className="ml-1.5 opacity-60">({appUsers.length})</span>}
            </button>
          ))}
        </div>

        {/* Operator filter */}
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-white/40" />
          <select
            value={localOperatorFilter}
            onChange={e => setLocalOperatorFilter(e.target.value)}
            className="text-xs rounded-lg px-2.5 py-1.5 text-white/70 border"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
          >
            <option value="all">All Operators</option>
            {operators.map(op => (
              <option key={op.id} value={op.name}>{op.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users list */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No users found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map(user => {
            const cfg = roleConfig[user.role] || roleConfig.crew;
            const Icon = cfg.icon;
            const opForUser = getOperatorForUser(user, operators);
            return (
              <Card key={user.id} className={`border-2 ${user.is_active === false ? 'opacity-60' : ''}`} style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${user.role === 'superadmin' ? 'bg-purple-100' : user.role === 'admin' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                      <Icon className={`h-5 w-5 ${user.role === 'superadmin' ? 'text-purple-600' : user.role === 'admin' ? 'text-blue-600' : 'text-emerald-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-purple-100">{user.full_name || user.username}</p>
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                        {user.is_active === false && <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>}
                        {/* Operator badge */}
                        {opForUser && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${opForUser.color}22`, border: `1px solid ${opForUser.color}55`, color: opForUser.color }}>
                            {opForUser.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-purple-200/70">@{user.username}</p>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {user.email && <p className="text-xs text-purple-200/60">✉ {user.email}</p>}
                        {user.assigned_boat && <p className="text-xs text-blue-300 font-medium">⚓ {user.assigned_boat}</p>}
                        {user.last_login && <p className="text-xs text-purple-200/50">Last login: {format(parseISO(user.last_login), 'MMM d, yyyy')}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(user)} title={user.is_active === false ? 'Activate' : 'Deactivate'} className={user.is_active === false ? 'text-slate-400 hover:text-emerald-600' : 'text-emerald-600 hover:text-slate-400'}>
                        {user.is_active === false ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setResetPasswordUser(user); setNewPassword(''); }} className="text-amber-600 hover:text-amber-700"><Key className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)} className="text-slate-600 hover:text-slate-800"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (window.confirm(`Delete user "${user.username}"?`)) deleteMutation.mutate(user.id); }} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? `Edit User: ${editingUser.username}` : 'Create New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Username *</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="e.g., juan_perez" /></div>
              <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g., Juan Pérez" /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g., juan@example.com" /></div>
            <div>
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })} disabled={form.role === 'superadmin' && !isSuperAdmin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && <SelectItem value="superadmin">Super Admin</SelectItem>}
                  {form.role === 'superadmin' && !isSuperAdmin && <SelectItem value="superadmin">Super Admin (Cannot change)</SelectItem>}
                  <SelectItem value="operator_admin">Operator Admin</SelectItem>
                  <SelectItem value="admin">Admin (Boat Owner)</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(form.role === 'admin' || form.role === 'crew') && (
              <div>
                <Label>Assigned Boat</Label>
                <Select value={form.assigned_boat} onValueChange={v => setForm({ ...form, assigned_boat: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a boat..." /></SelectTrigger>
                  <SelectContent>{boats.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {isSuperAdmin && (
              <div>
                <Label>Operator</Label>
                <Select value={form.operator || '__filu__'} onValueChange={v => setForm({ ...form, operator: v === '__filu__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select operator..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__filu__">FILU (default)</SelectItem>
                    {operators.filter(o => o.name.toLowerCase() !== 'filu').map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editingUser} placeholder="Min 8 chars, upper, lower, number, special" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && pwErrors.length > 0 && <ul className="mt-1 space-y-0.5">{pwErrors.map(e => <li key={e} className="text-xs text-red-600">✗ {e}</li>)}</ul>}
              {form.password && pwErrors.length === 0 && <p className="text-xs text-emerald-600 mt-1">✓ Password meets requirements</p>}
            </div>
            {(form.password || !editingUser) && (
              <div>
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Input type={showConfirm ? 'text' : 'password'} value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} placeholder="Repeat password" />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.confirm_password && form.password !== form.confirm_password && <p className="text-xs text-red-600 mt-1">✗ Passwords do not match</p>}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
              <Label htmlFor="is_active" className="cursor-pointer">Active (can log in)</Label>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">{saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={open => { if (!open) setResetPasswordUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-amber-600" />Reset Password — {resetPasswordUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
                <button type="button" onClick={() => setShowNewPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (() => { const errs = validatePassword(newPassword); return errs.length > 0 ? <ul className="mt-1">{errs.map(e => <li key={e} className="text-xs text-red-600">✗ {e}</li>)}</ul> : <p className="text-xs text-emerald-600 mt-1">✓ Password meets requirements</p>; })()}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleResetPassword} disabled={resetSaving || !newPassword} className="flex-1 bg-amber-600 hover:bg-amber-700">{resetSaving ? 'Saving...' : 'Reset Password'}</Button>
              <Button variant="outline" onClick={() => setResetPasswordUser(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}