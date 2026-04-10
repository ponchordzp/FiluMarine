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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Sparkles, Copy } from 'lucide-react';
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

export default function ExtrasManagementFixed({ allBoats = [], locationFilter = 'all', operatorFilter = 'all' }) {
  const { user: currentUser } = useAuth();
  const isRealSuperAdmin = currentUser?.role === 'superadmin';
  
  // Treat as SuperAdmin only if they are a real super admin AND haven't filtered to a specific operator
  const isSuperAdminMode = isRealSuperAdmin && operatorFilter === 'all';
  // If they are filtering, impersonate that operator
  const currentOperator = !isSuperAdminMode && isRealSuperAdmin ? operatorFilter : (currentUser?.operator || 'FILU');
  
  const isSuperAdmin = isSuperAdminMode;

  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editOpen, setEditOpen] = useState(false);

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [extraToCopy, setExtraToCopy] = useState(null);
  const [selectedCopyOperator, setSelectedCopyOperator] = useState('');

  const { data: extras = [] } = useQuery({
    queryKey: ['extras'],
    queryFn: async () => {
      const data = await base44.entities.Extra.list();
      return data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
  });

  const { data: boats = [] } = useQuery({
    queryKey: ['all-boats'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  const allOperators = loadOperators();

  const isChartOperator = currentUser?.role === 'charter_operator';
  const isUserRestricted = currentUser && !isRealSuperAdmin && currentUser.operator;
  const userOperatorLocation = isUserRestricted ? (() => {
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

  const createCopyMutation = useMutation({
    mutationFn: (extra) => {
      const userOp = currentUser?.operator || 'FILU';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const tag = `${userOp}_${timestamp}_${random}`;
      
      return base44.entities.Extra.create({
        name: extra.name,
        description: extra.description || '',
        image: extra.image || '',
        price: extra.price || 0,
        operator_tag: tag,
        visible: true,
        sort_order: extra.sort_order || 0,
        allowed_operators: [userOp]
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extras'] }),
  });

  const superAdminCopyMutation = useMutation({
    mutationFn: (data) => {
      return base44.entities.Extra.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      setCopyDialogOpen(false);
      setSelectedCopyOperator('');
      setExtraToCopy(null);
    }
  });

  const handleSuperAdminCopy = (extra) => {
    setExtraToCopy(extra);
    setSelectedCopyOperator('');
    setCopyDialogOpen(true);
  };

  const submitSuperAdminCopy = () => {
    if (!selectedCopyOperator || !extraToCopy) return;
    
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const tag = `${selectedCopyOperator}_${timestamp}_${random}`;

    superAdminCopyMutation.mutate({
      name: extraToCopy.name,
      description: extraToCopy.description || '',
      image: extraToCopy.image || '',
      price: extraToCopy.price || 0,
      operator_tag: tag,
      visible: true,
      sort_order: extraToCopy.sort_order || 0,
      allowed_operators: [selectedCopyOperator]
    });
  };

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

  const filteredExtras = isSuperAdmin
    ? extras
    : extras.filter(extra => {
        const userOp = currentOperator || 'FILU';
        const allowed = extra.allowed_operators || [];
        return allowed.length === 0 || allowed.some(o => o.toLowerCase() === userOp.toLowerCase());
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
        ) : filteredExtras.map(extra => {
          const isGlobal = !extra.allowed_operators || extra.allowed_operators.length === 0;
          const userOp = currentOperator || 'FILU';
          const isOwner = !isGlobal && extra.allowed_operators.some(o => o.toLowerCase() === userOp.toLowerCase());
          const canEdit = isSuperAdmin || isOwner;

          return (
          <div key={extra.id} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {extra.image ? (
              <img src={extra.image} alt={extra.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-white/10" />
            ) : (
              <div className="w-20 h-20 flex-shrink-0 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white/20" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{extra.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {isSuperAdmin && !isGlobal && extra.allowed_operators?.length > 0 && <Badge className="text-[10px] bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-2 py-0.5 font-medium">{extra.allowed_operators[0]}</Badge>}
                    {isSuperAdmin && isGlobal && <Badge className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-2 py-0.5 font-medium">Global</Badge>}
                    {isOwner && !isSuperAdmin && <Badge className="text-[10px] bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-0.5 font-medium">Your copy</Badge>}
                    {!extra.visible && <Badge className="text-[10px] bg-white/10 text-white/40 border-white/20 px-2 py-0.5 font-medium">Hidden</Badge>}
                  </div>
                </div>
              </div>
              
              {extra.description && <p className="text-sm text-white/50 mt-1">{extra.description}</p>}
              
              <div className="flex gap-2 pt-2 mt-2 border-t border-white/5">
                {canEdit && (
                  <>
                    {isSuperAdmin && (
                      <Button variant="outline" size="sm" onClick={() => handleSuperAdminCopy(extra)} className="h-8 px-2 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30" title="Create copy for operator">
                        <Copy className="h-3 w-3 mr-1" /> Copy for Operator
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(extra)} className="flex-1 h-8 text-xs bg-white/5 text-white/70 hover:text-white border-white/10 hover:bg-white/10">
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8 px-2"
                      onClick={() => { if (window.confirm(`Delete "${extra.name}"?`)) deleteMutation.mutate(extra.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {!canEdit && (
                  <Button size="sm" variant="outline" className="h-8 text-xs text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10 px-2"
                    onClick={() => { if (window.confirm(`Create your own editable copy of "${extra.name}"?`)) createCopyMutation.mutate(extra); }}
                    disabled={createCopyMutation.isPending}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Your Copy
                  </Button>
                )}
              </div>
            </div>
          </div>
        )})}
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

      {/* Super Admin Copy Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Operator Copy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-slate-600">
              Create a unique copy of <strong>{extraToCopy?.name}</strong> for a specific operator. They will be able to customize their own version without affecting others.
            </p>
            <div>
              <Label>Select Operator</Label>
              <Select value={selectedCopyOperator} onValueChange={setSelectedCopyOperator}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an operator..." />
                </SelectTrigger>
                <SelectContent>
                  {allOperators.map(op => (
                    <SelectItem key={op.name} value={op.name}>{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitSuperAdminCopy} disabled={!selectedCopyOperator || superAdminCopyMutation.isPending}>
                Create Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}