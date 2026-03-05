import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, MapPin, Image as ImageIcon, X } from 'lucide-react';

export default function DestinationManagement({ operatorFilter = null, currentUserOperator = '' }) {
  const activeOperator = operatorFilter && operatorFilter !== 'all' ? operatorFilter : (currentUserOperator || null);

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDest, setEditingDest] = useState(null);
  const [formData, setFormData] = useState({
    destination_id: '',
    name: '',
    location: '',
    coordinates: '',
    summary: '',
    activities: [],
    images: ['', '', '', ''],
    region: 'ixtapa_zihuatanejo'
  });
  const [activityInput, setActivityInput] = useState('');

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: () => base44.entities.DestinationContent.list('-created_date')
  });

  const filteredDestinations = destinations.filter(dest => {
    if (!activeOperator) return true;
    return (dest.operator || '').toLowerCase() === activeOperator.toLowerCase();
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DestinationContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DestinationContent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DestinationContent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
    }
  });

  const resetForm = () => {
    setFormData({
      destination_id: '',
      name: '',
      location: '',
      coordinates: '',
      summary: '',
      activities: [],
      images: ['', '', '', ''],
      region: 'ixtapa_zihuatanejo'
    });
    setActivityInput('');
    setEditingDest(null);
    setDialogOpen(false);
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
      images: dest.images && dest.images.length === 4 ? dest.images : ['', '', '', ''],
      region: dest.region || 'ixtapa_zihuatanejo'
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDest) {
      updateMutation.mutate({ id: editingDest.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addActivity = () => {
    if (activityInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        activities: [...prev.activities, activityInput.trim()]
      }));
      setActivityInput('');
    }
  };

  const removeActivity = (index) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const updateImage = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-50 text-2xl font-semibold">Destination Content Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {resetForm();setDialogOpen(true);}} className="bg-violet-600 text-primary-foreground px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-9">
              <Plus className="h-4 w-4 mr-2" />
              Add Destination
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDest ? 'Edit Destination' : 'Add New Destination'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Destination ID * (URL-friendly)</Label>
                  <Input
                    required
                    value={formData.destination_id}
                    onChange={(e) => setFormData({ ...formData, destination_id: e.target.value })}
                    placeholder="e.g., playa-las-gatas" />

                </div>
                <div>
                  <Label>Name *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Playa Las Gatas" />

                </div>
                <div>
                  <Label>Location *</Label>
                  <Input
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Zihuatanejo, Guerrero, Mexico" />

                </div>
                <div>
                  <Label>Coordinates</Label>
                  <Input
                    value={formData.coordinates}
                    onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                    placeholder="e.g., 17.6294° N, 101.5589° W" />

                </div>
                <div>
                  <Label>Region *</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem>
                      <SelectItem value="acapulco">Acapulco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Summary</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={5}
                  placeholder="Detailed description of the destination..." />

              </div>

              {/* Activities */}
              <div>
                <Label className="mb-2 block">Activities</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    placeholder="Add an activity..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())} />

                  <Button type="button" onClick={addActivity}>Add</Button>
                </div>
                <div className="space-y-2">
                  {formData.activities.map((activity, index) =>
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <span className="flex-1 text-sm">{activity}</span>
                      <button
                      type="button"
                      onClick={() => removeActivity(index)}
                      className="text-red-600 hover:text-red-700">

                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Images */}
              <div>
                <Label className="mb-2 block">Images (4 required)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.images.map((img, index) =>
                  <div key={index}>
                      <Label className="text-xs">Image {index + 1}</Label>
                      <Input
                      value={img}
                      onChange={(e) => updateImage(index, e.target.value)}
                      placeholder="https://..." />

                      {img &&
                    <img src={img} alt={`Preview ${index + 1}`} className="mt-2 w-full h-24 object-cover rounded" />
                    }
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingDest ? 'Update Destination' : 'Create Destination'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Destination List */}
      <div className="grid md:grid-cols-2 gap-4">
        {destinations.map((dest) =>
        <Card key={dest.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {dest.images?.[0] &&
              <img
                src={dest.images[0]}
                alt={dest.name}
                className="w-24 h-24 object-cover rounded-lg" />

              }
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{dest.name}</h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {dest.location}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{dest.summary}</p>
                  <p className="text-xs text-slate-400 mb-2">
                    {dest.activities?.length || 0} activities • {dest.images?.length || 0} images
                  </p>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(dest)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Delete ${dest.name}?`)) {
                        deleteMutation.mutate(dest.id);
                      }
                    }}>

                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>);

}