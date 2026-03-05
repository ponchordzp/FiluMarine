import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Anchor, Users, Ship, DollarSign, Calendar, MapPin, Phone, Mail, Edit, Trash2, TrendingUp, Clock, CheckCircle2, XCircle, BarChart2 } from 'lucide-react';
import BoatManagement from './BoatManagement';

const OPERATOR_STORAGE_KEY = 'filu_operators';

function loadOperators() {
  try {
    const raw = localStorage.getItem(OPERATOR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [{ id: 'filu', name: 'FILU', contact_name: '', contact_email: '', contact_phone: '', description: 'Primary charter service operator', color: '#1e88e5' }];
}

function saveOperators(ops) {
  localStorage.setItem(OPERATOR_STORAGE_KEY, JSON.stringify(ops));
}

const COLORS = ['#1e88e5','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#6366f1'];

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${color}`} />
      <p className={`font-bold text-sm ${color}`}>{value}</p>
      <p className="text-white/30 text-xs">{label}</p>
    </div>
  );
}

function OperatorCard({ operator, boats, crew, bookings, onEdit, onDelete }) {
  const opName = (operator.name || '').toLowerCase();

  const opBoats = boats.filter(b => {
    const boatOp = (b.operator || '').toLowerCase();
    if (opName === 'filu') return !b.operator || boatOp === 'filu';
    return boatOp === opName;
  });

  const opCrew = crew.filter(u => {
    const userOp = (u.operator || '').toLowerCase();
    if (opName === 'filu') return !u.operator || userOp === 'filu';
    return userOp === opName;
  });

  const opBookings = bookings.filter(b => opBoats.some(boat => boat.name === b.boat_name));
  const activeBookings = opBookings.filter(b => b.status !== 'cancelled');
  const completedBookings = opBookings.filter(b => b.status === 'completed');
  const pendingBookings = opBookings.filter(b => b.status === 'pending');
  const confirmedBookings = opBookings.filter(b => b.status === 'confirmed');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const avgRevenue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const tripsToday = activeBookings.filter(b => b.date === todayStr).length;

  const upcoming30 = (() => {
    const today = new Date();
    const future = new Date(today); future.setDate(future.getDate() + 30);
    return activeBookings.filter(b => {
      const d = new Date(b.date);
      return d >= today && d <= future;
    }).length;
  })();

  const crewByRole = {
    superadmin: opCrew.filter(u => u.role === 'superadmin'),
    admin: opCrew.filter(u => u.role === 'admin'),
    crew: opCrew.filter(u => u.role === 'crew'),
  };

  const activeBoats = opBoats.filter(b => b.status === 'active').length;
  const maintenanceBoats = opBoats.filter(b => b.status === 'maintenance').length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)' }}>
      <div className="h-2" style={{ background: operator.color || '#1e88e5' }} />

      <div className="p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg" style={{ background: operator.color || '#1e88e5' }}>
              {(operator.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">{operator.name}</h3>
              {operator.description && <p className="text-xs text-white/40 mt-0.5">{operator.description}</p>}
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEdit(operator)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"><Edit className="h-3.5 w-3.5" /></button>
            <button onClick={() => onDelete(operator.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatBox icon={Ship} label="Boats" value={opBoats.length} color="text-blue-300" />
          <StatBox icon={Users} label="Crew" value={opCrew.length} color="text-purple-300" />
          <StatBox icon={Calendar} label="Today" value={tripsToday} color="text-amber-300" />
          <StatBox icon={DollarSign} label="Revenue" value={`$${(totalRevenue / 1000).toFixed(0)}k`} color="text-emerald-300" />
        </div>

        {/* Booking stats */}
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-1"><BarChart2 className="h-3 w-3" /> Booking Breakdown</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Total bookings</span>
              <span className="text-white/70 font-medium">{opBookings.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Upcoming (30d)</span>
              <span className="text-blue-300 font-medium">{upcoming30}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Pending</span>
              <span className="text-amber-300 font-medium">{pendingBookings.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Confirmed</span>
              <span className="text-green-300 font-medium">{confirmedBookings.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Completed</span>
              <span className="text-emerald-300 font-medium">{completedBookings.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Avg ticket</span>
              <span className="text-white/60 font-medium">{avgRevenue > 0 ? `$${(avgRevenue/1000).toFixed(1)}k` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Fleet */}
        {opBoats.length > 0 && (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Anchor className="h-3 w-3" /> Fleet
              {maintenanceBoats > 0 && <span className="ml-auto text-amber-400 font-normal normal-case">{maintenanceBoats} in maintenance</span>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {opBoats.map(boat => (
                <div key={boat.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs" style={{ background: 'rgba(30,136,229,0.15)', border: '1px solid rgba(30,136,229,0.25)', color: '#93c5fd' }}>
                  <Ship className="h-3 w-3" />
                  <span className="font-medium">{boat.name}</span>
                  {boat.status === 'maintenance' && <Badge className="bg-amber-500/20 text-amber-300 text-xs px-1 py-0 h-4">maint.</Badge>}
                  {boat.status === 'inactive' && <Badge className="bg-slate-500/20 text-slate-400 text-xs px-1 py-0 h-4">inactive</Badge>}
                  {boat.location && <span className="text-blue-400/60">· {boat.location === 'acapulco' ? 'Aca' : 'Ixt'}</span>}
                  {boat.capacity && <span className="text-blue-400/50">· {boat.capacity}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crew by role */}
        {opCrew.length > 0 && (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1"><Users className="h-3 w-3" /> Team</p>
            {[['superadmin','Super Admins','bg-purple-500/30 text-purple-200'],['admin','Admins','bg-blue-500/30 text-blue-200'],['crew','Crew','bg-emerald-500/30 text-emerald-200']].map(([role, label, cls]) =>
              crewByRole[role].length > 0 && (
                <div key={role} className="mb-1.5">
                  <p className="text-xs text-white/25 mb-1">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {crewByRole[role].map(u => (
                      <div key={u.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', color: '#c4b5fd' }}>
                        <span className="font-medium">{u.full_name || u.username}</span>
                        {u.assigned_boat && <span className="text-purple-400/60">· {u.assigned_boat}</span>}
                        {u.is_active === false && <XCircle className="h-3 w-3 text-red-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Contact */}
        {(operator.contact_email || operator.contact_phone || operator.contact_name) && (
          <div className="pt-3 border-t border-white/8 space-y-1">
            {operator.contact_name && <p className="text-xs text-white/60 font-medium">{operator.contact_name}</p>}
            {operator.contact_email && <p className="text-xs text-white/40 flex items-center gap-1.5"><Mail className="h-3 w-3" />{operator.contact_email}</p>}
            {operator.contact_phone && <p className="text-xs text-white/40 flex items-center gap-1.5"><Phone className="h-3 w-3" />{operator.contact_phone}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OperatorsDashboard() {
  const [operators, setOperators] = useState(loadOperators);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOp, setEditingOp] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', contact_name: '', contact_email: '', contact_phone: '', color: '#1e88e5' });

  const { data: boats = [] } = useQuery({ queryKey: ['all-boats'], queryFn: () => base44.entities.BoatInventory.list() });
  const { data: crew = [] } = useQuery({ queryKey: ['app-users'], queryFn: () => base44.entities.AppUser.list() });
  const { data: bookings = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => base44.entities.Booking.list('-created_date') });

  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0);
  const totalActiveBookings = bookings.filter(b => b.status !== 'cancelled').length;

  const openAdd = () => {
    setEditingOp(null);
    setForm({ name: '', description: '', contact_name: '', contact_email: '', contact_phone: '', color: COLORS[operators.length % COLORS.length] });
    setDialogOpen(true);
  };

  const openEdit = (op) => {
    setEditingOp(op);
    setForm({ name: op.name, description: op.description || '', contact_name: op.contact_name || '', contact_email: op.contact_email || '', contact_phone: op.contact_phone || '', color: op.color || '#1e88e5' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    let updated;
    if (editingOp) {
      updated = operators.map(o => o.id === editingOp.id ? { ...o, ...form } : o);
    } else {
      updated = [...operators, { id: `op_${Date.now()}`, ...form }];
    }
    saveOperators(updated);
    setOperators(updated);
    setDialogOpen(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Remove this operator?')) return;
    const updated = operators.filter(o => o.id !== id);
    saveOperators(updated);
    setOperators(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Charter Operators</h2>
          <p className="text-sm text-white/40 mt-0.5">Fleet, crew, and booking overview per operator</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" />Add Operator
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Operators', value: operators.length, color: 'rgba(30,136,229,0.12)', border: 'rgba(30,136,229,0.3)', text: 'text-blue-300' },
          { label: 'Total Boats', value: boats.length, color: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', text: 'text-purple-300' },
          { label: 'Total Team', value: crew.length, color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: 'text-emerald-300' },
          { label: 'Active Bookings', value: totalActiveBookings, color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'text-amber-300' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.color, border: `1px solid ${s.border}`, backdropFilter: 'blur(16px)' }}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-white/40 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Operator cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {operators.map(op => (
          <OperatorCard key={op.id} operator={op} boats={boats} crew={crew} bookings={bookings} onEdit={openEdit} onDelete={handleDelete} />
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingOp ? 'Edit Operator' : 'Add New Operator'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Operator Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., NAUTIKA" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description..." rows={2} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Contact Name</Label>
                <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Full name" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Contact Phone</Label>
                <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="+52..." className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Contact Email</Label>
              <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="operator@example.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Brand Color</Label>
              <div className="flex items-center gap-2 mt-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={!form.name.trim()} className="flex-1">{editingOp ? 'Save Changes' : 'Add Operator'}</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}