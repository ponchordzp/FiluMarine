import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Ship, Check, X, Gauge, Package, ChevronDown, ChevronUp, Calendar, Wrench } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";

const expeditionTypes = [
  'half_day_fishing',
  'full_day_fishing',
  'extended_fishing',
  'snorkeling',
  'coastal_leisure'
];

const commonSupplies = [
  { name: 'Bottom Paint', category: 'Paint' },
  { name: 'Boat Soap', category: 'Cleaning' },
  { name: 'Wax/Polish', category: 'Cleaning' },
  { name: 'Oil Filter', category: 'Engine' },
  { name: 'Fuel Filter', category: 'Engine' },
  { name: 'Spark Plugs', category: 'Engine' },
  { name: 'Engine Oil', category: 'Engine' },
  { name: 'Life Jackets', category: 'Safety' },
  { name: 'Fire Extinguisher', category: 'Safety' },
  { name: 'First Aid Kit', category: 'Safety' },
  { name: 'Flares', category: 'Safety' },
  { name: 'Anchor Line', category: 'Materials' },
  { name: 'Fenders', category: 'Materials' },
  { name: 'Dock Lines', category: 'Materials' },
];

export default function BoatManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState(null);
  const [expandedBoats, setExpandedBoats] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    size: '',
    description: '',
    image: '',
    capacity: '',
    location: 'ixtapa_zihuatanejo',
    dock_location: '',
    available_expeditions: [],
    expedition_pricing: [],
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
    engine_config: '',
    engine_name: '',
    engine_quantity: 1,
    current_hours: 0,
    maintenance_interval_hours: 100,
    last_maintenance_hours: 0,
    next_service_type: 'minor',
    minor_maintenance_cost: 0,
    major_maintenance_cost: 0,
    mechanic_name: '',
    mechanic_phone: '',
    mechanic_email: '',
    owner_phone: '',
    maintenance_schedule: '',
    last_service_date: '',
    last_service_mechanic_phone: '',
    supplies_inventory: [],
    status: 'active'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newSupply, setNewSupply] = useState({ name: '', category: '', quantity: 1, status: 'in_stock', notes: '' });
  
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
      return sum + (e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0);
    }, 0);
    const netProfit = totalRevenue - totalExpenses;
    const roi = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : 0;
    const expeditionCounts = {};
    boatBookings.forEach(b => {
      const exp = b.experience_type || 'unknown';
      expeditionCounts[exp] = (expeditionCounts[exp] || 0) + 1;
    });
    const frequentTrip = Object.entries(expeditionCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Get last completed trip
    const lastTrip = pastBookings
      .filter(b => b.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
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
      frequentTripCount: frequentTrip ? frequentTrip[1] : 0,
      lastTrip: lastTrip
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
      dock_location: '',
      available_expeditions: [],
      expedition_pricing: [],
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
      engine_config: '',
      engine_name: '',
      engine_quantity: 1,
      current_hours: 0,
      maintenance_interval_hours: 100,
      last_maintenance_hours: 0,
      next_service_type: 'minor',
      minor_maintenance_cost: 0,
      major_maintenance_cost: 0,
      mechanic_name: '',
      mechanic_phone: '',
      mechanic_email: '',
      owner_phone: '',
      maintenance_schedule: '',
      last_service_date: '',
      last_service_mechanic_phone: '',
      supplies_inventory: [],
      status: 'active'
    });
    setImageFile(null);
    setImagePreview('');
    setNewSupply({ name: '', category: '', quantity: 1, status: 'in_stock', notes: '' });
    setEditingBoat(null);
    setDialogOpen(false);
  };

  const handleEdit = (boat) => {
    setEditingBoat(boat);
    setFormData({
      ...boat,
      dock_location: boat.dock_location || '',
      expedition_pricing: boat.expedition_pricing || [],
      next_service_type: boat.next_service_type || 'minor',
      mechanic_name: boat.mechanic_name || '',
      mechanic_phone: boat.mechanic_phone || '',
      mechanic_email: boat.mechanic_email || '',
      owner_phone: boat.owner_phone || '',
      last_service_date: boat.last_service_date || '',
      last_service_mechanic_phone: boat.last_service_mechanic_phone || '',
      supplies_inventory: boat.supplies_inventory || [],
    });
    setImagePreview(boat.image || '');
    setDialogOpen(true);
  };

  const handleImageChange = async (e) => {
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
    if (editingBoat) {
      await updateMutation.mutateAsync({ id: editingBoat.id, data: finalData });
    } else {
      await createMutation.mutateAsync(finalData);
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

  const updateExpeditionPrice = (expType, field, value) => {
    setFormData(prev => {
      const existing = prev.expedition_pricing.find(e => e.expedition_type === expType);
      if (existing) {
        return {
          ...prev,
          expedition_pricing: prev.expedition_pricing.map(e => 
            e.expedition_type === expType ? { ...e, [field]: parseFloat(value) || 0 } : e
          )
        };
      } else {
        return {
          ...prev,
          expedition_pricing: [...prev.expedition_pricing, { 
            expedition_type: expType, 
            duration_hours: field === 'duration_hours' ? parseFloat(value) || 0 : 0,
            price_mxn: field === 'price_mxn' ? parseFloat(value) || 0 : 0
          }]
        };
      }
    });
  };

  const addSupply = () => {
    if (!newSupply.name) return;
    setFormData(prev => ({
      ...prev,
      supplies_inventory: [...prev.supplies_inventory, { ...newSupply, id: Date.now() }]
    }));
    setNewSupply({ name: '', category: '', quantity: 1, status: 'in_stock', notes: '' });
  };

  const addCommonSupply = (supply) => {
    setFormData(prev => ({
      ...prev,
      supplies_inventory: [...prev.supplies_inventory, { ...supply, quantity: 1, status: 'in_stock', notes: '', id: Date.now() }]
    }));
  };

  const removeSupply = (index) => {
    setFormData(prev => ({
      ...prev,
      supplies_inventory: prev.supplies_inventory.filter((_, i) => i !== index)
    }));
  };

  const updateSupplyStatus = (index, status) => {
    setFormData(prev => ({
      ...prev,
      supplies_inventory: prev.supplies_inventory.map((item, i) => 
        i === index ? { ...item, status } : item
      )
    }));
  };

  const updateSupplyQuantity = (index, quantity) => {
    setFormData(prev => ({
      ...prev,
      supplies_inventory: prev.supplies_inventory.map((item, i) => 
        i === index ? { ...item, quantity: parseInt(quantity) || 0 } : item
      )
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
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                  <Label>Dock Location</Label>
                  <Input
                    value={formData.dock_location}
                    onChange={(e) => setFormData({ ...formData, dock_location: e.target.value })}
                    placeholder="e.g., Marina Paradise, Dry Dock 3"
                  />
                  <p className="text-xs text-slate-500 mt-1">⚓ Where the boat is currently docked</p>
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

              {/* Image Upload */}
              <div>
                <Label>Boat Image</Label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-slate-500">Upload a high-quality image of the boat</p>
                </div>
              </div>

              {/* Available Expeditions & Pricing */}
              <div className="border-t pt-6">
                <Label className="mb-3 block text-lg font-semibold">Available Expeditions & Pricing</Label>
                <p className="text-sm text-slate-600 mb-4">Select available expeditions and set pricing for each</p>
                <div className="space-y-3">
                  {expeditionTypes.map(exp => {
                    const isSelected = formData.available_expeditions.includes(exp);
                    const pricing = formData.expedition_pricing.find(p => p.expedition_type === exp);
                    
                    return (
                      <div key={exp} className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'
                      }`}>
                        <button
                          type="button"
                          onClick={() => toggleExpedition(exp)}
                          className="w-full flex items-center gap-3 mb-3"
                        >
                          {isSelected ? (
                            <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-slate-400 flex-shrink-0" />
                          )}
                          <span className="text-sm font-semibold capitalize text-left">{exp.replace(/_/g, ' ')}</span>
                        </button>
                        
                        {isSelected && (
                          <div className="grid grid-cols-2 gap-3 mt-3 pl-8">
                            <div>
                              <Label className="text-xs">Duration (hours)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={pricing?.duration_hours || ''}
                                onChange={(e) => updateExpeditionPrice(exp, 'duration_hours', e.target.value)}
                                placeholder="e.g., 4"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Price (MXN)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={pricing?.price_mxn || ''}
                                onChange={(e) => updateExpeditionPrice(exp, 'price_mxn', e.target.value)}
                                placeholder="e.g., 8000"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                      className={`p-2 rounded-lg border text-xs transition-colors capitalize ${
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

              {/* Engine Configuration */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Engine Configuration</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Engine Type</Label>
                    <Select value={formData.engine_config} onValueChange={(value) => setFormData({ ...formData, engine_config: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inboard">Inboard</SelectItem>
                        <SelectItem value="outboard">Outboard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Number of Engines</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.engine_quantity}
                      onChange={(e) => setFormData({ ...formData, engine_quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Engine Details</Label>
                    <Input
                      value={formData.engine_name}
                      onChange={(e) => setFormData({ ...formData, engine_name: e.target.value })}
                      placeholder="e.g., Twin 2017 Yamaha 250"
                    />
                  </div>
                </div>
              </div>

              {/* Engine Hours & Maintenance */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Engine Hours & Maintenance Tracking</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Current Hours</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.current_hours}
                      onChange={(e) => setFormData({ ...formData, current_hours: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Maintenance Interval (hours)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.maintenance_interval_hours}
                      onChange={(e) => setFormData({ ...formData, maintenance_interval_hours: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                  <div>
                    <Label>Hours at Last Maintenance</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.last_maintenance_hours}
                      onChange={(e) => setFormData({ ...formData, last_maintenance_hours: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Live Hours Calculation */}
                {formData.current_hours > 0 && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-500">Hours Since Last Service</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {formData.current_hours - formData.last_maintenance_hours}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Hours Until Next Service</p>
                        <p className={`text-2xl font-bold ${
                          (formData.last_maintenance_hours + formData.maintenance_interval_hours - formData.current_hours) <= 10 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {Math.max(0, formData.last_maintenance_hours + formData.maintenance_interval_hours - formData.current_hours)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Next Service At</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formData.last_maintenance_hours + formData.maintenance_interval_hours} hrs
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Last Service Info */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Last Service Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Last Service Date</Label>
                    <Input
                      type="date"
                      value={formData.last_service_date}
                      onChange={(e) => setFormData({ ...formData, last_service_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Mechanic Phone (Last Service)</Label>
                    <Input
                      type="tel"
                      value={formData.last_service_mechanic_phone}
                      onChange={(e) => setFormData({ ...formData, last_service_mechanic_phone: e.target.value })}
                      placeholder="e.g., +52 755 123 4567"
                    />
                    <p className="text-xs text-slate-500 mt-1">Phone number of mechanic who performed last service</p>
                  </div>
                </div>
              </div>

              {/* Maintenance Costs */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Maintenance Costs (MXN)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Minor Maintenance Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.minor_maintenance_cost}
                      onChange={(e) => setFormData({ ...formData, minor_maintenance_cost: parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 5000"
                    />
                    <p className="text-xs text-slate-500 mt-1">Oil change, filters, basic service</p>
                  </div>
                  <div>
                    <Label>Major Maintenance Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.major_maintenance_cost}
                      onChange={(e) => setFormData({ ...formData, major_maintenance_cost: parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 25000"
                    />
                    <p className="text-xs text-slate-500 mt-1">Engine rebuild, major repairs</p>
                  </div>
                </div>
              </div>

              {/* Mechanic Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-slate-600" />
                  Mechanic Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Mechanic Name</Label>
                    <Input
                      value={formData.mechanic_name}
                      onChange={(e) => setFormData({ ...formData, mechanic_name: e.target.value })}
                      placeholder="e.g., Juan Pérez"
                    />
                  </div>
                  <div>
                    <Label>Mechanic Phone</Label>
                    <Input
                      type="tel"
                      value={formData.mechanic_phone}
                      onChange={(e) => setFormData({ ...formData, mechanic_phone: e.target.value })}
                      placeholder="e.g., +52 755 123 4567"
                    />
                  </div>
                  <div>
                    <Label>Mechanic Email</Label>
                    <Input
                      type="email"
                      value={formData.mechanic_email}
                      onChange={(e) => setFormData({ ...formData, mechanic_email: e.target.value })}
                      placeholder="e.g., mechanic@example.com"
                    />
                  </div>
                  <div>
                    <Label>Owner Phone (for notifications)</Label>
                    <Input
                      type="tel"
                      value={formData.owner_phone}
                      onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                      placeholder="e.g., +52 755 987 6543"
                    />
                    <p className="text-xs text-slate-500 mt-1">Receive maintenance quotes and updates</p>
                  </div>
                </div>
              </div>

              {/* Supplies Inventory */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Supplies Inventory
                </h3>
                <p className="text-sm text-slate-600 mb-4">Track all materials and supplies needed to keep your boat in optimal condition</p>
                
                {/* Quick Add Common Supplies */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-sm text-blue-900 mb-3">Quick Add Common Supplies</p>
                  <div className="flex flex-wrap gap-2">
                    {commonSupplies.filter(cs => !formData.supplies_inventory.some(s => s.name === cs.name)).map((supply, i) => (
                      <Button
                        key={i}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCommonSupply(supply)}
                        className="text-xs bg-white hover:bg-blue-100 border-blue-300"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {supply.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Current Supplies List */}
                {formData.supplies_inventory.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {formData.supplies_inventory.map((supply, index) => (
                      <div key={index} className={`p-3 rounded-lg border-2 transition-all ${
                        supply.status === 'in_stock' 
                          ? 'bg-emerald-50 border-emerald-300' 
                          : 'bg-red-50 border-red-300'
                      }`}>
                        <div className="flex items-start gap-3">
                          <Package className={`h-4 w-4 mt-1 flex-shrink-0 ${
                            supply.status === 'in_stock' ? 'text-emerald-600' : 'text-red-600'
                          }`} />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-slate-800">{supply.name}</p>
                                {supply.category && (
                                  <span className="text-xs bg-white px-2 py-1 rounded inline-block mt-1">
                                    {supply.category}
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSupply(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateSupplyStatus(index, 'in_stock')}
                                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                                    supply.status === 'in_stock'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  In Stock
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateSupplyStatus(index, 'needed')}
                                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                                    supply.status === 'needed'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-white border border-red-300 text-red-700 hover:bg-red-50'
                                  }`}
                                >
                                  Needed
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-slate-600">Qty:</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={supply.quantity || 0}
                                  onChange={(e) => updateSupplyQuantity(index, e.target.value)}
                                  className="w-20 h-7 text-sm"
                                />
                              </div>
                            </div>
                            
                            {supply.notes && (
                              <p className="text-xs text-slate-600 bg-white p-2 rounded">{supply.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Custom Supply Form */}
                <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                  <p className="font-semibold text-sm text-slate-700">Add Custom Supply</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Supply Name *</Label>
                      <Input
                        value={newSupply.name}
                        onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                        placeholder="e.g., Custom Part"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Select value={newSupply.category} onValueChange={(value) => setNewSupply({ ...newSupply, category: value })}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cleaning">Cleaning</SelectItem>
                          <SelectItem value="Paint">Paint</SelectItem>
                          <SelectItem value="Engine">Engine</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Safety">Safety</SelectItem>
                          <SelectItem value="Materials">Materials</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newSupply.quantity}
                        onChange={(e) => setNewSupply({ ...newSupply, quantity: parseInt(e.target.value) || 1 })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Notes (optional)</Label>
                      <Input
                        value={newSupply.notes}
                        onChange={(e) => setNewSupply({ ...newSupply, notes: e.target.value })}
                        placeholder="Additional info"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addSupply}
                    disabled={!newSupply.name}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Supply
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
                  {uploading ? 'Uploading Image...' : editingBoat ? 'Update Boat' : 'Create Boat'}
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
        {boats.filter(boat => boat.image).map((boat) => {
          const stats = getBoatStats(boat.name);
          const needsMaintenance = boat.status === 'maintenance' || stats.completed > 20;
          const isExpanded = expandedBoats[boat.id];
          
          return (
          <Card key={boat.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative">
              <img src={boat.image} alt={boat.name} className="w-full h-full object-cover" />
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

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedBoats(prev => ({ ...prev, [boat.id]: !prev[boat.id] }))}
                className="w-full mb-4"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More Details
                  </>
                )}
              </Button>

              {isExpanded && boat.equipment && Object.values(boat.equipment).some(v => v) && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Equipment</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(boat.equipment).filter(([_, v]) => v).map(([key]) => (
                      <span key={key} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isExpanded && boat.available_expeditions && boat.available_expeditions.length > 0 && (
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

              {/* Engine Hours Tracking */}
              {isExpanded && boat.current_hours > 0 && (
                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Engine Hours
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Current Hours</p>
                      <p className="font-bold text-lg">{boat.current_hours}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Since Service</p>
                      <p className="font-bold text-lg">{boat.current_hours - (boat.last_maintenance_hours || 0)}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      ((boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100) - boat.current_hours) <= 10
                        ? 'bg-red-50'
                        : 'bg-green-50'
                    }`}>
                      <p className="text-xs text-slate-500">Until Service</p>
                      <p className={`font-bold text-lg ${
                        ((boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100) - boat.current_hours) <= 10
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {Math.max(0, (boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100) - boat.current_hours)}
                      </p>
                    </div>
                  </div>
                  {boat.engine_name && (
                    <p className="text-xs text-slate-600">
                      <strong>Engine:</strong> {boat.engine_name}
                    </p>
                  )}
                  {(boat.minor_maintenance_cost > 0 || boat.major_maintenance_cost > 0) && (
                    <div className="text-xs text-slate-600 space-y-1">
                      {boat.minor_maintenance_cost > 0 && (
                        <p><strong>Minor Service:</strong> ${boat.minor_maintenance_cost.toLocaleString()} MXN</p>
                      )}
                      {boat.major_maintenance_cost > 0 && (
                        <p><strong>Major Service:</strong> ${boat.major_maintenance_cost.toLocaleString()} MXN</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Booking Statistics */}
              {isExpanded && (<div className="pt-4 border-t space-y-2">
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
                {stats.lastTrip && (
                  <div className="pt-3 border-t">
                    <p className="text-slate-500 text-xs mb-2">Last Completed Trip</p>
                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                      <p className="font-medium capitalize">{stats.lastTrip.experience_type?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-600">
                        {format(parseISO(stats.lastTrip.date), 'MMM d, yyyy')} • {stats.lastTrip.guests} guests
                      </p>
                    </div>
                  </div>
                )}
                {boat.last_service_date && (
                  <div className="pt-2">
                    <p className="text-slate-500 text-xs mb-1">Last Service</p>
                    <div className="bg-blue-50 p-2 rounded text-xs">
                      <p className="font-medium">{format(parseISO(boat.last_service_date), 'MMM d, yyyy')}</p>
                      {boat.last_service_mechanic_phone && (
                        <p className="text-slate-600 mt-1">Mechanic: {boat.last_service_mechanic_phone}</p>
                      )}
                    </div>
                  </div>
                )}
                {boat.mechanic_name && (
                  <div className="pt-2">
                    <p className="text-slate-500 text-xs mb-1">Mechanic</p>
                    <div className="bg-slate-50 p-2 rounded text-xs space-y-1">
                      <p className="font-medium">{boat.mechanic_name}</p>
                      {boat.mechanic_phone && <p className="text-slate-600">📞 {boat.mechanic_phone}</p>}
                      {boat.mechanic_email && <p className="text-slate-600">✉️ {boat.mechanic_email}</p>}
                    </div>
                  </div>
                )}
                {needsMaintenance && (
                  <div className="pt-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Action Needed: Schedule Maintenance
                    </Badge>
                  </div>
                )}
              </div>)}
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