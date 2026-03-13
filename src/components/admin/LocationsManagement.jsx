import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, MapPin, Eye, EyeOff, Upload, X } from 'lucide-react';

const emptyForm = {
  location_id: '',
  name: '',
  state: '',
  description: '',
  coordinates: '',
  image: '',
  visible: true,
  sort_order: 0
};

export default function LocationsManagement({ operatorFilter = 'all' }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list('sort_order'),
    refetchInterval: 5000
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Location.create(data),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['locations'] });resetForm();}
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Location.update(id, data),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['locations'] });resetForm();}
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Location.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] })
  });

  const toggleVisibility = (loc) => {
    updateMutation.mutate({ id: loc.id, data: { visible: !loc.visible } });
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingLoc(null);
    setDialogOpen(false);
    setImageFile(null);
  };

  const handleEdit = (loc) => {
    setEditingLoc(loc);
    setFormData({
      location_id: loc.location_id || '',
      name: loc.name || '',
      state: loc.state || '',
      description: loc.description || '',
      coordinates: loc.coordinates || '',
      image: loc.image || '',
      visible: loc.visible !== false,
      sort_order: loc.sort_order || 0
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setFormData((prev) => ({ ...prev, image: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let finalImage = formData.image;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      finalImage = file_url;
    }
    setUploading(false);
    const data = { ...formData, image: finalImage };
    if (editingLoc) {
      updateMutation.mutate({ id: editingLoc.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-teal-100 text-2xl font-semibold">Locations</h2>
          <p className="text-sm text-teal-200/70 mt-1">Manage the locations shown to users on the home page. Changes sync in real time.</p>
          {operatorFilter !== 'all' && <p className="text-xs text-teal-300 mt-0.5">Viewing as operator: <strong>{operatorFilter}</strong></p>}
        </div>
        <Button onClick={() => {setFormData(emptyForm);setDialogOpen(true);}} className="bg-purple-600 text-primary-foreground px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-9">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 &&
      <Card style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)' }}>
          <CardContent className="py-10 text-center">
            <MapPin className="h-10 w-10 mx-auto mb-2 text-teal-300" />
            <p className="font-medium text-teal-100">No locations yet.</p>
            <p className="text-sm mt-1 text-teal-200/70">Add locations to display them on the home page.</p>
          </CardContent>
        </Card>
      }

      <div className="grid md:grid-cols-2 gap-5">
        {locations.map((loc) =>
        <Card key={loc.id} className={`overflow-hidden transition-all ${!loc.visible ? 'opacity-60 border-dashed' : ''}`} style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)' }}>
            {loc.image &&
          <div className="relative h-40 overflow-hidden">
                <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <p className="font-bold text-lg leading-tight">{loc.name}</p>
                  {loc.state && <p className="text-white/80 text-sm">{loc.state}</p>}
                </div>
                {!loc.visible &&
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <EyeOff className="h-3 w-3" /> Hidden
                  </div>
            }
              </div>
          }
            <CardContent className="p-4 space-y-2">
              {!loc.image &&
            <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-teal-100">{loc.name}</h4>
                    {loc.state && <p className="text-xs text-teal-200/70">{loc.state}</p>}
                  </div>
                  {!loc.visible &&
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> Hidden
                    </span>
              }
                </div>
            }
              {loc.description && <p className="text-sm text-teal-200/60 line-clamp-2">{loc.description}</p>}
              {loc.coordinates &&
            <p className="text-xs text-teal-300/60 font-mono flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {loc.coordinates}
                </p>
            }
              <div className="flex gap-2 pt-1">
                <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => toggleVisibility(loc)}
                title={loc.visible ? 'Hide from home page' : 'Show on home page'}>

                  {loc.visible ? <Eye className="h-3.5 w-3.5 text-green-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(loc)} className="flex-1 h-8 text-xs">
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                variant="destructive"
                size="sm"
                className="h-8 px-2"
                onClick={() => {if (window.confirm(`Delete "${loc.name}"?`)) deleteMutation.mutate(loc.id);}}>

                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {if (!open) resetForm();setDialogOpen(open);}}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLoc ? 'Edit Location' : 'Add New Location'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Ixtapa-Zihuatanejo" />
              </div>
              <div>
                <Label>Location ID *</Label>
                <Input required value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })} placeholder="e.g. ixtapa_zihuatanejo" />
              </div>
              <div>
                <Label>State / Region</Label>
                <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="e.g. Guerrero" />
              </div>
              <div>
                <Label>Coordinates</Label>
                <Input value={formData.coordinates} onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })} placeholder="17.66°N, 101.55°W" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Short description shown on the location card..." />
            </div>

            <div>
              <Label className="mb-2 block">Card Image</Label>
              {formData.image &&
              <div className="relative mb-2">
                  <img src={formData.image} alt="Preview" className="w-full h-36 object-cover rounded-lg border" />
                  <button type="button" onClick={() => {setFormData((prev) => ({ ...prev, image: '' }));setImageFile(null);}} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              }
              <label className="flex items-center gap-2 cursor-pointer text-sm border border-slate-300 rounded px-3 py-2 hover:bg-slate-50 text-slate-600 mb-2">
                <Upload className="h-4 w-4" /> Upload image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
              </label>
              <Input placeholder="or paste image URL..." value={!imageFile ? formData.image || '' : ''} onChange={(e) => {setImageFile(null);setFormData((prev) => ({ ...prev, image: e.target.value }));}} className="text-sm" />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="visible" checked={formData.visible} onChange={(e) => setFormData({ ...formData, visible: e.target.checked })} className="h-4 w-4 rounded" />
              <Label htmlFor="visible" className="cursor-pointer">Visible on home page</Label>
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} placeholder="0" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading} className="flex-1">
                {uploading ? 'Uploading...' : editingLoc ? 'Save Changes' : 'Create Location'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>);

}