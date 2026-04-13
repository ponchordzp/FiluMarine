import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, X, Check, Clock, Copy } from 'lucide-react';

const COMMON_INCLUDES = [
'Fishing equipment',
'Bait & tackle',
'Ice & cooler',
'Gas included',
'Snorkel equipment',
'Life vests',
'Drinks',
'Drinks & snacks',
'Music system',
'Seating',
'Restaurant stops available',
'Premium gear',
'Lunch & drinks',
'Full meals & drinks',
'Starlink & CCTV',
'All equipment',
'Sunscreen',
'Towels',
'First aid kit',
'Captain & crew included'];


const emptyForm = {
  expedition_id: '',
  title: '',
  description: '',
  duration: '',
  image: '',
  includes: [],
  ideal_for: '',
  visible: true,
  sort_order: 0,
  operator: ''
};

export default function ExpeditionManagement({ operatorFilter = 'all' }) {
  // Determine current operator context
  const currentOperator = operatorFilter === 'all' ? '' : operatorFilter;

  const isSuperAdmin = operatorFilter === 'all';
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [isForking, setIsForking] = useState(false); // forking = creating operator copy of a global expedition
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [customInclude, setCustomInclude] = useState('');

  const { data: expeditions = [] } = useQuery({
    queryKey: ['expeditions'],
    queryFn: () => base44.entities.Expedition.list('sort_order')
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['operators'],
    queryFn: () => base44.entities.CharterOperator.list()
  });

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [expToCopy, setExpToCopy] = useState(null);
  const [selectedCopyOperator, setSelectedCopyOperator] = useState('');

  const handleSuperAdminCopy = (exp) => {
    setExpToCopy(exp);
    setSelectedCopyOperator('');
    setCopyDialogOpen(true);
  };

  const submitCopy = () => {
    if (!selectedCopyOperator) return;
    const finalData = { ...expToCopy, operator: selectedCopyOperator };
    delete finalData.id;
    createMutation.mutate(finalData, {
      onSuccess: () => {
        setCopyDialogOpen(false);
      }
    });
  };

  // Filter: superadmin sees everything; operator sees global + their own copies
  // If an operator has their own copy of an expedition_id, prefer that over the global one
  const visibleExpeditions = (() => {
    if (isSuperAdmin) return expeditions;
    // Collect operator's own expeditions
    const ownExps = expeditions.filter(e => e.operator && e.operator.toLowerCase() === currentOperator.toLowerCase());
    const ownIds = new Set(ownExps.map(e => e.expedition_id));
    // Include global expeditions that don't have an operator-specific override
    const globalExps = expeditions.filter(e => !e.operator && !ownIds.has(e.expedition_id));
    return [...globalExps, ...ownExps].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  })();

  // Check if an expedition is "owned" by current operator (can be directly edited/deleted)
  const isOwned = (exp) => isSuperAdmin || (exp.operator && exp.operator.toLowerCase() === currentOperator.toLowerCase());

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expedition.create(data),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['expeditions'] });resetForm();}
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expedition.update(id, data),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['expeditions'] });resetForm();}
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expedition.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expeditions'] })
  });

  const isHiddenForCurrentOperator = (exp) => {
    if (!currentOperator) return !exp.visible; // superadmin: use global flag
    return (exp.hidden_for_operators || []).includes(currentOperator);
  };

  const toggleVisibility = (exp) => {
    if (!currentOperator) {
      // superadmin: toggle global visible
      updateMutation.mutate({ id: exp.id, data: { visible: !exp.visible } });
    } else {
      // operator: toggle their name in hidden_for_operators
      const hidden = exp.hidden_for_operators || [];
      const isHidden = hidden.includes(currentOperator);
      const updatedHidden = isHidden
        ? hidden.filter(o => o !== currentOperator)
        : [...hidden, currentOperator];
      updateMutation.mutate({ id: exp.id, data: { hidden_for_operators: updatedHidden } });
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setEditingExp(null);
    setIsForking(false);
    setDialogOpen(false);
  };

  const handleEdit = (exp) => {
    if (!isOwned(exp) && currentOperator) {
      // Fork: editing a global expedition creates an operator-specific copy
      setIsForking(true);
      setEditingExp(null); // treat as new
      setFormData({ ...exp, operator: currentOperator, id: undefined });
    } else {
      setIsForking(false);
      setEditingExp(exp);
      setFormData({ ...exp });
    }
    setImagePreview(exp.image || '');
    setDialogOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalData = { ...formData, operator: isSuperAdmin ? (formData.operator || '') : currentOperator };
    delete finalData.id;
    if (imageFile) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      finalData.image = file_url;
      setUploading(false);
    }
    if (editingExp && !isForking) {
      updateMutation.mutate({ id: editingExp.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const toggleInclude = (item) => {
    setFormData((prev) => ({
      ...prev,
      includes: prev.includes.includes(item) ?
      prev.includes.filter((i) => i !== item) :
      [...prev.includes, item]
    }));
  };

  const addCustomInclude = () => {
    if (!customInclude.trim()) return;
    setFormData((prev) => ({ ...prev, includes: [...prev.includes, customInclude.trim()] }));
    setCustomInclude('');
  };

  const removeInclude = (item) => {
    setFormData((prev) => ({ ...prev, includes: prev.includes.filter((i) => i !== item) }));
  };



  return (
    <div className="space-y-6">
      <div className="text-slate-50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-slate-50 text-2xl font-semibold">Expedition Catalog</h2>
          <p className="text-xs text-slate-400 mt-0.5">Define expedition types. Assign them to individual boats in the Vessel Editor.</p>
        </div>
        <Button onClick={() => {setFormData(emptyForm);setDialogOpen(true);}} className="bg-purple-600 hover:bg-purple-700 h-9">
          <Plus className="h-4 w-4 mr-2" /> Add Expedition
        </Button>
      </div>

      {visibleExpeditions.length === 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-8 text-center text-amber-800">
            <p className="font-medium">No expeditions in catalog yet.</p>
            <p className="text-sm mt-1">Add expedition types here, then assign them to boats in the Vessel Editor.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleExpeditions.map((exp) => (
          <Card key={exp.id} className={`overflow-hidden transition-all ${isHiddenForCurrentOperator(exp) ? 'opacity-60 border-dashed' : ''}`}>
            {exp.image && (
              <div className="aspect-video relative overflow-hidden">
                <img src={exp.image} alt={exp.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <span className="text-white text-xs font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {exp.duration}
                  </span>
                </div>
              </div>
            )}
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate">{exp.title}</h4>
                  {isSuperAdmin && <p className="text-xs text-slate-400 font-mono mt-0.5">{exp.expedition_id}</p>}
                  {isSuperAdmin && exp.operator && <Badge className="text-xs bg-indigo-100 text-indigo-700 mt-1 mr-1">{exp.operator}</Badge>}
                  {isSuperAdmin && !exp.operator && <Badge className="text-xs bg-emerald-100 text-emerald-700 mt-1 mr-1">Global</Badge>}
                  {isOwned(exp) && !isSuperAdmin && <Badge className="text-xs bg-blue-100 text-blue-600 mt-1">Your copy</Badge>}
                  {isHiddenForCurrentOperator(exp) && <Badge className="text-xs bg-slate-100 text-slate-600 mt-1">Hidden</Badge>}
                </div>
              </div>
              {exp.description && <p className="text-xs text-slate-600 line-clamp-2">{exp.description}</p>}
              {exp.includes?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {exp.includes.slice(0, 3).map((inc, i) => (
                    <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{inc}</span>
                  ))}
                  {exp.includes.length > 3 && <span className="text-xs text-slate-500">+{exp.includes.length - 3} more</span>}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {isSuperAdmin && (
                  <Button variant="outline" size="sm" onClick={() => handleSuperAdminCopy(exp)} className="h-8 px-2 text-indigo-600 hover:bg-indigo-50 border-indigo-200" title="Create copy for operator">
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleEdit(exp)} className="flex-1 h-8 text-xs">
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleVisibility(exp)}
                  className={`h-8 px-2 ${!isHiddenForCurrentOperator(exp) ? 'text-slate-600 hover:bg-slate-100' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'}`}>
                  {!isHiddenForCurrentOperator(exp) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="destructive" size="sm" className="h-8 px-2"
                  disabled={!isOwned(exp)}
                  title={!isOwned(exp) ? 'Cannot delete a global expedition' : ''}
                  onClick={() => {if (isOwned(exp) && window.confirm(`Delete "${exp.title}"?`)) deleteMutation.mutate(exp.id);}}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Operator Copy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-slate-600">
              Create a unique copy of <strong>{expToCopy?.title}</strong> for a specific operator. They will be able to customize their own version without affecting the global expedition.
            </p>
            <div>
              <Label>Select Operator</Label>
              <Select value={selectedCopyOperator} onValueChange={setSelectedCopyOperator}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an operator..." />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.name} value={op.name}>{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitCopy} disabled={!selectedCopyOperator || createMutation.isPending}>
                Create Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {if (!open) resetForm();setDialogOpen(open);}}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExp && !isForking ? 'Edit Expedition' : isForking ? 'Customize Expedition (Your Copy)' : 'Add New Expedition'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Half-Day Sport Fishing" />
              </div>
              <div>
                <Label>Expedition ID *</Label>
                <Input required value={formData.expedition_id} onChange={(e) => setFormData({ ...formData, expedition_id: e.target.value })} placeholder="e.g. half_day_fishing" disabled={isForking} />
                <p className="text-xs text-slate-500 mt-1">{isForking ? 'ID is locked to match the original for boat compatibility.' : 'Lowercase, underscores only. Used by boats.'}</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visible: !formData.visible })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${formData.visible ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-300 text-slate-600'}`}>

                  {formData.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {formData.visible ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe this expedition..." />
            </div>

            <div>
              <Label>Ideal For</Label>
              <Input value={formData.ideal_for || ''} onChange={(e) => setFormData({ ...formData, ideal_for: e.target.value })} placeholder="e.g. Couples, families and friend groups" />
            </div>

            {/* Image */}
            <div>
              <Label>Expedition Image</Label>
              <div className="space-y-2">
                {imagePreview &&
                <div className="relative w-full h-44 rounded-lg overflow-hidden border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                }
                <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">or paste a URL:</span>
                  <Input
                    placeholder="https://..."
                    value={formData.image && !imageFile ? formData.image : ''}
                    onChange={(e) => {setFormData({ ...formData, image: e.target.value });setImagePreview(e.target.value);setImageFile(null);}}
                    className="text-sm" />

                </div>
              </div>
            </div>

            {/* Includes */}
            <div>
              <Label className="mb-2 block">What's Included</Label>

              {/* Selected items */}
              {formData.includes.length > 0 &&
              <div className="flex flex-wrap gap-2 mb-3">
                  {formData.includes.map((item, i) =>
                <span key={i} className="flex items-center gap-1 text-sm bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
                      <Check className="h-3 w-3" />
                      {item}
                      <button type="button" onClick={() => removeInclude(item)} className="ml-1 hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                )}
                </div>
              }

              {/* Quick-add chips */}
              <p className="text-xs text-slate-500 mb-2">Quick add common items:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_INCLUDES.map((item) => {
                  const selected = formData.includes.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInclude(item)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-700'}`}>

                      {selected && <Check className="inline h-3 w-3 mr-1" />}
                      {item}
                    </button>);

                })}
              </div>

              {/* Custom include */}
              <div className="flex gap-2">
                <Input
                  value={customInclude}
                  onChange={(e) => setCustomInclude(e.target.value)}
                  placeholder="Add custom item..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomInclude())}
                  className="text-sm" />

                <Button type="button" variant="outline" size="sm" onClick={addCustomInclude}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading} className="flex-1">
                {uploading ? 'Uploading...' : (editingExp && !isForking) ? 'Save Changes' : isForking ? 'Save My Copy' : 'Create Expedition'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>);

}