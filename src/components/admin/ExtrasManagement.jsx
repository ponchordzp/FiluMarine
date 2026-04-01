import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Sparkles } from 'lucide-react';

const OPERATOR_STORAGE_KEY = 'filu_operators';
function loadOperators() {
  try { const raw = localStorage.getItem(OPERATOR_STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return [{ id: 'filu', name: 'FILU', color: '#1e88e5' }];
}

const EXPERIENCE_TYPES = [
  { value: 'half_day_fishing', label: 'Half Day Fishing' },
  { value: 'full_day_fishing', label: 'Full Day Fishing' },
  { value: 'extended_fishing', label: 'Extended Fishing' },
  { value: 'snorkeling', label: 'Snorkeling' },
  { value: 'coastal_leisure', label: 'Coastal Leisure' },
];

const emptyForm = {
  name: '',
  description: '',
  price: 0,
  applicable_boats: [],
  applicable_trips: [],
  allowed_operators: [],
  visible: true,
  sort_order: 0,
};

export default function ExtrasManagement({ allBoats = [], locationFilter = 'all' }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setIsSuperAdmin(user?.role === 'superadmin');
    };
    fetchUser();
  }, []);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: extras = [] } = useQuery({
    queryKey: ['extras'],
    queryFn: () => base44.entities.Extra.list('sort_order'),
  });

  const { data: boats = [] } = useQuery({
    queryKey: ['all-boats'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  // Charter operators MUST be restricted to their operator's location only
  const isChartOperator = currentUser?.role === 'charter_operator';
  const isUserRestricted = currentUser && !isSuperAdmin && currentUser.operator;
  const userOperatorLocation = isUserRestricted ? (() => {
    // Determine location from boats belonging to user's operator
    const userBoats = boats.filter(b => (b.operator || '').toLowerCase() === (currentUser.operator || '').toLowerCase());
    if (userBoats.length > 0) {
      const uniqueLocs = [...new Set(userBoats.map(b => b.location))];
      return uniqueLocs.length === 1 ? uniqueLocs[0] : null;
    }
    return null;
  })() : null;

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Extra.update(editing.id, data)
      : base44.entities.Extra.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Extra.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extras'] }),
  });

  const openEdit = (extra) => {
    setEditing(extra);
    setForm({
      name: extra.name,
      description: extra.description || '',
      price: extra.price ?? 0,
      applicable_boats: extra.applicable_boats || [],
      applicable_trips: extra.applicable_trips || [],
      allowed_operators: extra.allowed_operators || [],
      visible: extra.visible ?? true,
      sort_order: extra.sort_order ?? 0,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const toggleBoat = (name) => {
    setForm(f => ({
      ...f,
      applicable_boats: f.applicable_boats.includes(name)
        ? f.applicable_boats.filter(b => b !== name)
        : [...f.applicable_boats, name],
    }));
  };

  const toggleOperatorVisibility = (name) => {
    setForm(f => ({
      ...f,
      allowed_operators: f.allowed_operators.includes(name)
        ? f.allowed_operators.filter(o => o !== name)
        : [...f.allowed_operators, name],
    }));
  };

  const toggleTrip = (value) => {
    setForm(f => ({
      ...f,
      applicable_trips: f.applicable_trips.includes(value)
        ? f.applicable_trips.filter(t => t !== value)
        : [...f.applicable_trips, value],
    }));
  };

  const allOperators = loadOperators();

  // Build list of active boats, filtered by operator for non-superadmin
  const displayBoats = (() => {
    let boats_ = boats.filter(b => b.status !== 'inactive');
    if (!isSuperAdmin && currentUser?.operator) {
      boats_ = boats_.filter(b => (b.operator || '').toLowerCase() === (currentUser.operator || '').toLowerCase());
    }
    return boats_;
  })();

  const boatNames = displayBoats.map(b => b.name);

  // Group boats by operator (for superadmin grouped display)
  const boatsByOperator = displayBoats.reduce((acc, boat) => {
    const op = boat.operator || 'No Operator';
    if (!acc[op]) acc[op] = [];
    acc[op].push(boat.name);
    return acc;
  }, {});

  // Filter extras: non-superadmin operators only see extras allowed for them (empty allowed_operators = visible to all)
  const filteredExtras = extras.filter(extra => {
    if (isSuperAdmin) return true;
    if (!currentUser?.operator) return true;
    const allowed = extra.allowed_operators || [];
    if (allowed.length === 0) return true;
    return allowed.some(o => o.toLowerCase() === currentUser.operator.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
         <div>
           <h2 className="text-xl font-bold text-white mb-1">Extras</h2>
           <p className="text-sm text-white/50">Manage optional add-ons available to guests per boat and trip type.</p>
           {locationFilter && locationFilter !== 'all' && <p className="text-xs text-cyan-300 mt-1">Filtered to location</p>}
           {isUserRestricted && userOperatorLocation && <p className="text-xs text-cyan-300 mt-1">Restricted to operator location and boats</p>}
         </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" />Add Extra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Edit Extra' : 'New Extra'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Open Bar, Bait Pack" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description for guests..." />
              </div>
              <div>
                <Label>Price (MXN)</Label>
                <Input className="mt-1" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
              </div>

              <div>
                <Label className="mb-2 block">Applicable Boats <span className="text-slate-400 font-normal">(empty = all boats)</span></Label>
                {isSuperAdmin ? (
                  <div className="space-y-3">
                    {Object.entries(boatsByOperator).map(([opName, opBoats]) => (
                      <div key={opName}>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{opName}</p>
                        <div className="grid grid-cols-2 gap-2 pl-2">
                          {opBoats.map(name => (
                            <label key={name} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 hover:text-slate-900">
                              <Checkbox checked={form.applicable_boats.includes(name)} onCheckedChange={() => toggleBoat(name)} />
                              {name}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : boatNames.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No boats assigned to your fleet yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {boatNames.map(name => (
                      <label key={name} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 hover:text-slate-900">
                        <Checkbox checked={form.applicable_boats.includes(name)} onCheckedChange={() => toggleBoat(name)} />
                        {name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {isSuperAdmin && (
                <div>
                  <Label className="mb-1 block">Operator Visibility <span className="text-slate-400 font-normal">(empty = visible to all operators)</span></Label>
                  <p className="text-xs text-slate-400 mb-2">Restrict this extra so only selected operators can see and use it.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {allOperators.map(op => (
                      <label key={op.id || op.name} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 hover:text-slate-900">
                        <Checkbox
                          checked={form.allowed_operators.includes(op.name)}
                          onCheckedChange={() => toggleOperatorVisibility(op.name)}
                        />
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ background: op.color || '#6366f1' }} />
                          {op.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-2 block">Applicable Trip Types <span className="text-slate-400 font-normal">(empty = all trips)</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_TYPES.map(t => (
                    <label key={t.value} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 hover:text-slate-900">
                      <Checkbox
                        checked={form.applicable_trips.includes(t.value)}
                        onCheckedChange={() => toggleTrip(t.value)}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Sort Order</Label>
                <Input className="mt-1" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.visible} onCheckedChange={v => setForm(f => ({ ...f, visible: v }))} />
                <Label>Visible in booking flow</Label>
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {filteredExtras.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No extras yet. Add one to get started.</p>
          </div>
        ) : filteredExtras.map(extra => (
          <div key={extra.id} className="flex items-start justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="font-semibold text-white">{extra.name}</span>
                {!extra.visible && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40">Hidden</span>}
                {extra.price > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.3)' }}>
                    ${extra.price?.toLocaleString()} MXN
                  </span>
                )}
              </div>
              {extra.description && <p className="text-sm text-white/50 ml-6">{extra.description}</p>}
              <div className="flex flex-wrap gap-1 mt-2 ml-6">
                {(() => {
                  if (!isSuperAdmin) {
                    // Non-superadmin: only show boats from their own fleet
                    if (boatNames.length === 0) return null; // operator has no boats yet
                    const myBoats = (extra.applicable_boats || []).filter(b => boatNames.includes(b));
                    if (myBoats.length > 0)
                      return myBoats.map(b => <span key={b} className="text-xs px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">{b}</span>);
                    if (extra.applicable_boats?.length > 0)
                      return null; // extra is for other operators' boats, hide entirely
                    return <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/15">All your boats</span>;
                  }
                  // Superadmin: show all boat tags
                  if (extra.applicable_boats?.length > 0)
                    return extra.applicable_boats.map(b => <span key={b} className="text-xs px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">{b}</span>);
                  return <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/15">All boats</span>;
                })()}
              </div>
              <div className="flex flex-wrap gap-1 mt-1 ml-6">
                {extra.applicable_trips?.length > 0
                  ? extra.applicable_trips.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">{t.replace(/_/g, ' ')}</span>)
                  : <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/15">All trip types</span>}
              </div>
              {isSuperAdmin && extra.allowed_operators?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 ml-6">
                  <span className="text-[10px] text-white/30 mr-1 self-center">Ops:</span>
                  {extra.allowed_operators.map(o => {
                    const op = allOperators.find(x => x.name === o);
                    return <span key={o} className="text-xs px-1.5 py-0.5 rounded border font-medium text-white" style={{ background: (op?.color || '#6366f1') + '33', borderColor: (op?.color || '#6366f1') + '66' }}>{o}</span>;
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="ghost" className="text-white/40 hover:text-white" onClick={() => openEdit(extra)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-400/50 hover:text-red-400"
                onClick={() => { if (window.confirm(`Delete "${extra.name}"?`)) deleteMutation.mutate(extra.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}