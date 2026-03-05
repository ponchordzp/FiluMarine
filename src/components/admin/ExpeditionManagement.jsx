import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, X, Check, MapPin, Clock } from 'lucide-react';

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


const LOCATION_LABELS = {
  ixtapa_zihuatanejo: 'Ixtapa-Zihuatanejo',
  acapulco: 'Acapulco',
  both: 'Both Locations'
};

const emptyForm = {
  expedition_id: '',
  title: '',
  description: '',
  location: 'both',

  duration: '',
  image: '',
  includes: [],
  ideal_for: '',
  visible: true,
  sort_order: 0
};

export default function ExpeditionManagement({ operatorFilter = null, currentUserOperator = '' }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [customInclude, setCustomInclude] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  // Resolve the active operator scope
  const activeOperator = operatorFilter && operatorFilter !== 'all' ? operatorFilter : (currentUserOperator || null);

  const { data: expeditions = [] } = useQuery({
    queryKey: ['expeditions'],
    queryFn: () => base44.entities.Expedition.list('sort_order')
  });

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

  const toggleVisibility = (exp) => {
    updateMutation.mutate({ id: exp.id, data: { ...exp, visible: !exp.visible } });
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setEditingExp(null);
    setDialogOpen(false);
  };

  const handleEdit = (exp) => {
    setEditingExp(exp);
    setFormData({ ...exp });
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
    let finalData = { ...formData };
    if (imageFile) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      finalData.image = file_url;
      setUploading(false);
    }
    if (editingExp) {
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

  const filtered = expeditions.filter((exp) => {
    if (locationFilter === 'all') return true;
    return exp.location === locationFilter || exp.location === 'both';
  });

  const grouped = {
    ixtapa_zihuatanejo: filtered.filter((e) => e.location === 'ixtapa_zihuatanejo' || e.location === 'both'),
    acapulco: filtered.filter((e) => e.location === 'acapulco' || e.location === 'both')
  };

  return (
    <div className="space-y-6">
      <div className="text-slate-50 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-slate-50 text-2xl font-semibold">Expedition Management</h2>
        <div className="flex items-center gap-3">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem>
              <SelectItem value="acapulco">Acapulco</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => {setFormData(emptyForm);setDialogOpen(true);}} className="bg-purple-600 text-primary-foreground px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add Expedition
          </Button>
        </div>
      </div>

      {expeditions.length === 0 &&
      <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-8 text-center text-amber-800">
            <p className="font-medium">No expeditions found.</p>
            <p className="text-sm mt-1">The initial expedition data hasn't been loaded yet. Add expeditions manually or they will sync from the home page data.</p>
          </CardContent>
        </Card>
      }

      {/* Grouped by location */}
      {Object.entries(grouped).map(([loc, exps]) =>
      exps.length === 0 ? null :
      <div key={loc}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h3 className="text-slate-50 font-semibold">{LOCATION_LABELS[loc]}</h3>
              <Badge variant="outline" className="text-slate-50 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">{exps.length} expeditions</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exps.map((exp) =>
          <Card key={exp.id} className={`overflow-hidden transition-all ${!exp.visible ? 'opacity-60 border-dashed' : ''}`}>
                  {exp.image &&
            <div className="aspect-video relative overflow-hidden">
                      <img src={exp.image} alt={exp.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                        <span className="text-white text-xs font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {exp.duration}
                        </span>

                      </div>
                    </div>
            }
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate">{exp.title}</h4>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <Badge className="text-xs bg-blue-100 text-blue-800">{LOCATION_LABELS[exp.location]}</Badge>
                          {!exp.visible && <Badge className="text-xs bg-slate-100 text-slate-600">Hidden</Badge>}
                        </div>
                      </div>
                    </div>

                    {exp.description &&
              <p className="text-xs text-slate-600 line-clamp-2">{exp.description}</p>
              }

                    {exp.includes?.length > 0 &&
              <div className="flex flex-wrap gap-1">
                        {exp.includes.slice(0, 4).map((inc, i) =>
                <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{inc}</span>
                )}
                        {exp.includes.length > 4 &&
                <span className="text-xs text-slate-500">+{exp.includes.length - 4} more</span>
                }
                      </div>
              }

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(exp)} className="flex-1 h-8 text-xs">
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleVisibility(exp)}
                  className={`h-8 px-2 ${exp.visible ? 'text-slate-600 hover:bg-slate-100' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'}`}
                  title={exp.visible ? 'Hide expedition' : 'Show expedition'}>

                        {exp.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {if (window.confirm(`Delete "${exp.title}"?`)) deleteMutation.mutate(exp.id);}}>

                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
          )}
            </div>
          </div>

      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {if (!open) resetForm();setDialogOpen(open);}}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExp ? 'Edit Expedition' : 'Add New Expedition'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Half-Day Sport Fishing" />
              </div>
              <div>
                <Label>Expedition ID *</Label>
                <Input required value={formData.expedition_id} onChange={(e) => setFormData({ ...formData, expedition_id: e.target.value })} placeholder="e.g. half_day_fishing" />
                <p className="text-xs text-slate-500 mt-1">Lowercase, underscores only. Used internally.</p>
              </div>
              <div>
                <Label>Location *</Label>
                <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Locations</SelectItem>
                    <SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem>
                    <SelectItem value="acapulco">Acapulco</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Duration</Label>
                <Input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 5 hours" />
              </div>
              <div>
                <Label>Ideal For</Label>
                <Input value={formData.ideal_for} onChange={(e) => setFormData({ ...formData, ideal_for: e.target.value })} placeholder="e.g. First-timers & families" />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-3 pt-6">
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
                {uploading ? 'Uploading...' : editingExp ? 'Save Changes' : 'Create Expedition'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>);

}