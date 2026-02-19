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
import { Plus, Edit, Trash2, Ship, Check, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const expeditionTypes = [
  'half_day_fishing',
  'full_day_fishing',
  'extended_fishing',
  'snorkeling',
  'coastal_leisure'
];

export default function BoatManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedBoatStats, setSelectedBoatStats] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    size: '',
    description: '',
    image: '',
    capacity: '',
    location: 'ixtapa_zihuatanejo',
    available_expeditions: [],
    equipment: {
      bathroom: false,
      live_well: false,
      starlink: false,
      cctv: false,
      audio_system: false,
      gps: false,
      fishing_gear: false,
      snorkeling_gear: false,
    },
    maintenance_schedule: '',
    parts_inventory: '',
    status: 'active'
  });

  const { data: boats = [] } = useQuery({
    queryKey: ['boats'],
    queryFn: () => base44.entities.BoatInventory.list('-created_date'),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-stats'],
    queryFn: () => base44.entities.Booking.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-stats'],
    queryFn: () => base44.entities.BookingExpense.list(),
  });

  const getBoatStats = (boatName) => {
    const boatBookings = bookings.filter(b => b.boat_name === boatName && b.status !== 'cancelled');
    const today = new Date();
    
    const futureBookings = boatBookings.filter(b => new Date(b.date) >= today);
    const pastBookings = boatBookings.filter(b => new Date(b.date) < today);
    const completedBookings = boatBookings.filter(b => b.status === 'completed');
    
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    
    const bookingIds = completedBookings.map(b => b.id);
    const boatExpenses = expenses.filter(e => bookingIds.includes(e.booking_id));
    const totalExpenses = boatExpenses.reduce((sum, e) => {
      return sum + (e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + 
             (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0);
    }, 0);
    
    const netProfit = totalRevenue - totalExpenses;
    const roi = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : 0;
    
    const expeditionCounts = {};
    boatBookings.forEach(b => {
      const exp = b.experience_type || 'unknown';
      expeditionCounts[exp] = (expeditionCounts[exp] || 0) + 1;
    });
    const frequentTrip = Object.entries(expeditionCounts).sort((a, b) => b[1] - a[1])[0];
    
    return {
      total: boatBookings.length,
      future: futureBookings.length,
      past: pastBookings.length,
      completed: completedBookings.length,
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: netProfit,
      roi: roi,
      frequentTrip: frequentTrip ? frequentTrip[0].replace(/_/g, ' ') : 'N/A',
      frequentTripCount: frequentTrip ? frequentTrip[1] : 0
    };
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BoatInventory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BoatInventory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BoatInventory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      size: '',
      description: '',
      image: '',
      capacity: '',
      location: 'ixtapa_zihuatanejo',
      available_expeditions: [],
      equipment: {
        bathroom: false,
        live_well: false,
        starlink: false,
        cctv: false,
        audio_system: false,
        gps: false,
        fishing_gear: false,
        snorkeling_gear: false,
      },
      maintenance_schedule: '',
      parts_inventory: '',
      status: 'active'
    });
    setEditingBoat(null);
    setDialogOpen(false);
  };

  const handleEdit = (boat) => {
    setEditingBoat(boat);
    setFormData({
      name: boat.name || '',
      type: boat.type || '',
      size: boat.size || '',
      description: boat.description || '',
      image: boat.image || '',
      capacity: boat.capacity || '',
      location: boat.location || 'ixtapa_zihuatanejo',
      available_expeditions: boat.available_expeditions || [],
      equipment: boat.equipment || {
        bathroom: false,
        live_well: false,
        starlink: false,
        cctv: false,
        audio_system: false,
        gps: false,
        fishing_gear: false,
        snorkeling_gear: false,
      },
      maintenance_schedule: boat.maintenance_schedule || '',
      parts_inventory: boat.parts_inventory || '',
      status: boat.status || 'active'
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBoat) {
      updateMutation.mutate({ id: editingBoat.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleExpedition = (expedition) => {
    setFormData(prev => ({
      ...prev,
      available_expeditions: prev.available_expeditions.includes(expedition)
        ? prev.available_expeditions.filter(e => e !== expedition)
        : [...prev.available_expeditions, expedition]
    }));
  };

  const toggleEquipment = (equipment) => {
    setFormData(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [equipment]: !prev.equipment[equipment]
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Boat Inventory Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Boat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBoat ? 'Edit Boat' : 'Add New Boat'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Boat Name *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Type *</Label>
                  <Input
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g., Center Console, Yacht"
                  />
                </div>
                <div>
                  <Label>Size *</Label>
                  <Input
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., 25ft"
                  />
                </div>
                <div>
                  <Label>Capacity *</Label>
                  <Input
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g., Up to 6 guests"
                  />
                </div>
                <div>
                  <Label>Location *</Label>
                  <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem>
                      <SelectItem value="acapulco">Acapulco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Image URL</Label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {/* Available Expeditions */}
              <div>
                <Label className="mb-3 block">Available Expeditions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {expeditionTypes.map(exp => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => toggleExpedition(exp)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        formData.available_expeditions.includes(exp)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {formData.available_expeditions.includes(exp) ? (
                          <Check className="h-4 w-4 text-blue-600" />
                        ) : (
                          <X className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-sm">{exp.replace(/_/g, ' ')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <Label className="mb-3 block">Equipment</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.keys(formData.equipment).map(eq => (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipment(eq)}
                      className={`p-2 rounded-lg border text-xs transition-colors ${
                        formData.equipment[eq]
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {eq.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Maintenance */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Maintenance Schedule</Label>
                  <Input
                    value={formData.maintenance_schedule}
                    onChange={(e) => setFormData({ ...formData, maintenance_schedule: e.target.value })}
                    placeholder="e.g., Next service: 2026-03-15"
                  />
                </div>
                <div>
                  <Label>Parts Inventory</Label>
                  <Input
                    value={formData.parts_inventory}
                    onChange={(e) => setFormData({ ...formData, parts_inventory: e.target.value })}
                    placeholder="e.g., Oil filters x2, spark plugs"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingBoat ? 'Update Boat' : 'Create Boat'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Boat List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boats.map((boat) => {
          const stats = getBoatStats(boat.name);
          const needsMaintenance = boat.status === 'maintenance' || stats.completed > 20;
          
          return (
          <Card key={boat.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative">
              {boat.image ? (
                <img src={boat.image} alt={boat.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  <Ship className="h-12 w-12 text-slate-400" />
                </div>
              )}
              <Badge className="absolute top-2 right-2 bg-white/90 text-slate-800">
                {boat.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}
              </Badge>
              {needsMaintenance && (
                <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
                  Maintenance Due
                </Badge>
              )}
            </div>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{boat.name}</h3>
                    <p className="text-sm text-slate-600">{boat.type} • {boat.size}</p>
                  </div>
                  <Badge className={
                    boat.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    boat.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }>
                    {boat.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 mb-2">{boat.capacity}</p>
                {boat.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{boat.description}</p>
                )}
              </div>

              {boat.equipment && Object.values(boat.equipment).some(v => v) && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Equipment</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(boat.equipment).filter(([_, v]) => v).map(([key]) => (
                      <span key={key} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                        {key.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {boat.available_expeditions && boat.available_expeditions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Available Expeditions</h4>
                  <div className="flex flex-wrap gap-1">
                    {boat.available_expeditions.map((exp) => (
                      <span key={exp} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {exp.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Statistics */}
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-semibold text-sm text-slate-700 mb-3">Booking Statistics</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">Total Bookings</p>
                    <p className="font-semibold text-lg">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Future / Past</p>
                    <p className="font-semibold text-lg">{stats.future} / {stats.past}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Revenue (MXN)</p>
                    <p className="font-semibold text-lg text-green-600">${(stats.revenue / 1000).toFixed(1)}k</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Avg ROI</p>
                    <p className="font-semibold text-lg text-blue-600">{stats.roi}%</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-slate-500 text-xs">Most Frequent Trip</p>
                  <p className="font-medium text-sm capitalize">{stats.frequentTrip} ({stats.frequentTripCount}x)</p>
                </div>
                {needsMaintenance && (
                  <div className="pt-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Action Needed: Schedule Maintenance
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="flex gap-2 p-4 pt-0">
              <Button variant="outline" size="sm" onClick={() => handleEdit(boat)} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Delete ${boat.name}? This cannot be undone.`)) {
                    deleteMutation.mutate(boat.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
          );
        })}
      </div>
    </div>
  );
}