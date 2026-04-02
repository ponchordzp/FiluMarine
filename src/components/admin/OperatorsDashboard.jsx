import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Anchor, Users, Ship, DollarSign, Calendar, MapPin, Phone, Mail, Edit, Trash2, TrendingUp, Clock, CheckCircle2, XCircle, BarChart2, ExternalLink, CreditCard, Lock } from 'lucide-react';
import BoatManagement from './BoatManagement';

const OPERATOR_STORAGE_KEY = 'filu_operators';
const OPERATOR_PROTECTED_KEY = 'filu_operators_protected'; // stores sensitive fields separately so they survive code edits

// Protected fields that must never be overwritten by default values or code changes
const PROTECTED_FIELDS = ['commission_pct', 'paypal_username', 'bank_name', 'bank_account_clabe', 'bank_account_number', 'bank_account_holder', 'bank_notes', 'contact_name', 'contact_email', 'contact_phone', 'description', 'color', 'locations'];

function loadProtectedData() {
  try {
    const raw = localStorage.getItem(OPERATOR_PROTECTED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProtectedData(ops) {
  const protected_ = {};
  ops.forEach(op => {
    protected_[op.name.toUpperCase()] = {};
    PROTECTED_FIELDS.forEach(f => { if (op[f] !== undefined) protected_[op.name.toUpperCase()][f] = op[f]; });
  });
  localStorage.setItem(OPERATOR_PROTECTED_KEY, JSON.stringify(protected_));
}

function mergeProtectedData(ops) {
  const protected_ = loadProtectedData();
  return ops.map(op => {
    const saved = protected_[(op.name || '').toUpperCase()];
    if (!saved) return op;
    // Protected fields from storage always win over defaults
    return { ...op, ...saved };
  });
}

const DEFAULT_OPERATORS = [
  { id: 'filu',    name: 'FILU',    description: 'Primary charter service operator', paypal_username: 'filumarine', commission_pct: 0, color: '#1e88e5', contact_name: '', contact_email: '', contact_phone: '' },
  { id: 'hilario', name: 'HILARIO', description: 'Hilario charter operator',          paypal_username: '',            commission_pct: 0, color: '#10b981', contact_name: '', contact_email: '', contact_phone: '' },
];

function ensureDefaults(ops) {
  let updated = [...ops];
  const protected_ = loadProtectedData();
  for (const def of DEFAULT_OPERATORS) {
    const exists = updated.some(o => (o.name || '').toLowerCase() === def.name.toLowerCase());
    if (!exists) {
      // Restore from protected store if available, otherwise use code default
      const saved = protected_[def.name.toUpperCase()] || {};
      updated = [...updated, { ...def, ...saved }];
    }
  }
  // Merge protected data on top of existing operators so code defaults never overwrite saved values
  updated = mergeProtectedData(updated);
  // Legacy migration only if no protected data exists for FILU paypal
  updated = updated.map(o => {
    if ((o.name || '').toLowerCase() === 'filu' && (!o.paypal_username || o.paypal_username === 'ponchordzp')) {
      const filuProtected = protected_['FILU'] || {};
      return filuProtected.paypal_username ? o : { ...o, paypal_username: 'filumarine' };
    }
    return o;
  });
  return updated;
}

function loadOperators() {
  try {
    const raw = localStorage.getItem(OPERATOR_STORAGE_KEY);
    if (raw) {
      const ops = JSON.parse(raw);
      // ONLY merge protected fields, DO NOT force respawn of deleted operators
      // and DO NOT hardcode 'filumarine' paypal resets.
      const updated = mergeProtectedData(ops);
      return updated;
    }
  } catch {}
  // Only if the storage is completely empty, we provide the initial defaults
  const defaults = ensureDefaults([]);
  localStorage.setItem(OPERATOR_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveOperators(ops) {
  localStorage.setItem(OPERATOR_STORAGE_KEY, JSON.stringify(ops));
  // Always persist protected/sensitive fields in a separate vault
  saveProtectedData(ops);
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

function OperatorCard({ operator, boats, crew, bookings, expenses, onEdit, onDelete, onAddBoat }) {
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
  
  const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const avgRevenue = activeBookings.length > 0 ? totalRevenue / activeBookings.length : 0;

  const commissionPct = parseFloat(operator.commission_pct || 0);
  const totalOpExpenses = activeBookings.reduce((sum, b) => {
    const exp = expenses.find(e => e.booking_id === b.id);
    if (!exp) return sum;
    return sum + (exp.fuel_cost || 0) + (exp.crew_cost || 0) + (exp.maintenance_cost || 0) + (exp.cleaning_cost || 0) + (exp.supplies_cost || 0) + (exp.other_cost || 0);
  }, 0);
  const commission = totalRevenue * commissionPct / 100;
  const earnings = totalRevenue - totalOpExpenses - commission;

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
          <div className="flex gap-1 items-center">
            <button onClick={() => onAddBoat(operator.name)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-white/40 hover:text-blue-300 transition-colors" title="Add boat to this operator"><Plus className="h-3.5 w-3.5" /></button>
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
            <div className="flex justify-between text-xs col-span-2 pt-1 border-t border-white/8">
              <span className="text-white/40">FILU Fee ({commissionPct}% of revenue)</span>
              <span className="text-orange-300 font-medium">-${(commission/1000).toFixed(1)}k</span>
            </div>
            <div className="flex justify-between text-xs col-span-2">
              <span className="text-white/60 font-semibold">Earnings (net)</span>
              <span className={`font-bold ${earnings >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>${(earnings/1000).toFixed(1)}k</span>
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

        {/* Locations */}
        {operator.locations && operator.locations.length > 0 && (
          <div className="pt-3 border-t border-white/8">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Assigned Locations</p>
            <div className="flex flex-wrap gap-1.5">
              {operator.locations.map(loc => (
                <span key={loc} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', color: '#5eead4' }}>{loc}</span>
              ))}
            </div>
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

        {/* Bank Details */}
        {(operator.bank_name || operator.bank_account_clabe) && (
          <div className="pt-3 border-t border-white/8">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Bank Details</p>
            <div className="rounded-lg px-3 py-2 space-y-1" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
              {operator.bank_account_holder && <p className="text-xs text-white/60"><span className="text-white/30">Holder:</span> {operator.bank_account_holder}</p>}
              {operator.bank_name && <p className="text-xs text-white/60"><span className="text-white/30">Bank:</span> {operator.bank_name}</p>}
              {operator.bank_account_clabe && <p className="text-xs text-white/60"><span className="text-white/30">CLABE:</span> <span className="font-mono">{operator.bank_account_clabe}</span></p>}
              {operator.bank_account_number && <p className="text-xs text-white/60"><span className="text-white/30">Account:</span> <span className="font-mono">{operator.bank_account_number}</span></p>}
              {operator.bank_notes && <p className="text-xs text-white/40 italic">{operator.bank_notes}</p>}
            </div>
          </div>
        )}

        {/* PayPal */}
        {operator.paypal_username && (
          <div className="pt-3 border-t border-white/8">
            <a
              href={`https://www.paypal.com/paypalme/${operator.paypal_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: 'rgba(0,100,204,0.25)', border: '1px solid rgba(0,100,204,0.45)', color: '#60a5fa' }}
            >
              <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" className="h-4 w-4 rounded-sm" />
              Pay via PayPal · @{operator.paypal_username}
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
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
  const [addBoatForOperator, setAddBoatForOperator] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', contact_name: '', contact_email: '', contact_phone: '', paypal_username: '', commission_pct: 0, color: '#1e88e5', bank_name: '', bank_account_clabe: '', bank_account_number: '', bank_account_holder: '', bank_notes: '', locations: [] });

  const queryClient = useQueryClient();
  const { data: dbLocations = [] } = useQuery({ queryKey: ['locations'], queryFn: () => base44.entities.Location.list('sort_order') });
  const { data: boats = [] } = useQuery({ queryKey: ['all-boats'], queryFn: () => base44.entities.BoatInventory.list() });
  const { data: crew = [] } = useQuery({ queryKey: ['app-users'], queryFn: () => base44.entities.AppUser.list() });
  const { data: bookings = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => base44.entities.Booking.list('-created_date') });
  const { data: expenses = [] } = useQuery({ queryKey: ['booking-expenses'], queryFn: () => base44.entities.BookingExpense.list() });

  // Sync paypal_username to all boats belonging to this operator
  const syncPaypalToBoats = async (opName, paypalUsername) => {
    const opNameLower = (opName || '').toLowerCase();
    const opBoats = boats.filter(b => {
      const boatOp = (b.operator || '').toLowerCase();
      return opNameLower === 'filu' ? (!b.operator || boatOp === 'filu') : boatOp === opNameLower;
    });
    await Promise.all(opBoats.map(b => base44.entities.BoatInventory.update(b.id, { paypal_username: paypalUsername || '' })));
    queryClient.invalidateQueries({ queryKey: ['all-boats'] });
  };

  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0);
  const totalActiveBookings = bookings.filter(b => b.status !== 'cancelled').length;

  const openAdd = () => {
    setEditingOp(null);
    setForm({ name: '', description: '', contact_name: '', contact_email: '', contact_phone: '', paypal_username: '', commission_pct: 0, color: COLORS[operators.length % COLORS.length], bank_name: '', bank_account_clabe: '', bank_account_number: '', bank_account_holder: '', bank_notes: '', locations: [] });
    setDialogOpen(true);
  };

  const openEdit = (op) => {
    setEditingOp(op);
    setForm({ name: op.name, description: op.description || '', contact_name: op.contact_name || '', contact_email: op.contact_email || '', contact_phone: op.contact_phone || '', paypal_username: op.paypal_username || '', commission_pct: op.commission_pct || 0, color: op.color || '#1e88e5', bank_name: op.bank_name || '', bank_account_clabe: op.bank_account_clabe || '', bank_account_number: op.bank_account_number || '', bank_account_holder: op.bank_account_holder || '', bank_notes: op.bank_notes || '', locations: op.locations || [] });
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
    // Sync paypal_username directly onto all boats of this operator in the DB
    syncPaypalToBoats(form.name, form.paypal_username);
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
          <OperatorCard key={op.id} operator={op} boats={boats} crew={crew} bookings={bookings} expenses={expenses} onEdit={openEdit} onDelete={handleDelete} onAddBoat={(opName) => setAddBoatForOperator(opName)} />
        ))}
      </div>

      {/* Add Boat Dialog (triggered from operator card) */}
      {addBoatForOperator && (
        <Dialog open={!!addBoatForOperator} onOpenChange={(open) => { if (!open) setAddBoatForOperator(null); }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Boat to {addBoatForOperator}</DialogTitle>
            </DialogHeader>
            <BoatManagement showAddBoatOnly defaultOperator={addBoatForOperator} isSuperAdmin />
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOp ? 'Edit Operator' : 'Add New Operator'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-foreground">Operator Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., NAUTIKA" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm text-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description..." rows={2} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-foreground">Contact Name</Label>
                <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Full name" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-foreground">Contact Phone</Label>
                <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="+52..." className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm text-foreground">Contact Email</Label>
              <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="operator@example.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" /> FILU Fee %
              </Label>
              <div className="flex items-center mt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.commission_pct}
                  onChange={e => setForm(f => ({ ...f, commission_pct: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="rounded-r-none"
                />
                <span className="px-3 py-2 text-sm rounded-r-md border border-l-0 text-muted-foreground border-input bg-muted">%</span>
              </div>
              <p className="text-xs text-amber-600/80 mt-1 flex items-center gap-1"><Lock className="h-3 w-3" /> This field is protected and will never be truncated in code edits</p>
            </div>
            <div>
              <Label className="text-sm text-foreground">PayPal Username</Label>
              <div className="flex items-center mt-1">
                <span className="px-3 py-2 text-sm rounded-l-md border border-r-0 text-muted-foreground border-input bg-muted">paypal.me/</span>
                <Input value={form.paypal_username} onChange={e => setForm(f => ({ ...f, paypal_username: e.target.value }))} placeholder="username" className="rounded-l-none" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Used to generate the PayPal payment link for booking cards</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Bank Details (Direct Deposit)</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-sm text-foreground">Bank Name</Label><Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="e.g., BBVA" className="mt-1" /></div>
                  <div><Label className="text-sm text-foreground">Account Holder</Label><Input value={form.bank_account_holder} onChange={e => setForm(f => ({ ...f, bank_account_holder: e.target.value }))} placeholder="Name on account" className="mt-1" /></div>
                </div>
                <div><Label className="text-sm text-foreground">CLABE (18 digits)</Label><Input value={form.bank_account_clabe} onChange={e => setForm(f => ({ ...f, bank_account_clabe: e.target.value }))} placeholder="e.g., 012180004713413911" maxLength={18} className="mt-1" /></div>
                <div><Label className="text-sm text-foreground">Account Number (optional)</Label><Input value={form.bank_account_number} onChange={e => setForm(f => ({ ...f, bank_account_number: e.target.value }))} placeholder="Account number" className="mt-1" /></div>
                <div><Label className="text-sm text-foreground">Notes</Label><Input value={form.bank_notes} onChange={e => setForm(f => ({ ...f, bank_notes: e.target.value }))} placeholder="e.g., reference required" className="mt-1" /></div>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Assigned Locations</p>
              <p className="text-xs text-muted-foreground mb-3">Select which locations this operator operates in. Non-SuperAdmin users will only see these locations in the global filter.</p>
              {dbLocations.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No locations found in database</p>
              ) : (
                <div className="space-y-2">
                  {dbLocations.map(loc => (
                    <label key={loc.location_id} className="flex items-center gap-3 cursor-pointer group rounded-lg px-3 py-2 hover:bg-muted transition-colors border border-border">
                      <input
                        type="checkbox"
                        checked={(form.locations || []).includes(loc.location_id)}
                        onChange={e => {
                          const locs = form.locations || [];
                          setForm(f => ({ ...f, locations: e.target.checked ? [...locs, loc.location_id] : locs.filter(l => l !== loc.location_id) }));
                        }}
                        className="w-4 h-4 accent-teal-500 flex-shrink-0"
                      />
                      <div>
                        <span className="text-sm text-foreground font-medium">{loc.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{loc.location_id}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm text-foreground">Brand Color</Label>
              <div className="flex items-center gap-2 mt-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ background: c }} />
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