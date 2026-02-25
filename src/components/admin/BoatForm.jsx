import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Check, X, Calendar, Wrench, Package, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { base44 } from '@/api/base44Client';
import PickupAndDeparture from './PickupAndDeparture';
import EquipmentManager from './EquipmentManager';

const expeditionTypes = [
  'half_day_fishing',
  'full_day_fishing',
  'extended_fishing',
  'snorkeling',
  'coastal_leisure',
  'sunset_tour'
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

export default function BoatForm({ formData, setFormData, onSubmit, onCancel, editingBoat, uploading }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(formData.image || '');
  const [newSupply, setNewSupply] = useState({ 
    name: '', category: '', quantity: 1, unit: '', price_per_unit: 0, 
    purchased_date: '', duration_months: 0, status: 'in_stock', notes: '' 
  });
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '', specialty: '' });
  const [newRecurringCost, setNewRecurringCost] = useState({ 
    name: '', amount: 0, frequency_months: 1, next_payment_date: '', category: 'other', notes: '' 
  });
  const [expeditionPickupDepartures, setExpeditionPickupDepartures] = useState({});
  const [newEquipment, setNewEquipment] = useState('');

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
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      finalData.image = file_url;
    }
    onSubmit(finalData);
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

  const addCustomEquipment = () => {
    if (!newEquipment.trim()) return;
    setFormData(prev => ({
      ...prev,
      custom_equipment: [...prev.custom_equipment, newEquipment.trim()]
    }));
    setNewEquipment('');
  };

  const removeCustomEquipment = (index) => {
    setFormData(prev => ({
      ...prev,
      custom_equipment: prev.custom_equipment.filter((_, i) => i !== index)
    }));
  };

  const updateExpeditionPrice = (expType, field, value) => {
    setFormData(prev => {
      const existing = prev.expedition_pricing.find(e => e.expedition_type === expType);
      if (existing) {
        return {
          ...prev,
          expedition_pricing: prev.expedition_pricing.map(e => 
            e.expedition_type === expType ? { ...e, [field]: field.includes('hours') || field.includes('mxn') ? (parseFloat(value) || 0) : value } : e
          )
        };
      } else {
        return {
          ...prev,
          expedition_pricing: [...prev.expedition_pricing, { 
            expedition_type: expType, 
            duration_hours: field === 'duration_hours' ? parseFloat(value) || 0 : 0,
            price_mxn: field === 'price_mxn' ? parseFloat(value) || 0 : 0,
            pickup_location: field === 'pickup_location' ? value : '',
            departure_time: field === 'departure_time' ? value : ''
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
    setNewSupply({ 
      name: '', category: '', quantity: 1, unit: '', price_per_unit: 0, 
      purchased_date: '', duration_months: 0, status: 'in_stock', notes: '' 
    });
  };

  const addCommonSupply = (supply) => {
    setFormData(prev => ({
      ...prev,
      supplies_inventory: [...prev.supplies_inventory, { 
        ...supply, quantity: 1, unit: '', price_per_unit: 0, purchased_date: '', 
        duration_months: 0, status: 'in_stock', notes: '', id: Date.now() 
      }]
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

  const updateSupplyField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      supplies_inventory: prev.supplies_inventory.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addRecurringCost = () => {
    if (!newRecurringCost.name) return;
    setFormData(prev => ({
      ...prev,
      recurring_costs: [...(prev.recurring_costs || []), { ...newRecurringCost, id: Date.now() }]
    }));
    setNewRecurringCost({ 
      name: '', amount: 0, frequency_months: 1, next_payment_date: '', category: 'other', notes: '' 
    });
  };

  const removeRecurringCost = (index) => {
    setFormData(prev => ({
      ...prev,
      recurring_costs: (prev.recurring_costs || []).filter((_, i) => i !== index)
    }));
  };

  const calculateSupplyTimeRemaining = (purchasedDate, durationMonths) => {
    if (!purchasedDate || !durationMonths) return null;
    const purchased = new Date(purchasedDate);
    const now = new Date();
    const expiryDate = new Date(purchased);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
    const totalDays = durationMonths * 30;
    const elapsedDays = Math.floor((now - purchased) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const percentageRemaining = Math.max(0, Math.min(100, (remainingDays / totalDays) * 100));
    return { remainingDays, percentageRemaining, expired: remainingDays === 0 };
  };

  const addSupplier = () => {
    if (!newSupplier.name) return;
    setFormData(prev => ({
      ...prev,
      supply_sellers: [...prev.supply_sellers, { ...newSupplier, id: Date.now() }]
    }));
    setNewSupplier({ name: '', phone: '', email: '', specialty: '' });
  };

  const removeSupplier = (index) => {
    setFormData(prev => ({
      ...prev,
      supply_sellers: prev.supply_sellers.filter((_, i) => i !== index)
    }));
  };

  return (
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
          <Label>Crew Members</Label>
          <Input
            type="number"
            min="0"
            value={formData.crew_members}
            onChange={(e) => setFormData({ ...formData, crew_members: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 2"
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

      {/* Price Per Additional Hour */}
      {formData.boat_mode === 'rental_and_maintenance' && (
      <div className="border-t pt-6">
      <Label>Price Per Additional Hour (MXN)</Label>
      <Input
      type="number"
      min="0"
      value={formData.price_per_additional_hour || 0}
      onChange={(e) => setFormData({ ...formData, price_per_additional_hour: parseFloat(e.target.value) || 0 })}
      placeholder="e.g., 2500"
      className="text-sm"
      />
      <p className="text-xs text-slate-500 mt-1">Cost for each additional hour beyond scheduled expedition duration</p>
      </div>
      )}

      {/* Available Expeditions & Pricing */}
      {formData.boat_mode === 'rental_and_maintenance' && (
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
                  <span className="text-sm font-semibold capitalize text-left">
                   {exp === 'extended_fishing' ? 'Full Day Expedition' : exp.replace(/_/g, ' ')}
                  </span>
                </button>
                
                {isSelected && (
                   <div className="space-y-4 mt-3 pl-8">
                     <div className="grid grid-cols-2 gap-3">
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
                     <div>
                       <Label className="text-xs font-semibold mb-2 block">Pickup Locations & Departure Times</Label>
                       <PickupAndDeparture 
                         pickupAndDepartures={expeditionPickupDepartures[exp] || []}
                         onUpdate={(items) => setExpeditionPickupDepartures({
                           ...expeditionPickupDepartures,
                           [exp]: items
                         })}
                         expeditionType={exp}
                         location={formData.location}
                       />
                     </div>
                   </div>
                 )}
              </div>
            );
            })}
            </div>
            </div>
            )}

            {/* Equipment */}
            {formData.boat_mode === 'rental_and_maintenance' && (
            <div className="border-t pt-6">
            <EquipmentManager 
              equipment={formData.equipment}
              customEquipment={formData.custom_equipment}
              onToggleEquipment={toggleEquipment}
              onAddCustom={addCustomEquipment}
              onRemoveCustom={removeCustomEquipment}
              newEquipment={newEquipment}
              onNewEquipmentChange={setNewEquipment}
            />
            </div>
            )}

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
          <div>
            <Label>Engine Year</Label>
            <Input
              type="number"
              min="1900"
              max="2100"
              value={formData.engine_year || ''}
              onChange={(e) => setFormData({ ...formData, engine_year: parseInt(e.target.value) || null })}
              placeholder="e.g., 2017"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Engine Details</Label>
            <Input
              value={formData.engine_name}
              onChange={(e) => setFormData({ ...formData, engine_name: e.target.value })}
              placeholder="e.g., Twin Yamaha 250"
            />
          </div>
        </div>
      </div>

      {/* Engine Hours & Maintenance */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Engine Hours & Maintenance Tracking</h3>
        <div className="grid md:grid-cols-3 gap-4">
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
          <div>
            <Label>Current Hours</Label>
            <Input
              type="number"
              min="0"
              value={formData.current_hours}
              onChange={(e) => setFormData({ ...formData, current_hours: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Enter the maintenance cost <strong>per engine</strong>. The total will be calculated based on the number of engines configured above.
          </p>
        </div>
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
        </div>
      </div>

      {/* Supplies Inventory - Simplified */}
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
          <div className="mb-4 space-y-2 max-h-[300px] overflow-y-auto">
            {formData.supplies_inventory.map((supply, index) => {
              const timeRemaining = supply.duration_months > 0 && supply.purchased_date 
                ? calculateSupplyTimeRemaining(supply.purchased_date, supply.duration_months) 
                : null;
              const totalCost = (supply.quantity || 0) * (supply.price_per_unit || 0);
              
              return (
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
                        <div className="flex gap-2 flex-wrap mt-1">
                          {supply.category && (
                            <span className="text-xs bg-white px-2 py-1 rounded">
                              {supply.category}
                            </span>
                          )}
                          {totalCost > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                              ${totalCost.toLocaleString()} MXN
                            </span>
                          )}
                        </div>
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
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs text-slate-600">Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          value={supply.quantity || 0}
                          onChange={(e) => updateSupplyQuantity(index, e.target.value)}
                          className="h-7 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Unit</Label>
                        <Input
                          value={supply.unit || ''}
                          onChange={(e) => updateSupplyField(index, 'unit', e.target.value)}
                          placeholder="gallons"
                          className="h-7 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Price/Unit</Label>
                        <Input
                          type="number"
                          min="0"
                          value={supply.price_per_unit || 0}
                          onChange={(e) => updateSupplyField(index, 'price_per_unit', parseFloat(e.target.value) || 0)}
                          className="h-7 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Duration (mo)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={supply.duration_months || 0}
                          onChange={(e) => updateSupplyField(index, 'duration_months', parseInt(e.target.value) || 0)}
                          className="h-7 text-sm"
                        />
                      </div>
                    </div>

                    {supply.duration_months > 0 && (
                      <div>
                        <Label className="text-xs text-slate-600">Purchased Date</Label>
                        <Input
                          type="date"
                          value={supply.purchased_date || ''}
                          onChange={(e) => updateSupplyField(index, 'purchased_date', e.target.value)}
                          className="h-7 text-sm"
                        />
                      </div>
                    )}

                    {supply.duration_months > 0 && (
                      <div className="space-y-1">
                        {timeRemaining ? (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className={timeRemaining.expired ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                                {timeRemaining.expired ? '⚠️ Needs Replacement' : `${timeRemaining.remainingDays} days remaining`}
                              </span>
                              <span className="text-slate-500">{timeRemaining.percentageRemaining.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  timeRemaining.percentageRemaining > 50 ? 'bg-green-500' :
                                  timeRemaining.percentageRemaining > 20 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${timeRemaining.percentageRemaining}%` }}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="bg-amber-50 border border-amber-300 rounded p-2">
                            <p className="text-xs text-amber-700">⚠️ Set purchase date to track duration</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
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
                    
                    {supply.notes && (
                      <p className="text-xs text-slate-600 bg-white p-2 rounded">{supply.notes}</p>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
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
                placeholder="e.g., Boat Soap"
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
              <Label className="text-xs">Unit</Label>
              <Input
                value={newSupply.unit}
                onChange={(e) => setNewSupply({ ...newSupply, unit: e.target.value })}
                placeholder="e.g., gallons, liters, units"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Price per Unit (MXN)</Label>
              <Input
                type="number"
                min="0"
                value={newSupply.price_per_unit}
                onChange={(e) => setNewSupply({ ...newSupply, price_per_unit: parseFloat(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Duration (months)</Label>
              <Input
                type="number"
                min="0"
                value={newSupply.duration_months}
                onChange={(e) => setNewSupply({ ...newSupply, duration_months: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 2"
                className="text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">How long this supply lasts</p>
            </div>
            {newSupply.duration_months > 0 && (
              <div>
                <Label className="text-xs">Purchased Date</Label>
                <Input
                  type="date"
                  value={newSupply.purchased_date}
                  onChange={(e) => setNewSupply({ ...newSupply, purchased_date: e.target.value })}
                  className="text-sm"
                />
              </div>
            )}
            <div className={newSupply.duration_months > 0 ? '' : 'md:col-span-2'}>
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

            {/* Supply Sellers */}
            <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            Supply Sellers
            </h3>

            {/* Current Suppliers List */}
            {formData.supply_sellers && formData.supply_sellers.length > 0 && (
            <div className="mb-4 space-y-2">
            {formData.supply_sellers.map((supplier, index) => (
              <div key={index} className="p-3 bg-emerald-50 rounded-lg border-2 border-emerald-300">
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 mt-1 flex-shrink-0 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{supplier.name}</p>
                        {supplier.specialty && (
                          <span className="text-xs bg-white px-2 py-1 rounded inline-block mt-1">
                            {supplier.specialty}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSupplier(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {supplier.phone && (
                      <p className="text-xs text-slate-600">📞 {supplier.phone}</p>
                    )}
                    {supplier.email && (
                      <p className="text-xs text-slate-600">✉️ {supplier.email}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
            )}

            {/* Add Supplier Form */}
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
            <p className="font-semibold text-sm text-slate-700">Add Supplier</p>
            <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Supplier Name *</Label>
              <Input
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                placeholder="e.g., Marine Parts Co."
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                type="tel"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                placeholder="e.g., +52 755 456 7890"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                placeholder="e.g., info@supplier.com"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Specialty</Label>
              <Input
                value={newSupplier.specialty}
                onChange={(e) => setNewSupplier({ ...newSupplier, specialty: e.target.value })}
                placeholder="e.g., Engine Parts"
                className="text-sm"
              />
            </div>
            </div>
            <Button
            type="button"
            onClick={addSupplier}
            disabled={!newSupplier.name}
            variant="outline"
            size="sm"
            className="w-full"
            >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
            </Button>
            </div>

            <div className="mt-4">
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

            {/* Recurring Costs */}
            <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Recurring Costs
            </h3>
            <p className="text-sm text-slate-600 mb-4">Track monthly/periodic payments like docking fees, insurance, crew salaries, etc.</p>
            
            {/* Current Recurring Costs */}
            {formData.recurring_costs && formData.recurring_costs.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.recurring_costs.map((cost, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg border-2 border-purple-300">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 mt-1 flex-shrink-0 text-purple-600" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-800">{cost.name}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className="text-xs bg-white px-2 py-1 rounded capitalize">
                                {cost.category}
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                                Every {cost.frequency_months} month{cost.frequency_months > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecurringCost(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-green-700 font-bold">${cost.amount.toLocaleString()} MXN</p>
                          {cost.next_payment_date && (
                            <p className="text-xs text-slate-600">
                              Next payment: {format(parseISO(cost.next_payment_date), 'MMM d, yyyy')}
                            </p>
                          )}
                          {cost.notes && (
                            <p className="text-xs text-slate-600 bg-white p-2 rounded mt-2">{cost.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Recurring Cost Form */}
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
              <p className="font-semibold text-sm text-slate-700">Add Recurring Cost</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Cost Name *</Label>
                  <Input
                    value={newRecurringCost.name}
                    onChange={(e) => setNewRecurringCost({ ...newRecurringCost, name: e.target.value })}
                    placeholder="e.g., Docking Fee"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Amount (MXN) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newRecurringCost.amount}
                    onChange={(e) => setNewRecurringCost({ ...newRecurringCost, amount: parseFloat(e.target.value) || 0 })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={newRecurringCost.category} onValueChange={(value) => setNewRecurringCost({ ...newRecurringCost, category: value })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docking">Docking</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="crew">Crew Salary</SelectItem>
                      <SelectItem value="permits">Permits & Licenses</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Frequency</Label>
                  <Select 
                    value={newRecurringCost.frequency_months.toString()} 
                    onValueChange={(value) => setNewRecurringCost({ ...newRecurringCost, frequency_months: parseInt(value) })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monthly</SelectItem>
                      <SelectItem value="3">Every 3 months</SelectItem>
                      <SelectItem value="6">Every 6 months</SelectItem>
                      <SelectItem value="9">Every 9 months</SelectItem>
                      <SelectItem value="12">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Next Payment Date</Label>
                  <Input
                    type="date"
                    value={newRecurringCost.next_payment_date}
                    onChange={(e) => setNewRecurringCost({ ...newRecurringCost, next_payment_date: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Notes (optional)</Label>
                  <Input
                    value={newRecurringCost.notes}
                    onChange={(e) => setNewRecurringCost({ ...newRecurringCost, notes: e.target.value })}
                    placeholder="Additional info"
                    className="text-sm"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={addRecurringCost}
                disabled={!newRecurringCost.name || !newRecurringCost.amount}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recurring Cost
              </Button>
            </div>
            </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={uploading}>
          {uploading ? 'Uploading Image...' : editingBoat ? 'Update Boat' : 'Create Boat'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}