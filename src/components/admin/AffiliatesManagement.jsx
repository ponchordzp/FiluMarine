import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Copy, CheckCircle, Building2, Hotel, Utensils, Globe, Tag } from 'lucide-react';

const TYPE_CONFIG = {
  restaurant:    { label: 'Restaurant',     Icon: Utensils,   color: 'bg-orange-100 text-orange-700' },
  hotel:         { label: 'Hotel',          Icon: Hotel,      color: 'bg-blue-100 text-blue-700' },
  travel_agency: { label: 'Travel Agency',  Icon: Globe,      color: 'bg-teal-100 text-teal-700' },
  tour_operator: { label: 'Tour Operator',  Icon: Tag,        color: 'bg-purple-100 text-purple-700' },
  other:         { label: 'Other',          Icon: Building2,  color: 'bg-slate-100 text-slate-700' },
};

function generateCode(name, type) {
  const prefix = (type || 'AFF').toUpperCase().replace(/_/g, '-').slice(0, 4);
  const namePart = (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${namePart}-${suffix}`;
}

const emptyForm = { name: '', type: 'other', contact_name: '', email: '', phone: '', code: '', commission_pct: 0, notes: '', is_active: true };

export default function AffiliatesManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [copiedId, setCopiedId] = useState(null);

  const { data: affiliates = [] } = useQuery({
    queryKey: ['affiliates'],
    queryFn: () => base44.entities.Affiliate.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Affiliate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['affiliates'] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Affiliate.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['affiliates'] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Affiliate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affiliates'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (aff) => {
    setEditing(aff);
    setForm({ name: aff.name, type: aff.type || 'other', contact_name: aff.contact_name || '', email: aff.email || '', phone: aff.phone || '', code: aff.code, commission_pct: aff.commission_pct || 0, notes: aff.notes || '', is_active: aff.is_active !== false });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const copyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const autoGenerateCode = () => {
    setForm(f => ({ ...f, code: generateCode(f.name, f.type) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-200 text-2xl font-semibold">Affiliates</h2>
          <p className="text-slate-400 mt-1 text-sm">Restaurants, hotels, travel agencies and other partners that refer bookings</p>
        </div>
        <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" /> Add Affiliate
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Affiliates', value: affiliates.length, color: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.3)', text: 'text-teal-300' },
          { label: 'Active', value: affiliates.filter(a => a.is_active !== false).length, color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: 'text-emerald-300' },
          { label: 'Inactive', value: affiliates.filter(a => a.is_active === false).length, color: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: 'text-red-300' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.color, border: `1px solid ${s.border}` }}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {affiliates.length === 0 ? (
          <div className="text-center py-16" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
            <Building2 className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No affiliates yet. Add your first partner.</p>
          </div>
        ) : affiliates.map(aff => {
          const cfg = TYPE_CONFIG[aff.type] || TYPE_CONFIG.other;
          const Icon = cfg.Icon;
          return (
            <div key={aff.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-teal-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-white">{aff.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                  {aff.is_active === false && <Badge className="bg-slate-200 text-slate-600 text-xs">Inactive</Badge>}
                  {aff.commission_pct > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.3)' }}>
                      {aff.commission_pct}% commission
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-white/50">
                  {aff.contact_name && <span>{aff.contact_name}</span>}
                  {aff.email && <span>• {aff.email}</span>}
                  {aff.phone && <span>• {aff.phone}</span>}
                </div>
              </div>
              {/* Affiliate code pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)' }}>
                <span className="font-mono text-teal-300 text-sm font-semibold">{aff.code}</span>
                <button onClick={() => copyCode(aff.id, aff.code)} className="text-teal-400 hover:text-white transition-colors ml-1">
                  {copiedId === aff.id ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => openEdit(aff)} className="text-white/40 hover:text-white">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { if (window.confirm(`Delete affiliate "${aff.name}"?`)) deleteMutation.mutate(aff.id); }} className="text-red-400/50 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit: ${editing.name}` : 'Add New Affiliate'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Business Name *</Label>
                <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Hotel Camino Real" />
              </div>
              <div className="col-span-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input className="mt-1" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="John Doe" />
              </div>
              <div>
                <Label>Phone / WhatsApp</Label>
                <Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+52 755..." />
              </div>
              <div className="col-span-2">
                <Label>Email</Label>
                <Input className="mt-1" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@hotel.com" />
              </div>
              <div>
                <Label>Commission %</Label>
                <Input className="mt-1" type="number" min="0" max="100" value={form.commission_pct} onChange={e => setForm(f => ({ ...f, commission_pct: parseFloat(e.target.value) || 0 }))} placeholder="0" />
              </div>
              <div className="col-span-2">
                <Label>Affiliate Code *</Label>
                <div className="flex gap-2 mt-1">
                  <Input className="font-mono" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '-') }))} placeholder="e.g., HOTEL-CAMINO-XY3" />
                  <Button type="button" variant="outline" onClick={autoGenerateCode} className="shrink-0 text-xs px-3">Auto</Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Customers paste this code at checkout. Auto-generates one based on name & type.</p>
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Input className="mt-1" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="aff_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <Label htmlFor="aff_active" className="cursor-pointer">Active</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={!form.name.trim() || !form.code.trim() || createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create Affiliate'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}