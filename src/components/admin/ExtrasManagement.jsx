import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UserHeader from '@/components/UserHeader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Sparkles } from 'lucide-react';
import ExtraForm from './ExtraForm';

const OPERATOR_STORAGE_KEY = 'filu_operators';
function loadOperators() {
  try { const raw = localStorage.getItem(OPERATOR_STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return [{ id: 'filu', name: 'FILU', color: '#1e88e5' }];
}

const emptyForm = {
  name: '',
  description: '',
  price: 0,
};

export default function ExtrasManagement({ allBoats = [], locationFilter = 'all' }) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editOpen, setEditOpen] = useState(false);

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

  const editMutation = useMutation({
    mutationFn: (data) => {
      let saveData = { ...data };
      saveData.price = typeof saveData.price === 'string' ? parseFloat(saveData.price) || 0 : saveData.price;
      return base44.entities.Extra.update(editingId, saveData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      setEditOpen(false);
      setEditingId(null);
      setEditForm(emptyForm);
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
    setEditingId(extra.id);
    setEditForm({
      name: extra.name,
      description: extra.description || '',
      price: extra.price ?? 0,
    });
    setEditOpen(true);
  };

  const allOperators = loadOperators();

  // Filtering logic: everyone sees all extras (tag-based linking, no operator restrictions)
  const filteredExtras = extras;

  return (
    <div>
      <UserHeader />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Extras</h2>
          <p className="text-sm text-white/50">Manage optional add-ons available to guests per boat and trip type.</p>
          {locationFilter && locationFilter !== 'all' && <p className="text-xs text-cyan-300 mt-1">Filtered to location</p>}
          {isUserRestricted && userOperatorLocation && <p className="text-xs text-cyan-300 mt-1">Restricted to operator location and boats</p>}
        </div>
        <ExtraForm
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['extras'] })}
        />
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

      {editOpen && (
        <Dialog open={editOpen} onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            setEditForm(emptyForm);
          }
          setEditOpen(open);
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Extra</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input className="mt-1" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Open Bar, Bait Pack" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1" rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description for guests..." />
              </div>
              <div>
                <Label>Price (MXN)</Label>
                <Input className="mt-1" type="number" min="0" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
              </div>



              <Button className="w-full" onClick={() => {
                if (!editForm.name || !editForm.name.trim()) {
                  alert('Please enter a name for the extra');
                  return;
                }
                editMutation.mutate(editForm);
              }} disabled={editMutation.isPending}>
                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}