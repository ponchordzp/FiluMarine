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
  image: '',
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
      return base44.entities.Extra.update(editingId, { name: data.name, description: data.description, image: data.image });
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
      image: extra.image || '',
    });
    setEditOpen(true);
  };

  const [isUploading, setIsUploading] = useState(false);
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditForm(prev => ({...prev, image: file_url}));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const allOperators = loadOperators();

  // Filtering logic: superadmins see all extras; non-superadmins see only their operator's extras
  const filteredExtras = isSuperAdmin
    ? extras
    : extras.filter(extra => {
        if (!currentUser?.operator) return false;
        const allowed = extra.allowed_operators || [];
        // Show extras that are either explicitly allowed for this operator, or global (empty allowed_operators)
        return allowed.length === 0 || allowed.some(o => o.toLowerCase() === currentUser.operator.toLowerCase());
      });

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
          allOperators={allOperators}
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
          <div key={extra.id} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {extra.image ? (
              <img src={extra.image} alt={extra.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-white/10" />
            ) : (
              <div className="w-20 h-20 flex-shrink-0 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white/20" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-white">{extra.name}</span>
                {!extra.visible && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40">Hidden</span>}
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
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
              {extra.description && <p className="text-sm text-white/50 mt-1">{extra.description}</p>}
            </div>
            <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
              <Button size="sm" variant="ghost" className="text-white/40 hover:text-white bg-white/5 h-8 w-8 p-0" onClick={() => openEdit(extra)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-400/50 hover:text-red-400 bg-white/5 h-8 w-8 p-0"
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
                <Label>Image</Label>
                <div className="mt-1 border-2 border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center relative hover:bg-white/5 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading || editMutation.isPending}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center py-4">
                      <div className="h-6 w-6 animate-spin border-2 border-white border-t-transparent rounded-full mb-2"></div>
                      <p className="text-sm text-white/50">Uploading...</p>
                    </div>
                  ) : editForm.image ? (
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group">
                      <img src={editForm.image} alt="Extra" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm font-medium text-white">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 text-center px-4">
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center mb-3">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <p className="font-medium text-sm text-white">Click or drag image to upload</p>
                    </div>
                  )}
                </div>
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