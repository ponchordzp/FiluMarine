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
// Note: applicable_boats and applicable_trips removed — extras are now assigned per boat card

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
  allowed_operators: [],
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
    mutationFn: (data) => {
      if (!data.name || !data.name.trim()) {
        throw new Error('Extra name is required');
      }
      let saveData = { ...data };
      saveData.price = typeof saveData.price === 'string' ? parseFloat(saveData.price) || 0 : saveData.price;
      
      // Non-superadmins ALWAYS lock extras to ONLY their operator (strict isolation)
      if (!isSuperAdmin) {
        // Require currentUser to have operator before allowing save
        if (!currentUser?.operator) {
          throw new Error('User must have an operator assigned to create extras');
        }
        const op = currentUser.operator;
        saveData.allowed_operators = [op];
        // Generate unique operator tag on create
        if (!editing) {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 9);
          saveData.operator_tag = `${op}_${timestamp}_${random}`;
        }
      }
      return editing
        ? base44.entities.Extra.update(editing.id, saveData)
        : base44.entities.Extra.create(saveData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (error) => {
      console.error('Error saving extra:', error?.message || error);
      alert('Error: ' + (error?.message || 'Failed to save extra'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Extra.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extras'] }),
  });

  const generateTagMutation = useMutation({
    mutationFn: (id) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const tag = currentUser?.operator
        ? `${currentUser.operator}_${timestamp}_${random}`
        : `TAG_${timestamp}_${random}`;
      return base44.entities.Extra.update(id, { operator_tag: tag });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extras'] }),
  });

  const openEdit = (extra) => {
    setEditing(extra);
    setForm({
      name: extra.name,
      description: extra.description || '',
      price: extra.price ?? 0,
      allowed_operators: extra.allowed_operators || [],
    });
    setOpen(true);
  };

  const openNew = () => {
    if (!currentUser) {
      alert('Please wait for user data to load');
      return;
    }
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const toggleOperatorVisibility = (name) => {
    setForm(f => ({
      ...f,
      allowed_operators: f.allowed_operators.includes(name)
        ? f.allowed_operators.filter(o => o !== name)
        : [...f.allowed_operators, name],
    }));
  };

  const allOperators = loadOperators();

  // Strict operator isolation: non-superadmins see extras where their operator is listed OR where allowed_operators is empty (global)
  const filteredExtras = extras.filter(extra => {
    if (isSuperAdmin) return true; // Superadmin sees all
    if (!currentUser?.operator) return false; // Non-operator users see nothing
    const allowed = extra.allowed_operators || [];
    // Show if: (1) allowed list is empty (global extra), OR (2) their operator is in the list
    return allowed.length === 0 || allowed.some(o => o.toLowerCase() === currentUser.operator.toLowerCase());
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
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); setForm(emptyForm); } setOpen(v); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-purple-600 hover:bg-purple-700 text-white" disabled={!currentUser}>
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
                <Input className="mt-1" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
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


              <Button className="w-full" onClick={() => {
                if (!form.name || !form.name.trim()) {
                  alert('Please enter a name for the extra');
                  return;
                }
                const submitData = {
                  ...form,
                  name: form.name.trim(),
                };
                saveMutation.mutate(submitData);
              }} disabled={saveMutation.isPending || !currentUser || (!isSuperAdmin && !currentUser.operator)}>
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
                <div className="flex items-center gap-2 ml-6 mb-2 flex-wrap">
                  <span className="text-xs text-white/40 font-mono bg-white/5 px-2 py-1 rounded border border-white/10">
                    ID: {extra.operator_tag || extra.id}
                  </span>
                  {!extra.operator_tag && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10"
                      onClick={() => generateTagMutation.mutate(extra.id)}
                      disabled={generateTagMutation.isPending}
                    >
                      {generateTagMutation.isPending ? 'Generating...' : 'Generate Tag'}
                    </Button>
                  )}
              </div>
              {extra.description && <p className="text-sm text-white/50 ml-6 mt-1">{extra.description}</p>}

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