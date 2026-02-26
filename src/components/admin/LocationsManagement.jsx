import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, MapPin, X, Upload, Image as ImageIcon } from 'lucide-react';

const REGION_LABELS = {
  ixtapa_zihuatanejo: 'Ixtapa-Zihuatanejo',
  acapulco: 'Acapulco',
};

const emptyForm = {
  destination_id: '',
  name: '',
  location: '',
  coordinates: '',
  summary: '',
  activities: [],
  images: ['', '', '', ''],
  region: 'ixtapa_zihuatanejo',
};

export default function LocationsManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDest, setEditingDest] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [activityInput, setActivityInput] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);
  const [uploading, setUploading] = useState(false);

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: () => base44.entities.DestinationContent.list('-created_date'),
    refetchInterval: 5000, // real-time sync every 5s
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DestinationContent.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['destinations'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DestinationContent.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['destinations'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DestinationContent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['destinations'] }),
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setActivityInput('');
    setEditingDest(null);
    setDialogOpen(false);
    setImageFiles([null, null, null, null]);
  };

  const handleEdit = (dest) => {
    setEditingDest(dest);
    setFormData({
      destination_id: dest.destination_id || '',
      name: dest.name || '',
      location: dest.location || '',
      coordinates: dest.coordinates || '',
      summary: dest.summary || '',
      activities: dest.activities || [],
      images: dest.images?.length === 4 ? dest.images : ['', '', '', ''],
      region: dest.region || 'ixtapa_zihuatanejo',
    });
    setImageFiles([null, null, null, null]);
    setDialogOpen(true);
  };

  const handleImageFileChange = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFiles = [...imageFiles];
    newFiles[index] = file;
    setImageFiles(newFiles);
    // Show local preview
    const url = URL.createObjectURL(file);
    const newImages = [...formData.images];
    newImages[index] = url;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const finalImages = [...formData.images];
    for (let i = 0; i < 4; i++) {
      if (imageFiles[i]) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFiles[i] });
        finalImages[i] = file_url;
      }
    }
    setUploading(false);
    const finalData = { ...formData, images: finalImages };
    if (editingDest) {
      updateMutation.mutate({ id: editingDest.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const addActivity = () => {
    if (!activityInput.trim()) return;
    setFormData(prev => ({ ...prev, activities: [...prev.activities, activityInput.trim()] }));
    setActivityInput('');
  };

  const removeActivity = (i) => {
    setFormData(prev => ({ ...prev, activities: prev.activities.filter((_, idx) => idx !== i) }));
  };

  const updateImageUrl = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
    const newFiles = [...imageFiles];
    newFiles[index] = null;
    setImageFiles(newFiles);
  };

  const filtered = destinations.filter(d => regionFilter === 'all' || d.region === regionFilter);

  const grouped = {
    ixtapa_zihuatanejo: filtered.filter(d => d.region === 'ixtapa_zihuatanejo'),
    acapulco: filtered.filter(d => d.region === 'acapulco'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Locations Management</h2>
          <p className="text-sm text-slate-500 mt-1">Changes sync to the home page in real time.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem>
              <SelectItem value="acapulco">Acapulco</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setFormData(emptyForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>
      </div>

      {destinations.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-8 text-center text-blue-800">
            <MapPin className="h-10 w-10 mx-auto mb-2 text-blue-400" />
            <p className="font-medium">No locations yet.</p>
            <p className="text-sm mt-1">Add locations to display them on the home page Destinations section.</p>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([region, dests]) =>
        dests.length === 0 ? null : (
          <div key={region}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-slate-700">{REGION_LABELS[region]}</h3>
              <Badge variant="outline">{dests.length} locations</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dests.map(dest => (
                <Card key={dest.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {dest.images?.[0] && (
                    <div className="aspect-video overflow-hidden">
                      <img src={dest.images[0]} alt={dest.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate">{dest.name}</h4>
                        {dest.location && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {dest.location}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 text-xs shrink-0">{REGION_LABELS[dest.region]}</Badge>
                    </div>

                    {dest.summary && (
                      <p className="text-xs text-slate-600 line-clamp-2">{dest.summary}</p>
                    )}

                    {dest.activities?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dest.activities.slice(0, 3).map((act, i) => (
                          <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{act}</span>
                        ))}
                        {dest.activities.length > 3 && (
                          <span className="text-xs text-slate-400">+{dest.activities.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-slate-400">
                      {dest.images?.filter(Boolean).length || 0} / 4 images
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(dest)} className="flex-1 h-8 text-xs">
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => { if (window.confirm(`Delete "${dest.name}"?`)) deleteMutation.mutate(dest.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDest ? 'Edit Location' : 'Add New Location'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Playa Las Gatas" />
              </div>
              <div>
                <Label>Destination ID *</Label>
                <Input required value={formData.destination_id} onChange={e => setFormData({ ...formData, destination_id: e.target.value })} placeholder="e.g. playa-las-gatas" />
                <p className="text-xs text-slate-400 mt-1">Lowercase, hyphens only.</p>
              </div>
              <div>
                <Label>Region *</Label>
                <Select value={formData.region} onValueChange={v => setFormData({ ...formData, region: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem>
                    <SelectItem value="acapulco">Acapulco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location / Address</Label>
                <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Zihuatanejo, Guerrero" />
              </div>
              <div className="md:col-span-2">
                <Label>Coordinates</Label>
                <Input value={formData.coordinates} onChange={e => setFormData({ ...formData, coordinates: e.target.value })} placeholder="e.g. 17.6294° N, 101.5589° W" />
              </div>
            </div>

            <div>
              <Label>Description / Summary</Label>
              <Textarea rows={4} value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} placeholder="Describe this location for visitors..." />
            </div>

            {/* Activities */}
            <div>
              <Label className="mb-2 block">Activities</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={activityInput}
                  onChange={e => setActivityInput(e.target.value)}
                  placeholder="e.g. Snorkeling"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addActivity())}
                />
                <Button type="button" onClick={addActivity} variant="outline">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.activities.map((act, i) => (
                  <span key={i} className="flex items-center gap-1 text-sm bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
                    {act}
                    <button type="button" onClick={() => removeActivity(i)} className="ml-1 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <Label className="mb-2 block flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Photos (up to 4) — shown on the home page
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <Label className="text-xs text-slate-500">Photo {i + 1}{i === 0 ? ' (main)' : ''}</Label>
                    {formData.images[i] && (
                      <div className="relative">
                        <img src={formData.images[i]} alt={`Preview ${i + 1}`} className="w-full h-28 object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={() => updateImageUrl(i, '')}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <label className="flex-1 cursor-pointer">
                        <span className="flex items-center gap-1 text-xs border border-slate-300 rounded px-2 py-1.5 hover:bg-slate-50 text-slate-600">
                          <Upload className="h-3 w-3" /> Upload
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageFileChange(i, e)} />
                      </label>
                    </div>
                    <Input
                      placeholder="or paste URL..."
                      value={!imageFiles[i] ? (formData.images[i] || '') : ''}
                      onChange={e => updateImageUrl(i, e.target.value)}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading} className="flex-1">
                {uploading ? 'Uploading images...' : editingDest ? 'Save Changes' : 'Create Location'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}