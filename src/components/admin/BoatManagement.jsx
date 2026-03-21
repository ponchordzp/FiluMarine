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
import { Plus, Edit, Trash2, Check, X, Gauge, Package, ChevronDown, ChevronUp, Calendar, Wrench, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import PersonalTripDialog from './PersonalTripDialog';
import TripHistoryCard from './TripHistoryCard';
import PickupAndDeparture from './PickupAndDeparture';
import EquipmentManager from './EquipmentManager';
import SuppliesManager from './SuppliesManager';
import MaintenanceChecklist from './MaintenanceChecklist';
import MaintenanceAlerts from './MaintenanceAlerts';
import MaintenanceLogView from './MaintenanceLogView';
import CustomFieldsManager from './CustomFieldsManager';
import { useSectionLocks, SectionLockButton, InfoLabel, TimestampButton } from './SectionLock';

const expeditionTypes = [
'half_day_fishing',
'full_day_fishing',
'extended_fishing',
'snorkeling',
'coastal_leisure',
'sunset_tour'];


const OPERATOR_STORAGE_KEY = 'filu_operators';
function loadOperatorNames() {
  try {
    const raw = localStorage.getItem(OPERATOR_STORAGE_KEY);
    if (raw) return JSON.parse(raw).map(o => o.name).filter(Boolean);
  } catch {}
  return ['FILU'];
}

export default function BoatManagement({ restrictToBoat = null, readOnlyMode = false, isSuperAdmin = false, defaultOperator = '', showAddBoatOnly = false, operatorFilter = 'all' }) {
  const queryClient = useQueryClient();
  const operatorNames = loadOperatorNames();
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
    operator: defaultOperator || '',
    crew_members: 0,
    boat_mode: 'rental_and_maintenance',
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
      wifi: false,
      air_conditioning: false,
      refrigerator: false,
      ice_maker: false,
      shower: false,
      bimini_top: false,
      anchor: false
    },
    equipment_visibility: {},
    custom_equipment: [],
    custom_equipment_visibility: [],
    engine_config: '',
    engine_name: '',
    engine_quantity: 1,
    engine_year: null,
    current_hours: 0,
    maintenance_interval_hours: 100,
    last_maintenance_hours: 0,
    next_service_type: 'minor',
    minor_maintenance_cost: 0,
    major_maintenance_cost: 0,
    mechanic_name: '',
    mechanic_phone: '',
    mechanic_email: '',
    supply_sellers: [],
    owner_phone: '',
    maintenance_schedule: '',
    last_service_date: '',
    last_service_mechanic_phone: '',
    supplies_inventory: [],
    recurring_costs: [],
    price_per_additional_hour: 0,
    status: 'active',
    maintenance_checklist: {},
    custom_fields_general: [],
    custom_fields_maintenance: []
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '', specialty: '' });
  const [newRecurringCost, setNewRecurringCost] = useState({
    name: '', amount: 0, frequency_months: 1, next_payment_date: '', category: 'other', notes: ''
  });
  const [personalTripDialogOpen, setPersonalTripDialogOpen] = useState(false);
  const [selectedBoatForTrips, setSelectedBoatForTrips] = useState(null);
  const [expeditionPickupDepartures, setExpeditionPickupDepartures] = useState({});
  const [newEquipment, setNewEquipment] = useState('');
  const [tripHistoryFilter, setTripHistoryFilter] = useState('all');
  const [tripHistoryExpanded, setTripHistoryExpanded] = useState({});
  const [engineHoursExpanded, setEngineHoursExpanded] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const dialogContentRef = React.useRef(null);

  const toggleSection = (key) => setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const { locks, toggle: toggleLock } = useSectionLocks(['general', 'expeditions', 'equipment', 'engine', 'checklist', 'maintenance', 'supplies', 'sellers', 'recurring']);
  const [newCustomMaintenanceComponent, setNewCustomMaintenanceComponent] = useState({ name: '', interval: '', notes: '' });
  const [showCustomMaintenanceForm, setShowCustomMaintenanceForm] = useState(false);

  const isGeneralComplete = !!(formData.name && formData.type && formData.size && formData.capacity && formData.location);
  const isEngineComplete = !!(formData.engine_config && formData.engine_name && formData.engine_quantity);
  const isMaintenanceComplete = !!(formData.last_service_date && formData.mechanic_name && formData.mechanic_phone);
  const isExpeditionsComplete = formData.available_expeditions?.length > 0;
  const isSellersComplete = !!(formData.owner_phone);
  const isEquipmentComplete = Object.values(formData.equipment || {}).some(Boolean) || (formData.custom_equipment || []).length > 0;
  const isSuppliesComplete = (formData.supplies_inventory || []).length > 0;
  const isRecurringComplete = (formData.recurring_costs || []).length > 0;
  const isChecklistComplete = Object.keys(formData.maintenance_checklist || {}).filter(k => k !== '__custom__').length > 0;


  const { data: boats = [] } = useQuery({
    queryKey: ['boats'],
    queryFn: () => base44.entities.BoatInventory.list('-created_date')
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-stats'],
    queryFn: () => base44.entities.Booking.list()
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-stats'],
    queryFn: () => base44.entities.BookingExpense.list()
  });

  const { data: personalTrips = [] } = useQuery({
    queryKey: ['personal-trips'],
    queryFn: () => base44.entities.PersonalTrip.list('-trip_date')
  });

  const getBoatStats = (boatName, boatId) => {
    const boatBookings = bookings.filter((b) => b.boat_name === boatName && b.status !== 'cancelled');
    const today = new Date();
    const futureBookings = boatBookings.filter((b) => new Date(b.date) >= today);
    const pastBookings = boatBookings.filter((b) => new Date(b.date) < today);
    const completedBookings = boatBookings.filter((b) => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const bookingIds = completedBookings.map((b) => b.id);
    const boatExpenses = expenses.filter((e) => bookingIds.includes(e.booking_id));
    const totalExpenses = boatExpenses.reduce((sum, e) => {
      return sum + (e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0);
    }, 0);
    const netProfit = totalRevenue - totalExpenses;
    const roi = totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(1) : 0;
    const expeditionCounts = {};
    boatBookings.forEach((b) => {
      const exp = b.experience_type || 'unknown';
      expeditionCounts[exp] = (expeditionCounts[exp] || 0) + 1;
    });
    const frequentTrip = Object.entries(expeditionCounts).sort((a, b) => b[1] - a[1])[0];
    const lastTrip = pastBookings.filter((b) => b.status === 'completed').sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const totalEngineHoursFromBookings = boatBookings.reduce((sum, b) => sum + (b.engine_hours_used || 0), 0);
    const boatPersonalTrips = personalTrips.filter((t) => t.boat_id === boatId);
    const personalTripsEngineHours = boatPersonalTrips.reduce((sum, t) => sum + (t.engine_hours_used || 0), 0);

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
      lastTrip: lastTrip,
      totalEngineHoursFromBookings: totalEngineHoursFromBookings,
      personalTripsCount: boatPersonalTrips.length,
      personalTripsEngineHours: personalTripsEngineHours
    };
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BoatInventory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BoatInventory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BoatInventory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
    }
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
      operator: defaultOperator || '',
      crew_members: 0,
      boat_mode: 'rental_and_maintenance',
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
        wifi: false,
        air_conditioning: false,
        refrigerator: false,
        ice_maker: false,
        shower: false,
        bimini_top: false,
        anchor: false
      },
      equipment_visibility: {},
      custom_equipment: [],
      custom_equipment_visibility: [],
      engine_config: '',
      engine_name: '',
      engine_quantity: 1,
      engine_year: null,
      current_hours: 0,
      maintenance_interval_hours: 100,
      last_maintenance_hours: 0,
      next_service_type: 'minor',
      minor_maintenance_cost: 0,
      major_maintenance_cost: 0,
      mechanic_name: '',
      mechanic_phone: '',
      mechanic_email: '',
      supply_sellers: [],
      owner_phone: '',
      maintenance_schedule: '',
      last_service_date: '',
      last_service_mechanic_phone: '',
      supplies_inventory: [],
      recurring_costs: [],
      price_per_additional_hour: 0,
      status: 'active',
      maintenance_checklist: {},
      custom_fields_general: [],
      custom_fields_maintenance: []
    });
    setImageFile(null);
    setImagePreview('');
    setNewSupplier({ name: '', phone: '', email: '', specialty: '' });
    setNewRecurringCost({
      name: '', amount: 0, frequency_months: 1, next_payment_date: '', category: 'other', notes: ''
    });
    setEditingBoat(null);
    setDialogOpen(false);
  };

  const scrollToSection = (sectionId) => {
    // Open edit dialog for the boat first (caller handles this), then scroll
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleEditAndScroll = (boat, sectionId) => {
    handleEdit(boat);
    scrollToSection(sectionId);
  };

  const handleEdit = (boat) => {
    setEditingBoat(boat);
    const customEquip = boat.custom_equipment || [];
    const customVisibility = boat.custom_equipment_visibility || [];
    const normalizedCustomVisibility = customEquip.map((_, idx) =>
    typeof customVisibility[idx] === 'boolean' ? customVisibility[idx] : true
    );

    setFormData({
      ...boat,
      dock_location: boat.dock_location || '',
      expedition_pricing: boat.expedition_pricing || [],
      next_service_type: boat.next_service_type || 'minor',
      mechanic_name: boat.mechanic_name || '',
      mechanic_phone: boat.mechanic_phone || '',
      mechanic_email: boat.mechanic_email || '',
      supply_sellers: Array.isArray(boat.supply_sellers) ? boat.supply_sellers : [],
      owner_phone: boat.owner_phone || '',
      crew_members: boat.crew_members || 0,
      engine_year: boat.engine_year || null,
      boat_mode: boat.boat_mode || 'rental_and_maintenance',
      last_service_date: boat.last_service_date || '',
      last_service_mechanic_phone: boat.last_service_mechanic_phone || '',
      supplies_inventory: boat.supplies_inventory || [],
      recurring_costs: boat.recurring_costs || [],
      price_per_additional_hour: boat.price_per_additional_hour || 0,
      maintenance_checklist: boat.maintenance_checklist || {},
      equipment: boat.equipment || {
        bathroom: false,
        live_well: false,
        starlink: false,
        cctv: false,
        audio_system: false,
        gps: false,
        fishing_gear: false,
        snorkeling_gear: false,
        wifi: false,
        air_conditioning: false,
        refrigerator: false,
        ice_maker: false,
        shower: false,
        bimini_top: false,
        anchor: false
      },
      equipment_visibility: boat.equipment_visibility || {},
      custom_equipment: customEquip,
      custom_equipment_visibility: normalizedCustomVisibility
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
    setFormData((prev) => ({
      ...prev,
      available_expeditions: prev.available_expeditions.includes(expedition) ?
      prev.available_expeditions.filter((e) => e !== expedition) :
      [...prev.available_expeditions, expedition]
    }));
  };

  const toggleEquipment = (equipment) => {
    setFormData((prev) => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [equipment]: !prev.equipment[equipment]
      }
    }));
  };

  const toggleEquipmentVisibility = (equipmentKey, customIndex = null) => {
    if (customIndex !== null) {
      setFormData((prev) => {
        const newVisibility = [...(prev.custom_equipment_visibility || [])];
        const currentValue = newVisibility[customIndex] !== false;
        newVisibility[customIndex] = !currentValue;
        return {
          ...prev,
          custom_equipment_visibility: newVisibility
        };
      });
    } else {
      setFormData((prev) => {
        const currentValue = prev.equipment_visibility?.[equipmentKey] !== false;
        return {
          ...prev,
          equipment_visibility: {
            ...prev.equipment_visibility,
            [equipmentKey]: !currentValue
          }
        };
      });
    }
  };

  const addCustomEquipment = () => {
    if (!newEquipment.trim()) return;
    setFormData((prev) => ({
      ...prev,
      custom_equipment: [...prev.custom_equipment, newEquipment.trim()],
      custom_equipment_visibility: [...(prev.custom_equipment_visibility || []), true]
    }));
    setNewEquipment('');
  };

  const removeCustomEquipment = (index) => {
    setFormData((prev) => ({
      ...prev,
      custom_equipment: prev.custom_equipment.filter((_, i) => i !== index),
      custom_equipment_visibility: (prev.custom_equipment_visibility || []).filter((_, i) => i !== index)
    }));
  };

  const updateExpeditionPrice = (expType, field, value) => {
    setFormData((prev) => {
      const existing = prev.expedition_pricing.find((e) => e.expedition_type === expType);
      if (existing) {
        return {
          ...prev,
          expedition_pricing: prev.expedition_pricing.map((e) =>
          e.expedition_type === expType ? { ...e, [field]: field.includes('hours') || field.includes('mxn') ? parseFloat(value) || 0 : value } : e
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

  const addSupply = (supply) => {
    setFormData((prev) => ({
      ...prev,
      supplies_inventory: [...prev.supplies_inventory, { ...supply, id: Date.now() }]
    }));
  };

  const removeSupply = (index) => {
    setFormData((prev) => ({
      ...prev,
      supplies_inventory: prev.supplies_inventory.filter((_, i) => i !== index)
    }));
  };

  const updateSupplyStatus = (index, status) => {
    setFormData((prev) => ({
      ...prev,
      supplies_inventory: prev.supplies_inventory.map((item, i) =>
      i === index ? { ...item, status } : item
      )
    }));
  };

  const updateSupplyQuantity = (index, quantity) => {
    setFormData((prev) => ({
      ...prev,
      supplies_inventory: prev.supplies_inventory.map((item, i) =>
      i === index ? { ...item, quantity: parseInt(quantity) || 0 } : item
      )
    }));
  };

  const updateSupplyField = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      supplies_inventory: prev.supplies_inventory.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addRecurringCost = () => {
    if (!newRecurringCost.name) return;
    setFormData((prev) => ({
      ...prev,
      recurring_costs: [...(prev.recurring_costs || []), { ...newRecurringCost, id: Date.now() }]
    }));
    setNewRecurringCost({
      name: '', amount: 0, frequency_months: 1, next_payment_date: '', category: 'other', notes: ''
    });
  };

  const removeRecurringCost = (index) => {
    setFormData((prev) => ({
      ...prev,
      recurring_costs: (prev.recurring_costs || []).filter((_, i) => i !== index)
    }));
  };

  const calculateSupplyTimeRemaining = (purchasedDate, durationMonths) => {
    if (!purchasedDate || !durationMonths) return null;
    const purchased = new Date(purchasedDate);
    const now = new Date();
    const totalDays = durationMonths * 30;
    const elapsedDays = Math.floor((now - purchased) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const percentageRemaining = Math.max(0, Math.min(100, remainingDays / totalDays * 100));
    return { remainingDays, percentageRemaining, expired: remainingDays === 0 };
  };

  const addSupplier = () => {
    if (!newSupplier.name) return;
    setFormData((prev) => ({
      ...prev,
      supply_sellers: [...prev.supply_sellers, { ...newSupplier, id: Date.now() }]
    }));
    setNewSupplier({ name: '', phone: '', email: '', specialty: '' });
  };

  const removeSupplier = (index) => {
    setFormData((prev) => ({
      ...prev,
      supply_sellers: prev.supply_sellers.filter((_, i) => i !== index)
    }));
  };

  // If showAddBoatOnly: render just the form inline (used from Operators tab dialog)
  if (showAddBoatOnly) {
    return (
      <form onSubmit={handleSubmit} className="space-y-0">
        {/* Operator field pre-filled */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <span className="text-sm text-blue-800">This boat will be assigned to operator: <strong>{defaultOperator}</strong></span>
        </div>
        {/* General Info section only for quick add */}
        <div className="rounded-xl overflow-hidden border border-sky-200 mb-4">
          <div className="w-full bg-sky-600 px-5 py-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-white" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">General Information</h3>
          </div>
          <div className="bg-sky-50 p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Boat Name *</Label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Type *</Label><Input required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="e.g., Center Console" className="mt-1" /></div>
              <div><Label>Size *</Label><Input required value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} placeholder="e.g., 25ft" className="mt-1" /></div>
              <div><Label>Capacity *</Label><Input required value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} placeholder="e.g., Up to 6 guests" className="mt-1" /></div>
              <div><Label>Location *</Label><Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem><SelectItem value="acapulco">Acapulco</SelectItem></SelectContent></Select></div>
              <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
              <div className="md:col-span-2"><Label>Operator</Label><Select value={formData.operator || ''} onValueChange={(v) => setFormData({ ...formData, operator: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select operator" /></SelectTrigger><SelectContent>{operatorNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="mt-1" /></div>
            <div>
              <Label>Boat Image</Label>
              <div className="space-y-2 mt-1">
                {imagePreview && <div className="relative w-full h-48 rounded-lg overflow-hidden border border-sky-200"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /></div>}
                <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={createMutation.isPending || uploading}>{uploading ? 'Uploading...' : 'Create Boat'}</Button>
        </div>
        {createMutation.isSuccess && <p className="text-green-600 text-sm mt-2">✓ Boat created! You can find it in the Boat Inventory tab.</p>}
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="bg-transparent text-slate-50 text-2xl font-semibold">Boat Inventory{restrictToBoat ? ` — ${restrictToBoat}` : ''}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {!readOnlyMode &&
          <DialogTrigger asChild>
            <Button onClick={() => {resetForm();setDialogOpen(true);}} className="bg-violet-600 text-primary-foreground px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-9">
              <Plus className="h-4 w-4 mr-2" />
              Add Boat
            </Button>
          </DialogTrigger>
          }
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingBoat ? `Editing: ${editingBoat.name}` : 'Add New Boat'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-0">

              {/* ── SECTION 1: General Info ── sky blue */}
              <div className="rounded-xl overflow-hidden border border-sky-200 mb-4">
                <button type="button" onClick={() => toggleSection('general')} className="w-full bg-sky-600 px-5 py-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">General Information</h3>
                  {(() => {const f = [formData.name, formData.type, formData.size, formData.capacity, formData.location, formData.description, formData.image || imagePreview];const n = f.filter((x) => x && String(x).trim() !== '').length;return <><span className="text-xs text-white/80 mr-1">{n}/{f.length}</span><div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2"><div className="h-full bg-white transition-all rounded-full" style={{ width: `${Math.round(n / f.length * 100)}%` }} /></div></>;})()}
                  <SectionLockButton sectionKey="general" locks={locks} toggle={toggleLock} isComplete={isGeneralComplete} />
                  {collapsedSections['general'] ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
                </button>
                {!collapsedSections['general'] && <div className="bg-sky-50 p-5 space-y-4">
                  {locks['general'] && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5"><span>🔒 Section locked — unlock to edit.</span></div>}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><InfoLabel info="The official name of the boat as it appears to guests and in reports." example="FILU, TYCOON, La Güera">Boat Name *</InfoLabel><Input required disabled={locks['general']} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                    <div><InfoLabel info="The category or model type of the boat." example="Center Console, Yacht, Panga">Type *</InfoLabel><Input required disabled={locks['general']} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="e.g., Center Console, Yacht" /></div>
                    <div><InfoLabel info="Total length of the boat including the unit." example="25ft, 55ft, 8m">Size *</InfoLabel><Input required disabled={locks['general']} value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} placeholder="e.g., 25ft" /></div>
                    <div><InfoLabel info="Maximum number of passengers allowed on board." example="Up to 6 guests, Up to 12 guests">Capacity *</InfoLabel><Input required disabled={locks['general']} value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} placeholder="e.g., Up to 6 guests" /></div>
                    <div><InfoLabel info="Number of crew members typically assigned to this boat (not counting captain)." example="2">Crew Members</InfoLabel><Input type="number" min="0" disabled={locks['general']} value={formData.crew_members} onChange={(e) => setFormData({ ...formData, crew_members: parseInt(e.target.value) || 0 })} placeholder="e.g., 2" /></div>
                    <div><InfoLabel info="The city/port where this boat operates and takes bookings." example="Ixtapa-Zihuatanejo">Location *</InfoLabel><Select disabled={locks['general']} value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem><SelectItem value="acapulco">Acapulco</SelectItem></SelectContent></Select></div>
                    <div><InfoLabel info="Exact dock slip or marina name where the boat is currently moored." example="Marina Paradise Slip 14, Dry Dock 3">Dock Location</InfoLabel><Input disabled={locks['general']} value={formData.dock_location} onChange={(e) => setFormData({ ...formData, dock_location: e.target.value })} placeholder="e.g., Marina Paradise, Dry Dock 3" /><p className="text-xs text-sky-700 mt-1">⚓ Where the boat is currently docked</p></div>
                    <div><InfoLabel info="Current operational status. 'Maintenance' hides the boat from bookings." example="active">Status</InfoLabel><Select disabled={locks['general']} value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
                    <div className="md:col-span-2"><InfoLabel info="The operator this boat belongs to. Used to group boats by fleet." example="FILU, NAUTIKA">Operator</InfoLabel><Select disabled={locks['general']} value={formData.operator || ''} onValueChange={(v) => setFormData({ ...formData, operator: v })}><SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger><SelectContent>{operatorNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <div><InfoLabel info="A short marketing description shown to guests on the booking page.">Description</InfoLabel><Textarea disabled={locks['general']} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                  <div>
                    <InfoLabel info="Main photo of the boat shown to guests. Use a high-quality landscape photo.">Boat Image</InfoLabel>
                    <div className="space-y-2 mt-1">
                      {imagePreview && <div className="relative w-full h-48 rounded-lg overflow-hidden border border-sky-200"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /></div>}
                      <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                    </div>
                  </div>
                  <CustomFieldsManager
                    sectionKey="general"
                    customFields={formData.custom_fields_general || []}
                    onChange={(fields) => setFormData((prev) => ({ ...prev, custom_fields_general: fields }))} />

                </div>}
              </div>

              {/* ── SECTION 2: Expeditions & Pricing ── indigo */}
              {formData.boat_mode === 'rental_and_maintenance' &&
              <div className="rounded-xl overflow-hidden border border-indigo-200 mb-4">
                <button type="button" onClick={() => toggleSection('expeditions')} className="w-full bg-indigo-600 px-5 py-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">Expeditions &amp; Pricing</h3>
                  {(() => {const n = formData.available_expeditions?.length || 0; const t = expeditionTypes.length; return <><span className="text-xs text-white/80 mr-1">{n}/{t}</span><div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2"><div className="h-full bg-white transition-all rounded-full" style={{ width: `${Math.round(n/t*100)}%` }} /></div></>;})()}
                  <SectionLockButton sectionKey="expeditions" locks={locks} toggle={toggleLock} isComplete={isExpeditionsComplete} />
                  {collapsedSections['expeditions'] ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
                </button>
                {!collapsedSections['expeditions'] && <div className="bg-indigo-50 p-5 space-y-4">
                  {locks['expeditions'] && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5"><span>🔒 Section locked — unlock to edit.</span></div>}
                  <div>
                    <InfoLabel info="Cost charged for every additional hour beyond the scheduled expedition duration." example="2500">Price Per Additional Hour (MXN)</InfoLabel>
                    <Input type="number" min="0" disabled={locks['expeditions']} value={formData.price_per_additional_hour || 0} onChange={(e) => setFormData({ ...formData, price_per_additional_hour: parseFloat(e.target.value) || 0 })} placeholder="e.g., 2500" className="text-sm mt-1" />
                    <p className="text-xs text-indigo-700 mt-1">Cost per extra hour beyond scheduled expedition duration</p>
                  </div>
                  <div className="space-y-3">
                    {expeditionTypes.map((exp) => {
                      const isSelected = formData.available_expeditions.includes(exp);
                      const pricing = formData.expedition_pricing.find((p) => p.expedition_type === exp);
                      return (
                        <div key={exp} className={`p-4 rounded-lg border-2 transition-all ${isSelected ? 'border-indigo-400 bg-white shadow-sm' : 'border-indigo-100 bg-indigo-50/50'}`}>
                          <button type="button" disabled={locks['expeditions']} onClick={() => !locks['expeditions'] && toggleExpedition(exp)} className="w-full flex items-center gap-3 mb-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-indigo-600' : 'bg-white border-2 border-indigo-300'}`}>{isSelected && <Check className="h-3 w-3 text-white" />}</div>
                            <span className="text-sm font-semibold capitalize text-left text-indigo-900">{exp === 'extended_fishing' ? 'Full Day Expedition' : exp.replace(/_/g, ' ')}</span>
                          </button>
                          {isSelected &&
                          <div className="space-y-4 mt-3 pl-8">
                              <div className="grid grid-cols-2 gap-3">
                                <div><InfoLabel className="text-xs" info="Scheduled duration of this expedition in hours." example="4">Duration (hours)</InfoLabel><Input type="number" min="0" step="0.5" disabled={locks['expeditions']} value={pricing?.duration_hours || ''} onChange={(e) => updateExpeditionPrice(exp, 'duration_hours', e.target.value)} placeholder="e.g., 4" className="text-sm" /></div>
                                <div><InfoLabel className="text-xs" info="Base price in Mexican Pesos (MXN) for this expedition on this boat." example="8000">Price (MXN)</InfoLabel><Input type="number" min="0" disabled={locks['expeditions']} value={pricing?.price_mxn || ''} onChange={(e) => updateExpeditionPrice(exp, 'price_mxn', e.target.value)} placeholder="e.g., 8000" className="text-sm" /></div>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold mb-2 block">Pickup Locations &amp; Departure Times</Label>
                                <PickupAndDeparture pickupAndDepartures={expeditionPickupDepartures[exp] || []} onUpdate={(items) => setExpeditionPickupDepartures({ ...expeditionPickupDepartures, [exp]: items })} expeditionType={exp} location={formData.location} />
                              </div>
                            </div>
                          }
                        </div>);

                    })}
                  </div>
                </div>}
              </div>
              }

              {/* ── SECTION 3: Equipment ── teal */}
              {formData.boat_mode === 'rental_and_maintenance' &&
              <div className="rounded-xl overflow-hidden border border-teal-200 mb-4">
                  <button type="button" onClick={() => toggleSection('equipment')} className="w-full bg-teal-600 px-5 py-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-white" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">Equipment</h3>
                    {(() => {const allEq = Object.values(formData.equipment||{});const custom = formData.custom_equipment||[];const n = allEq.filter(Boolean).length + custom.length;const t = allEq.length + custom.length || 1;return <><span className="text-xs text-white/80 mr-1">{n}/{t}</span><div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2"><div className="h-full bg-white transition-all rounded-full" style={{ width: `${Math.round(n/t*100)}%` }} /></div></>;})()}
                    <SectionLockButton sectionKey="equipment" locks={locks} toggle={toggleLock} isComplete={isEquipmentComplete} />
                    {collapsedSections['equipment'] ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
                  </button>
                  {!collapsedSections['equipment'] && <div className="bg-teal-50 p-5">
                    {locks['equipment'] && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5 mb-3"><span>🔒 Section locked — unlock to edit.</span></div>}
                    <EquipmentManager
                    equipment={formData.equipment}
                    customEquipment={formData.custom_equipment}
                    equipmentVisibility={formData.equipment_visibility}
                    customEquipmentVisibility={formData.custom_equipment_visibility}
                    onToggleEquipment={toggleEquipment}
                    onToggleVisibility={toggleEquipmentVisibility}
                    onAddCustom={addCustomEquipment}
                    onRemoveCustom={removeCustomEquipment}
                    newEquipment={newEquipment}
                    onNewEquipmentChange={setNewEquipment} />

                  </div>}
                </div>
              }

              {/* ── SECTION 4: Engine ── amber */}
              <div id="section-engine" className="rounded-xl overflow-hidden border border-amber-200 mb-4">
                <button type="button" onClick={() => toggleSection('engine')} className="w-full bg-amber-500 px-5 py-3 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">Engine Configuration</h3>
                  {(() => {const f = [formData.engine_config, formData.engine_name, formData.engine_year, formData.engine_quantity];const n = f.filter((x) => x !== null && x !== undefined && String(x).trim() !== '' && x !== 0).length;return <><span className="text-xs text-white/80 mr-1">{n}/{f.length}</span><div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2"><div className="h-full bg-white transition-all rounded-full" style={{ width: `${Math.round(n / f.length * 100)}%` }} /></div></>;})()}
                  <SectionLockButton sectionKey="engine" locks={locks} toggle={toggleLock} isComplete={isEngineComplete} />
                  {collapsedSections['engine'] ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
                </button>
                {!collapsedSections['engine'] && <div className="bg-amber-50 p-5 space-y-4">
                  {locks['engine'] && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5"><span>🔒 Section locked — unlock to edit.</span></div>}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><InfoLabel info="Inboard engines are inside the hull; outboard engines are mounted externally on the transom." example="outboard">Engine Type</InfoLabel><Select disabled={locks['engine']} value={formData.engine_config} onValueChange={(value) => setFormData({ ...formData, engine_config: value })}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="inboard">Inboard</SelectItem><SelectItem value="outboard">Outboard</SelectItem></SelectContent></Select></div>
                    <div><InfoLabel info="Total number of engines on this boat." example="2">Number of Engines</InfoLabel><Input type="number" min="1" disabled={locks['engine']} value={formData.engine_quantity} onChange={(e) => setFormData({ ...formData, engine_quantity: parseInt(e.target.value) || 1 })} /></div>
                    <div><InfoLabel info="The year the engine(s) were manufactured." example="2017">Engine Year</InfoLabel><Input type="number" min="1900" max="2100" disabled={locks['engine']} value={formData.engine_year || ''} onChange={(e) => setFormData({ ...formData, engine_year: parseInt(e.target.value) || null })} placeholder="e.g., 2017" /></div>
                    <div className="md:col-span-2"><InfoLabel info="Brand, model, and HP of the engine(s). Include 'Twin' if two engines." example="Twin Yamaha 250HP">Engine Details</InfoLabel><Input disabled={locks['engine']} value={formData.engine_name} onChange={(e) => setFormData({ ...formData, engine_name: e.target.value })} placeholder="e.g., Twin Yamaha 250" /></div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div><InfoLabel info="How many engine hours between each scheduled service." example="100">Maintenance Interval (hours)</InfoLabel><Input type="number" min="1" disabled={locks['engine']} value={formData.maintenance_interval_hours} onChange={(e) => setFormData({ ...formData, maintenance_interval_hours: parseInt(e.target.value) || 100 })} /></div>
                    <div><InfoLabel info="The engine hour count when the last service was performed." example="350">Hours at Last Maintenance</InfoLabel><Input type="number" min="0" disabled={locks['engine']} value={formData.last_maintenance_hours} onChange={(e) => setFormData({ ...formData, last_maintenance_hours: parseInt(e.target.value) || 0 })} /></div>
                    <div><InfoLabel info="The base engine hours recorded on the physical hour meter. Booking and personal trip hours are added automatically." example="420">Current Hours</InfoLabel><Input type="number" min="0" disabled={locks['engine']} value={formData.current_hours} onChange={(e) => setFormData({ ...formData, current_hours: parseInt(e.target.value) || 0 })} /></div>
                  </div>
                  {formData.current_hours > 0 &&
                  <div className="p-4 bg-white rounded-lg border border-amber-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div><p className="text-xs text-amber-700 font-medium">Since Last Service</p><p className="text-2xl font-bold text-slate-900">{formData.current_hours - formData.last_maintenance_hours}</p></div>
                        <div><p className="text-xs text-amber-700 font-medium">Until Next Service</p><p className={`text-2xl font-bold ${formData.last_maintenance_hours + formData.maintenance_interval_hours - formData.current_hours <= 10 ? 'text-red-600' : 'text-green-600'}`}>{Math.max(0, formData.last_maintenance_hours + formData.maintenance_interval_hours - formData.current_hours)}</p></div>
                        <div><p className="text-xs text-amber-700 font-medium">Next Service At</p><p className="text-2xl font-bold text-amber-600">{formData.last_maintenance_hours + formData.maintenance_interval_hours} hrs</p></div>
                      </div>
                    </div>
                  }
                </div>}
              </div>

              {/* ── SECTION 4b: Maintenance Checklist ── green (engine-type specific) */}
              <div className="rounded-xl overflow-hidden border border-green-200 mb-4">
                <button type="button" onClick={() => toggleSection('checklist')} className="w-full bg-green-700 px-5 py-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">
                    Maintenance Checklist
                    {formData.engine_config === 'inboard' && <span className="ml-2 text-green-200 font-normal normal-case text-xs">(Inboard Diesel Yacht)</span>}
                    {formData.engine_config === 'outboard' && <span className="ml-2 text-green-200 font-normal normal-case text-xs">(Outboard Center Console)</span>}
                  </h3>
                  {(() => {const cl = formData.maintenance_checklist||{};const custom = cl.__custom__||[];const checked = Object.entries(cl).filter(([k,v])=>k!=='__custom__'&&(typeof v==='object'?v.checked:!!v)).length + custom.filter(i=>cl[i.id]?.checked).length;const total = Object.keys(cl).filter(k=>k!=='__custom__').length + custom.length;return total > 0 ? <><span className="text-xs text-white/80 mr-1">{checked}/{total}</span><div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2"><div className="h-full bg-white transition-all rounded-full" style={{ width: `${Math.round(checked/total*100)}%` }} /></div></> : null;})()}
                  <SectionLockButton sectionKey="checklist" locks={locks} toggle={toggleLock} isComplete={isChecklistComplete} />
                  {collapsedSections['checklist'] ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
                </button>
                {!collapsedSections['checklist'] && <div className="bg-green-50 p-5 space-y-4">
                  {locks['checklist'] && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5"><span>🔒 Section locked — unlock to edit.</span></div>}
                  <MaintenanceChecklist
                    engineConfig={formData.engine_config}
                    checklist={formData.maintenance_checklist || {}}
                    onChange={(val) => setFormData((prev) => ({ ...prev, maintenance_checklist: val }))}
                    isSuperAdmin={isSuperAdmin} />
                </div>}
              </div>

              {/* ── SECTION 5: Maintenance ── orange/red */}
              <div id="section-maintenance" className="rounded-xl overflow-hidden border border-orange-200 mb-4">
                <button type="button" onClick={() => toggleSection('maintenance')} className="w-full bg-orange-600 px-5 py-3 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">Maintenance</h3>
                  {(() => {const f = [formData.last_service_date, formData.last_service_mechanic_phone, formData.impeller_last_replaced_date, formData.fuel_filter_last_replaced_date, formData.oil_filter_last_replaced_date, formData.battery_inspection_date, formData.zinc_anodes_last_replaced_date, formData.antifouling_last_applied_date, formData.safety_equipment_inspection_date, formData.hull_condition_notes, formData.propeller_condition_notes, formData.mechanic_name, formData.mechanic_phone];const n = f.filter((x) => x && String(x).trim() !== '').length;return <><span className="text-xs text-white/80 mr-1">{n}/{f.length}</span><div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2"><div className="h-full bg-white transition-all rounded-full" style={{ width: `${Math.round(n / f.length * 100)}%` }} /></div></>;})()}
                  <SectionLockButton sectionKey="maintenance" locks={locks} toggle={toggleLock} isComplete={isMaintenanceComplete} />
                  {collapsedSections['maintenance'] ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
                </button>
                {!collapsedSections['maintenance'] && <div className="bg-orange-50 p-5 space-y-4">
                  {locks['maintenance'] && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5"><span>🔒 Section locked — unlock to edit.</span></div>}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-0.5">
                        <InfoLabel info="The date when the last full engine service was completed." example="2025-01-15">Last Service Date</InfoLabel>
                        <TimestampButton disabled={locks['maintenance']} onStamp={(d) => setFormData({ ...formData, last_service_date: d })} />
                      </div>
                      <Input type="date" disabled={locks['maintenance']} value={formData.last_service_date} onChange={(e) => setFormData({ ...formData, last_service_date: e.target.value })} className="mt-1" />
                    </div>
                    <div><InfoLabel info="Phone number of the mechanic who performed the last service." example="+52 755 123 4567">Mechanic Phone (Last Service)</InfoLabel><Input type="tel" disabled={locks['maintenance']} value={formData.last_service_mechanic_phone} onChange={(e) => setFormData({ ...formData, last_service_mechanic_phone: e.target.value })} placeholder="e.g., +52 755 123 4567" className="mt-1" /></div>
                  </div>

                  {/* Component Replacement Dates */}
                  <div className="bg-white border border-orange-200 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">Component Replacement Dates</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center gap-0.5"><InfoLabel className="text-xs" info="Date the water pump impeller was last replaced. Usually every 1-2 years." example="2024-06-01">Impeller Last Replaced</InfoLabel><TimestampButton disabled={locks['maintenance']} onStamp={(d) => setFormData({ ...formData, impeller_last_replaced_date: d })} /></div>
                        <Input type="date" disabled={locks['maintenance']} value={formData.impeller_last_replaced_date || ''} onChange={(e) => setFormData({ ...formData, impeller_last_replaced_date: e.target.value })} className="text-sm mt-1" />
                      </div>
                      <div>
                        <div className="flex items-center gap-0.5"><InfoLabel className="text-xs" info="Date the fuel filter was last replaced. Usually every annual service." example="2024-12-01">Fuel Filter Last Replaced</InfoLabel><TimestampButton disabled={locks['maintenance']} onStamp={(d) => setFormData({ ...formData, fuel_filter_last_replaced_date: d })} /></div>
                        <Input type="date" disabled={locks['maintenance']} value={formData.fuel_filter_last_replaced_date || ''} onChange={(e) => setFormData({ ...formData, fuel_filter_last_replaced_date: e.target.value })} className="text-sm mt-1" />
                      </div>
                      <div>
                        <div className="flex items-center gap-0.5"><InfoLabel className="text-xs" info="Date the oil filter was last replaced. Usually every 100 engine hours or 1 year." example="2024-11-10">Oil Filter Last Replaced</InfoLabel><TimestampButton disabled={locks['maintenance']} onStamp={(d) => setFormData({ ...formData, oil_filter_last_replaced_date: d })} /></div>
                        <Input type="date" disabled={locks['maintenance']} value={formData.oil_filter_last_replaced_date || ''} onChange={(e) => setFormData({ ...formData, oil_filter_last_replaced_date: e.target.value })} className="text-sm mt-1" />
                      </div>
                      {formData.engine_config === 'outboard' &&
                      <div>
                          <div className="flex items-center gap-0.5"><InfoLabel className="text-xs" info="Date spark plugs were last replaced on outboard engine. Usually every 100 hrs or 1 year." example="2024-09-20">Spark Plugs Last Replaced</InfoLabel><TimestampButton disabled={locks['maintenance']} onStamp={(d) => setFormData({ ...formData, spark_plugs_last_replaced_date: d })} /></div>
                          <Input type="date" disabled={locks['maintenance']} value={formData.spark_plugs_last_replaced_date || ''} onChange={(e) => setFormData({ ...formData, spark_plugs_last_replaced_date: e.target.value })} className="text-sm mt-1" />
                        </div>
                      }
                      <div>
                        <div className="flex items-center gap-0.5"><InfoLabel className="text-xs" info="Date batteries were last tested or replaced. Annual inspection recommended." example="2024-08-05">Battery Last Inspected</InfoLabel><TimestampButton disabled={locks['maintenance']} onStamp={(d) => setFormData({ ...formData, battery_inspection_date: d })} /></div>
                        <Input type="date" disabled={locks['maintenance']} value={formData.battery_inspection_date || ''} onChange={(e) => setFormData({ ...formData, battery_inspection_date: e.target.value })} className="text-sm mt-1" />
                      </div>
                      <div>
                        <div className="flex items-center gap-0.5"><InfoLabel className="text-xs" info="Date zinc/aluminum anodes protecting the hull from corrosion were last replaced." example="2024-07-15">Zinc Anodes Last Replaced</InfoLabel><TimestampButton disabled={locks['maintenance']} onStamp={(d) => setFormData({ ...formData, zinc_anodes_last_replaced_date: d })} /></div>
                        <Input type="date" disabled={locks['maintenance']} value={formData.zinc_anodes_last_replaced_date || ''} onChange={(e) => setFormData({ ...formData, zinc_anodes_last_replaced_date: e.target.value })} className="text-sm mt-1" />
                      </div>
                      <div>
                        <div className="flex items-center gap-0.5"><InfoLabel className="text-xs" info="Date anti-fouling bottom paint was last applied to prevent marine growth." example="2024-02-10">Anti-Fouling Paint Last Applied</InfoLabel><TimestampButton disabled={locks['maintenance']} onStamp={(d) => setFormData({ ...formData, antifouling_last_applied_date: d })} /></div>
                        <Input type="date" disabled={locks['maintenance']} value={formData.antifouling_last_applied_date || ''} onChange={(e) => setFormData({ ...formData, antifouling_last_applied_date: e.target.value })} className="text-sm mt-1" />
                      </div>
                      <div>
                        <div className="flex items-center gap-0.5"><InfoLabel className="text-xs" info="Date life jackets, flares, fire extinguishers, and other safety gear were last inspected." example="2025-01-01">Safety Equipment Last Inspected</InfoLabel><TimestampButton disabled={locks['maintenance']} onStamp={(d) => setFormData({ ...formData, safety_equipment_inspection_date: d })} /></div>
                        <Input type="date" disabled={locks['maintenance']} value={formData.safety_equipment_inspection_date || ''} onChange={(e) => setFormData({ ...formData, safety_equipment_inspection_date: e.target.value })} className="text-sm mt-1" />
                        <p className="text-xs text-orange-700 mt-1">Life jackets, flares, fire extinguishers</p>
                      </div>
                    </div>
                  </div>

                  {/* Condition Notes */}
                  <div className="bg-white border border-orange-200 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">Condition Notes</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div><InfoLabel className="text-xs" info="Describe the current condition of the hull — scratches, paint state, etc." example="Minor scratches port side, antifouling good">Hull Condition Notes</InfoLabel><Textarea disabled={locks['maintenance']} value={formData.hull_condition_notes || ''} onChange={(e) => setFormData({ ...formData, hull_condition_notes: e.target.value })} rows={2} placeholder="e.g., Minor scratches on port side, antifouling in good condition" className="text-sm" /></div>
                      <div><InfoLabel className="text-xs" info="Describe propeller condition — bent blades, cavitation damage, wear." example="Starboard prop has minor ding at tip">Propeller Condition Notes</InfoLabel><Textarea disabled={locks['maintenance']} value={formData.propeller_condition_notes || ''} onChange={(e) => setFormData({ ...formData, propeller_condition_notes: e.target.value })} rows={2} placeholder="e.g., Starboard prop has minor ding at tip" className="text-sm" /></div>
                    </div>
                  </div>

                  <div className="bg-orange-100 border border-orange-200 rounded-lg p-3"><p className="text-sm text-orange-900">💡 <strong>Note:</strong> Enter the maintenance cost <strong>per engine</strong>. Total is calculated from engine count above.</p></div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><InfoLabel info="Cost of a minor service per engine (oil, filters, basic check)." example="5000">Minor Maintenance Cost (MXN)</InfoLabel><Input type="number" min="0" disabled={locks['maintenance']} value={formData.minor_maintenance_cost} onChange={(e) => setFormData({ ...formData, minor_maintenance_cost: parseInt(e.target.value) || 0 })} placeholder="e.g., 5000" /><p className="text-xs text-orange-700 mt-1">Oil change, filters, basic service</p></div>
                    <div><InfoLabel info="Cost of a major service per engine (full overhaul, timing, impeller, etc.)." example="25000">Major Maintenance Cost (MXN)</InfoLabel><Input type="number" min="0" disabled={locks['maintenance']} value={formData.major_maintenance_cost} onChange={(e) => setFormData({ ...formData, major_maintenance_cost: parseInt(e.target.value) || 0 })} placeholder="e.g., 25000" /><p className="text-xs text-orange-700 mt-1">Engine rebuild, major repairs</p></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-orange-200">
                    <div><InfoLabel info="Full name of the preferred mechanic for this boat." example="Juan Pérez">Mechanic Name</InfoLabel><Input disabled={locks['maintenance']} value={formData.mechanic_name} onChange={(e) => setFormData({ ...formData, mechanic_name: e.target.value })} placeholder="e.g., Juan Pérez" /></div>
                    <div><InfoLabel info="Phone/WhatsApp of the mechanic. Include country code." example="+52 755 123 4567">Mechanic Phone</InfoLabel><Input type="tel" disabled={locks['maintenance']} value={formData.mechanic_phone} onChange={(e) => setFormData({ ...formData, mechanic_phone: e.target.value })} placeholder="e.g., +52 755 123 4567" /></div>
                    <div><InfoLabel info="Email of the mechanic for sending reports and service requests." example="mecanico@taller.com">Mechanic Email</InfoLabel><Input type="email" disabled={locks['maintenance']} value={formData.mechanic_email} onChange={(e) => setFormData({ ...formData, mechanic_email: e.target.value })} placeholder="e.g., mechanic@example.com" /></div>
                  </div>
                  {/* Custom Maintenance Components */}
                  <div className="border-t border-orange-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">Custom Components for This Vessel</p>
                      {!locks['maintenance'] && <button type="button" onClick={() => setShowCustomMaintenanceForm(p => !p)} className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"><Plus className="h-3 w-3" />Add Custom Component</button>}
                    </div>
                    {showCustomMaintenanceForm && !locks['maintenance'] && (
                      <div className="bg-white border border-orange-200 rounded-lg p-3 space-y-2 mb-3">
                        <p className="text-xs font-semibold text-orange-800">New Custom Component</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Component Name *</Label>
                            <Input value={newCustomMaintenanceComponent.name} onChange={e => setNewCustomMaintenanceComponent(p => ({...p, name: e.target.value}))} placeholder="e.g., T-Top Canvas Inspection" className="text-sm h-8" />
                          </div>
                          <div>
                            <Label className="text-xs">Interval (e.g. Every 6 months)</Label>
                            <Input value={newCustomMaintenanceComponent.interval} onChange={e => setNewCustomMaintenanceComponent(p => ({...p, interval: e.target.value}))} placeholder="e.g., Every 6 months" className="text-sm h-8" />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Notes (optional)</Label>
                            <Input value={newCustomMaintenanceComponent.notes} onChange={e => setNewCustomMaintenanceComponent(p => ({...p, notes: e.target.value}))} placeholder="Any additional notes..." className="text-sm h-8" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs"
                            disabled={!newCustomMaintenanceComponent.name}
                            onClick={() => {
                              const id = `custom_maint_${Date.now()}`;
                              const existingCustom = formData.maintenance_checklist?.__custom__ || [];
                              setFormData(fd => ({
                                ...fd,
                                maintenance_checklist: {
                                  ...fd.maintenance_checklist,
                                  __custom__: [...existingCustom, { id, name: newCustomMaintenanceComponent.name, interval: newCustomMaintenanceComponent.interval, notes: newCustomMaintenanceComponent.notes }]
                                }
                              }));
                              setNewCustomMaintenanceComponent({ name: '', interval: '', notes: '' });
                              setShowCustomMaintenanceForm(false);
                            }}>
                            Add Component
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowCustomMaintenanceForm(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    {(formData.maintenance_checklist?.__custom__ || []).length > 0 && (
                      <div className="space-y-2">
                        {(formData.maintenance_checklist.__custom__ || []).map((item) => (
                          <div key={item.id} className="flex items-start gap-2 bg-white border border-orange-200 rounded-lg p-3">
                            <input type="checkbox"
                              checked={!!formData.maintenance_checklist[item.id]?.checked}
                              disabled={locks['maintenance']}
                              onChange={() => setFormData(fd => ({
                                ...fd,
                                maintenance_checklist: {
                                  ...fd.maintenance_checklist,
                                  [item.id]: { checked: !fd.maintenance_checklist[item.id]?.checked, date: fd.maintenance_checklist[item.id]?.date || '' }
                                }
                              }))}
                              className="mt-0.5 h-4 w-4 rounded border-orange-400 accent-orange-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800">{item.name}</p>
                              {item.interval && <p className="text-xs text-orange-700">{item.interval}</p>}
                              {item.notes && <p className="text-xs text-slate-500">{item.notes}</p>}
                              {formData.maintenance_checklist[item.id]?.checked && (
                                <Input type="date" className="mt-1 h-7 text-xs w-40"
                                  value={formData.maintenance_checklist[item.id]?.date || ''}
                                  disabled={locks['maintenance']}
                                  onChange={e => setFormData(fd => ({
                                    ...fd,
                                    maintenance_checklist: { ...fd.maintenance_checklist, [item.id]: { ...fd.maintenance_checklist[item.id], date: e.target.value } }
                                  }))}
                                  placeholder="Date completed"
                                />
                              )}
                            </div>
                            {!locks['maintenance'] && (
                              <button type="button" className="text-red-400 hover:text-red-600 flex-shrink-0"
                                onClick={() => setFormData(fd => {
                                  const cl = { ...fd.maintenance_checklist };
                                  cl.__custom__ = (cl.__custom__ || []).filter(c => c.id !== item.id);
                                  delete cl[item.id];
                                  return { ...fd, maintenance_checklist: cl };
                                })}>
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <CustomFieldsManager
                    sectionKey="maintenance"
                    customFields={formData.custom_fields_maintenance || []}
                    onChange={(fields) => setFormData((prev) => ({ ...prev, custom_fields_maintenance: fields }))} />

                </div>}
              </div>

              {/* ── SECTION 6: Supplies Inventory ── emerald */}
              <div id="section-supplies" className="rounded-xl overflow-hidden border border-emerald-200 mb-4">
                <button type="button" onClick={() => toggleSection('supplies')} className="w-full bg-emerald-600 px-5 py-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">Supplies Inventory</h3>
                  {(() => {const n = (formData.supplies_inventory||[]).filter(s=>s.status==='in_stock').length;const t = (formData.supplies_inventory||[]).length||1;return <><span className="text-xs text-white/80 mr-1">{n}/{t}</span><div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2"><div className="h-full bg-white transition-all rounded-full" style={{ width: `${Math.round(n/t*100)}%` }} /></div></>;})()}
                  <SectionLockButton sectionKey="supplies" locks={locks} toggle={toggleLock} isComplete={isSuppliesComplete} />
                  {collapsedSections['supplies'] ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
                </button>
                {!collapsedSections['supplies'] && <div className="bg-emerald-50 p-5 space-y-3">
                  {locks['supplies'] && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5"><span>🔒 Section locked — unlock to edit.</span></div>}
                  <p className="text-sm text-emerald-800">Track all materials and supplies needed to keep your boat in optimal condition.</p>
                  <SuppliesManager supplies={formData.supplies_inventory} onAddSupply={addSupply} onRemoveSupply={removeSupply} onUpdateSupply={updateSupplyField} />
                  {formData.supplies_inventory.length > 0 &&
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {formData.supplies_inventory.map((supply, index) => {
                      const timeRemaining = supply.duration_months > 0 && supply.purchased_date ? calculateSupplyTimeRemaining(supply.purchased_date, supply.duration_months) : null;
                      const totalCost = (supply.quantity || 0) * (supply.price_per_unit || 0);
                      return (
                        <div key={index} className={`p-3 rounded-lg border-2 transition-all ${supply.status === 'in_stock' ? 'bg-white border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                          <div className="flex items-start gap-3">
                            <Package className={`h-4 w-4 mt-1 flex-shrink-0 ${supply.status === 'in_stock' ? 'text-emerald-600' : 'text-red-600'}`} />
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-800">{supply.name}</p>
                                  <div className="flex gap-2 flex-wrap mt-1">
                                    {supply.category && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{supply.category}</span>}
                                    {totalCost > 0 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">${totalCost.toLocaleString()} MXN</span>}
                                  </div>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeSupply(index)} className="text-red-600 hover:text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div><Label className="text-xs text-slate-600">Qty</Label><Input type="number" min="0" value={supply.quantity || 0} onChange={(e) => updateSupplyQuantity(index, e.target.value)} className="h-7 text-sm" /></div>
                                <div><Label className="text-xs text-slate-600">Unit</Label><Input value={supply.unit || ''} onChange={(e) => updateSupplyField(index, 'unit', e.target.value)} placeholder="gallons" className="h-7 text-sm" /></div>
                                <div><Label className="text-xs text-slate-600">Price/Unit</Label><Input type="number" min="0" value={supply.price_per_unit || 0} onChange={(e) => updateSupplyField(index, 'price_per_unit', parseFloat(e.target.value) || 0)} className="h-7 text-sm" /></div>
                                <div><Label className="text-xs text-slate-600">Duration (mo)</Label><Input type="number" min="0" value={supply.duration_months || 0} onChange={(e) => updateSupplyField(index, 'duration_months', parseInt(e.target.value) || 0)} className="h-7 text-sm" /></div>
                              </div>
                              {supply.duration_months > 0 && <div><Label className="text-xs text-slate-600">Purchased Date</Label><Input type="date" value={supply.purchased_date || ''} onChange={(e) => updateSupplyField(index, 'purchased_date', e.target.value)} className="h-7 text-sm" /></div>}
                              {supply.duration_months > 0 &&
                              <div className="space-y-1">
                                  {timeRemaining ? <><div className="flex justify-between text-xs"><span className={timeRemaining.expired ? 'text-red-600 font-semibold' : 'text-slate-600'}>{timeRemaining.expired ? '⚠️ Needs Replacement' : `${timeRemaining.remainingDays} days remaining`}</span><span className="text-slate-500">{timeRemaining.percentageRemaining.toFixed(0)}%</span></div><div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full transition-all ${timeRemaining.percentageRemaining > 50 ? 'bg-green-500' : timeRemaining.percentageRemaining > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${timeRemaining.percentageRemaining}%` }} /></div></> : <div className="bg-amber-50 border border-amber-300 rounded p-2"><p className="text-xs text-amber-700">⚠️ Set purchase date to track duration</p></div>}
                                </div>
                              }
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => updateSupplyStatus(index, 'in_stock')} className={`px-3 py-1 text-xs rounded-md transition-all ${supply.status === 'in_stock' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}>In Stock</button>
                                <button type="button" onClick={() => updateSupplyStatus(index, 'needed')} className={`px-3 py-1 text-xs rounded-md transition-all ${supply.status === 'needed' ? 'bg-red-600 text-white' : 'bg-white border border-red-300 text-red-700 hover:bg-red-50'}`}>Needed</button>
                              </div>
                              {supply.notes && <p className="text-xs text-slate-600 bg-white p-2 rounded">{supply.notes}</p>}
                            </div>
                          </div>
                        </div>);

                    })}
                    </div>
                  }
                </div>}
              </div>

              {/* ── SECTION 7: Supply Sellers ── cyan */}
              <div className="rounded-xl overflow-hidden border border-cyan-200 mb-4">
                <button type="button" onClick={() => toggleSection('sellers')} className="w-full bg-cyan-600 px-5 py-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">Supply Sellers</h3>
                  {(() => {const n = [formData.owner_phone, ...(formData.supply_sellers||[]).map(s=>s.name)].filter(x=>x&&String(x).trim()!=='').length;const t = 1+(formData.supply_sellers||[]).length||1;return <><span className="text-xs text-white/80 mr-1">{n}/{t}</span><div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2"><div className="h-full bg-white transition-all rounded-full" style={{ width: `${Math.round(n/t*100)}%` }} /></div></>;})()}
                  <SectionLockButton sectionKey="sellers" locks={locks} toggle={toggleLock} isComplete={isSellersComplete} />
                  {collapsedSections['sellers'] ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
                </button>
                {!collapsedSections['sellers'] && <div className="bg-cyan-50 p-5 space-y-3">
                  {locks['sellers'] && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5"><span>🔒 Section locked — unlock to edit.</span></div>}
                  {formData.supply_sellers && formData.supply_sellers.length > 0 &&
                  <div className="space-y-2">
                      {formData.supply_sellers.map((supplier, index) =>
                    <div key={index} className="p-3 bg-white rounded-lg border-2 border-cyan-300">
                          <div className="flex items-start gap-3">
                            <Package className="h-4 w-4 mt-1 flex-shrink-0 text-cyan-600" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-800">{supplier.name}</p>
                                  {supplier.specialty && <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded inline-block mt-1">{supplier.specialty}</span>}
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeSupplier(index)} className="text-red-600 hover:text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                              {supplier.phone && <p className="text-xs text-slate-600">📞 {supplier.phone}</p>}
                              {supplier.email && <p className="text-xs text-slate-600">✉️ {supplier.email}</p>}
                            </div>
                          </div>
                        </div>
                    )}
                    </div>
                  }
                  <div className="bg-white p-4 rounded-lg border border-cyan-200 space-y-3">
                    <p className="font-semibold text-sm text-cyan-800">Add Supplier</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div><InfoLabel className="text-xs" info="Business or person name of the supply seller." example="Marine Parts Co.">Supplier Name *</InfoLabel><Input disabled={locks['sellers']} value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} placeholder="e.g., Marine Parts Co." className="text-sm" /></div>
                      <div><InfoLabel className="text-xs" info="WhatsApp or phone number to reach this supplier." example="+52 755 456 7890">Phone</InfoLabel><Input type="tel" disabled={locks['sellers']} value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} placeholder="e.g., +52 755 456 7890" className="text-sm" /></div>
                      <div><InfoLabel className="text-xs" info="Email address to send purchase orders or inquiries." example="ventas@tienda.com">Email</InfoLabel><Input type="email" disabled={locks['sellers']} value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} placeholder="e.g., info@supplier.com" className="text-sm" /></div>
                      <div><InfoLabel className="text-xs" info="What this seller specializes in — helps find them quickly." example="Engine Parts, Oil & Filters">Specialty</InfoLabel><Input disabled={locks['sellers']} value={newSupplier.specialty} onChange={(e) => setNewSupplier({ ...newSupplier, specialty: e.target.value })} placeholder="e.g., Engine Parts" className="text-sm" /></div>
                    </div>
                    <Button type="button" onClick={addSupplier} disabled={!newSupplier.name || locks['sellers']} variant="outline" size="sm" className="w-full border-cyan-400 text-cyan-700 hover:bg-cyan-50"><Plus className="h-4 w-4 mr-2" />Add Supplier</Button>
                  </div>
                  <div><InfoLabel info="Owner's WhatsApp/phone number to receive notifications about bookings and maintenance quotes." example="+52 755 987 6543">Owner Phone (for notifications)</InfoLabel><Input type="tel" disabled={locks['sellers']} value={formData.owner_phone} onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })} placeholder="e.g., +52 755 987 6543" className="mt-1" /><p className="text-xs text-cyan-700 mt-1">Receive maintenance quotes and updates</p></div>
                </div>}
              </div>

              {/* ── SECTION 8: Recurring Costs ── purple */}
              <div id="section-recurring" className="rounded-xl overflow-hidden border border-purple-200 mb-4">
                <button type="button" onClick={() => toggleSection('recurring')} className="w-full bg-purple-600 px-5 py-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">Recurring Costs</h3>
                  {(() => {const n = (formData.recurring_costs||[]).length;const t = n||1;return <><span className="text-xs text-white/80 mr-1">{n} costs</span><div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2"><div className="h-full bg-white transition-all rounded-full" style={{ width: `${n>0?100:0}%` }} /></div></>;})()}
                  <SectionLockButton sectionKey="recurring" locks={locks} toggle={toggleLock} isComplete={isRecurringComplete} />
                  {collapsedSections['recurring'] ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
                </button>
                {!collapsedSections['recurring'] && <div className="bg-purple-50 p-5 space-y-3">
                  {locks['recurring'] && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5"><span>🔒 Section locked — unlock to edit.</span></div>}
                  <p className="text-sm text-purple-800">Track periodic payments: docking fees, insurance, crew salaries, permits, etc.</p>
                  {formData.recurring_costs && formData.recurring_costs.length > 0 &&
                  <div className="space-y-2">
                      {formData.recurring_costs.map((cost, index) =>
                    <div key={index} className="p-3 bg-white rounded-lg border-2 border-purple-300">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-4 w-4 mt-1 flex-shrink-0 text-purple-600" />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-slate-800">{cost.name}</p>
                                  <div className="flex gap-2 mt-1 flex-wrap">
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded capitalize">{cost.category}</span>
                                    <span className="text-xs bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-medium">Every {cost.frequency_months} month{cost.frequency_months > 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeRecurringCost(index)} className="text-red-600 hover:text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                              <p className="text-green-700 font-bold text-sm">${cost.amount.toLocaleString()} MXN</p>
                              {cost.next_payment_date && <p className="text-xs text-slate-600 mt-1">Next payment: {format(parseISO(cost.next_payment_date), 'MMM d, yyyy')}</p>}
                              {cost.notes && <p className="text-xs text-slate-600 bg-purple-50 p-2 rounded mt-2">{cost.notes}</p>}
                            </div>
                          </div>
                        </div>
                    )}
                    </div>
                  }
                  <div className="bg-white p-4 rounded-lg border border-purple-200 space-y-3">
                    <p className="font-semibold text-sm text-purple-800">Add Recurring Cost</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div><Label className="text-xs">Cost Name *</Label><Input value={newRecurringCost.name} onChange={(e) => setNewRecurringCost({ ...newRecurringCost, name: e.target.value })} placeholder="e.g., Docking Fee" className="text-sm" /></div>
                      <div><Label className="text-xs">Amount (MXN) *</Label><Input type="number" min="0" value={newRecurringCost.amount} onChange={(e) => setNewRecurringCost({ ...newRecurringCost, amount: parseFloat(e.target.value) || 0 })} className="text-sm" /></div>
                      <div><Label className="text-xs">Category</Label><Select value={newRecurringCost.category} onValueChange={(value) => setNewRecurringCost({ ...newRecurringCost, category: value })}><SelectTrigger className="text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="docking">Docking</SelectItem><SelectItem value="insurance">Insurance</SelectItem><SelectItem value="crew">Crew Salary</SelectItem><SelectItem value="permits">Permits &amp; Licenses</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                      <div><Label className="text-xs">Frequency</Label><Select value={newRecurringCost.frequency_months.toString()} onValueChange={(value) => setNewRecurringCost({ ...newRecurringCost, frequency_months: parseInt(value) })}><SelectTrigger className="text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Monthly</SelectItem><SelectItem value="3">Every 3 months</SelectItem><SelectItem value="6">Every 6 months</SelectItem><SelectItem value="9">Every 9 months</SelectItem><SelectItem value="12">Yearly</SelectItem></SelectContent></Select></div>
                      <div><Label className="text-xs">Next Payment Date</Label><Input type="date" value={newRecurringCost.next_payment_date} onChange={(e) => setNewRecurringCost({ ...newRecurringCost, next_payment_date: e.target.value })} className="text-sm" /></div>
                      <div><Label className="text-xs">Notes (optional)</Label><Input value={newRecurringCost.notes} onChange={(e) => setNewRecurringCost({ ...newRecurringCost, notes: e.target.value })} placeholder="Additional info" className="text-sm" /></div>
                    </div>
                    <Button type="button" onClick={addRecurringCost} disabled={!newRecurringCost.name || !newRecurringCost.amount} variant="outline" size="sm" className="w-full border-purple-400 text-purple-700 hover:bg-purple-50"><Plus className="h-4 w-4 mr-2" />Add Recurring Cost</Button>
                  </div>
                </div>}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading}>{uploading ? 'Uploading Image...' : editingBoat ? 'Update Boat' : 'Create Boat'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boats.filter((boat) => {
          if (!boat.image) return false;
          if (restrictToBoat && boat.name !== restrictToBoat) return false;
          if (operatorFilter && operatorFilter !== 'all') {
            const bOp = (boat.operator || '').toLowerCase();
            const fOp = operatorFilter.toLowerCase();
            const match = fOp === 'filu' ? (!bOp || bOp === 'filu') : bOp === fOp;
            if (!match) return false;
          }
          return true;
        }).map((boat) => {
          const stats = getBoatStats(boat.name, boat.id);
          const actualCurrentHours = (boat.current_hours || 0) + stats.totalEngineHoursFromBookings + stats.personalTripsEngineHours;
          const hoursSinceLastMaintenance = actualCurrentHours - (boat.last_maintenance_hours || 0);
          const hoursUntilMaintenance = Math.max(0, (boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100) - actualCurrentHours);
          const maintenanceDue = hoursUntilMaintenance <= 10 && hoursUntilMaintenance > 0;
          const maintenanceOverdue = hoursUntilMaintenance <= 0;
          const needsMaintenance = boat.status === 'maintenance' || maintenanceOverdue || maintenanceDue;
          const isExpanded = expandedBoats[boat.id];
          const isRentalMode = boat.boat_mode === 'rental_and_maintenance';

          return (
            <Card key={boat.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative">
              <img src={boat.image} alt={boat.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge className="bg-white/90 text-slate-800">{boat.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}</Badge>
                <Badge className={isRentalMode ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'}>{isRentalMode ? 'Rental + Maintenance' : 'Maintenance Only'}</Badge>
              </div>
              {maintenanceOverdue && <Badge className="absolute top-2 left-2 bg-red-600 text-white animate-pulse">Maintenance OVERDUE</Badge>}
              {!maintenanceOverdue && maintenanceDue && <Badge className="absolute top-2 left-2 bg-amber-500 text-white">Maintenance Due Soon</Badge>}
            </div>
            <CardContent className="p-4">
              <div className="mb-2">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{boat.name}</h3>
                    <p className="text-xs text-slate-600">{boat.type} • {boat.size}</p>
                    {boat.operator && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-medium">{boat.operator}</span>}
                  </div>
                  <Badge className={boat.status === 'active' ? 'bg-emerald-100 text-emerald-800' : boat.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}>{boat.status}</Badge>
                </div>
                <div className="mt-2 p-2 bg-slate-50 rounded-lg border">
                  <p className="text-xs text-slate-600 mb-1.5 font-medium">Boat Mode</p>
                  <div className="flex gap-2">
                    <button onClick={async () => await updateMutation.mutateAsync({ id: boat.id, data: { ...boat, boat_mode: 'rental_and_maintenance' } })} className={`flex-1 px-2 py-1.5 text-xs rounded-md font-medium transition-all ${isRentalMode ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Rental + Maintenance</button>
                    <button onClick={async () => await updateMutation.mutateAsync({ id: boat.id, data: { ...boat, boat_mode: 'maintenance_only' } })} className={`flex-1 px-2 py-1.5 text-xs rounded-md font-medium transition-all ${!isRentalMode ? 'bg-slate-600 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Maintenance Only</button>
                  </div>
                </div>
                {boat.description && <p className="text-xs text-slate-600 line-clamp-2 mt-2">{boat.description}</p>}
              </div>

              <MaintenanceAlerts
                  boat={boat}
                  actualCurrentHours={actualCurrentHours}
                  onEditSection={(sectionId) => handleEditAndScroll(boat, sectionId)} />

              <MaintenanceLogView boat={boat} />

              {boat.current_hours >= 0 &&
                <div className="mt-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEngineHoursExpanded(prev => ({ ...prev, [boat.id]: !prev[boat.id] }))}
                    className="w-full flex items-center justify-between gap-2 mb-2 group"
                  >
                    <h4 className="font-semibold text-xs text-slate-700 flex items-center gap-2"><Gauge className="h-3 w-3" />Engine Hours</h4>
                    {engineHoursExpanded[boat.id] ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                  </button>
                  {engineHoursExpanded[boat.id] && (
                    <>
                      {maintenanceOverdue && <div className="p-2 bg-red-50 border border-red-300 rounded-lg mb-2"><p className="text-xs font-bold text-red-800">⚠️ OVERDUE</p></div>}
                      {!maintenanceOverdue && maintenanceDue && <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg mb-2"><p className="text-xs font-bold text-amber-800">🔔 DUE SOON</p></div>}
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                          <div className="bg-slate-50 p-1.5 rounded"><p className="text-slate-500" style={{ fontSize: '10px' }}>Base</p><p className="font-bold text-sm">{boat.current_hours}</p></div>
                          {isRentalMode && <div className="bg-blue-50 p-1.5 rounded border border-blue-200"><p className="text-blue-600" style={{ fontSize: '10px' }}>+ Bookings</p><p className="font-bold text-sm text-blue-700">{stats.totalEngineHoursFromBookings.toFixed(1)}</p></div>}
                          <div className={`p-1.5 rounded border ${isRentalMode ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}><p className={isRentalMode ? "text-green-600" : "text-blue-600"} style={{ fontSize: '10px' }}>+ Personal</p><p className={`font-bold text-sm ${isRentalMode ? 'text-green-700' : 'text-blue-700'}`}>{stats.personalTripsEngineHours.toFixed(1)}</p></div>
                        </div>
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg border-2 border-indigo-300 shadow-md"><p className="text-white text-center" style={{ fontSize: '10px' }}>Total Hours</p><p className="font-bold text-xl text-white text-center">{actualCurrentHours.toFixed(1)}</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5 text-xs">
                        <div className="bg-slate-50 p-1.5 rounded text-center"><p className="text-slate-500" style={{ fontSize: '10px' }}>Since Service</p><p className="font-bold text-sm">{hoursSinceLastMaintenance.toFixed(1)}</p></div>
                        <div className={`p-1.5 rounded text-center ${maintenanceOverdue ? 'bg-red-100 border border-red-400' : maintenanceDue ? 'bg-amber-100 border border-amber-400' : 'bg-green-50'}`}><p className="text-slate-500" style={{ fontSize: '10px' }}>Until Service</p><p className={`font-bold text-sm ${maintenanceOverdue ? 'text-red-700' : maintenanceDue ? 'text-amber-700' : 'text-green-600'}`}>{hoursUntilMaintenance.toFixed(1)}</p></div>
                      </div>
                    </>
                  )}
                </div>
                }

              {/* Trip History - collapsible */}
              <div className="mt-3 pt-3 border-t">
                <button
                    type="button"
                    onClick={() => setTripHistoryExpanded((prev) => ({ ...prev, [boat.id]: !prev[boat.id] }))}
                    className="w-full flex items-center justify-between gap-2 mb-2 group">

                  <h4 className="font-semibold text-xs text-slate-700 flex items-center gap-1.5"><MapPin className="h-3 w-3" />Trip History</h4>
                  {tripHistoryExpanded[boat.id] ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                </button>

                {tripHistoryExpanded[boat.id] &&
                  <>
                    <div className="flex items-center justify-end gap-1.5 mb-2">
                      <Button variant="outline" size="sm" onClick={() => {setSelectedBoatForTrips(boat);setPersonalTripDialogOpen(true);}} className="h-6 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"><Plus className="h-3 w-3 mr-1" />Log</Button>
                      <Select value={tripHistoryFilter} onValueChange={setTripHistoryFilter}><SelectTrigger className="w-20 h-6 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="rental">Rental</SelectItem><SelectItem value="personal">Personal</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
                      {(() => {
                        const boatBookings = bookings.filter((b) => b.boat_name === boat.name && b.status !== 'cancelled');
                        const boatPersonalTrips = personalTrips.filter((t) => t.boat_id === boat.id);
                        const allTrips = [
                        ...boatBookings.map((b) => {
                          const expense = expenses.find((e) => e.booking_id === b.id);
                          const totalExpenses = expense ? (expense.fuel_cost || 0) + (expense.crew_cost || 0) + (expense.maintenance_cost || 0) + (expense.cleaning_cost || 0) + (expense.supplies_cost || 0) + (expense.other_cost || 0) : 0;
                          const revenue = b.total_price || 0;
                          const profit = revenue - totalExpenses;
                          const roi = revenue > 0 ? profit / revenue * 100 : 0;
                          return { type: 'rental', date: b.date, title: b.experience_type?.replace(/_/g, ' ') || 'Booking', guests: b.guests, hours: b.engine_hours_used || 0, code: b.confirmation_code, revenue, expenses: totalExpenses, profit, roi };
                        }),
                        ...boatPersonalTrips.map((t) => {
                          const totalCost = (t.fuel_quantity || 0) * (t.fuel_price_per_unit || 0) + (t.additional_expenses || 0) + (t.supplies_used?.reduce((sum, s) => sum + (s.price || 0), 0) || 0);
                          return { type: 'personal', date: t.trip_date, title: t.destination || 'Personal Trip', guests: t.guests, hours: t.engine_hours_used || 0, notes: t.notes, expenses: totalCost, revenue: 0, profit: -totalCost, roi: 0 };
                        })].
                        sort((a, b) => new Date(b.date) - new Date(a.date));
                        const filteredTrips = allTrips.filter((trip) => tripHistoryFilter === 'all' || trip.type === tripHistoryFilter);
                        if (filteredTrips.length === 0) return <div className="text-center py-4 text-slate-500 text-xs">No trips yet</div>;
                        return filteredTrips.map((trip, idx) => <TripHistoryCard key={idx} trip={trip} />);
                      })()}
                    </div>
                  </>
                  }
              </div>

              <Button variant="ghost" size="sm" onClick={() => setExpandedBoats((prev) => ({ ...prev, [boat.id]: !prev[boat.id] }))} className="w-full mt-2 h-8">{isExpanded ? <><ChevronUp className="h-3 w-3 mr-1" /><span className="text-xs">Hide Equipment, Expeditions & Statistics</span></> : <><ChevronDown className="h-3 w-3 mr-1" /><span className="text-xs">Show Equipment, Expeditions & Statistics</span></>}</Button>

              {isExpanded && isRentalMode &&
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Equipment</h4>
                  <div className="flex flex-wrap gap-1">
                    {boat.equipment && Object.entries(boat.equipment).filter(([_, v]) => v).map(([key]) => <span key={key} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded capitalize">{key.replace(/_/g, ' ')}</span>)}
                    {boat.custom_equipment && boat.custom_equipment.map((eq, idx) => <span key={idx} className="text-xs px-2 py-1 bg-cyan-50 text-cyan-700 rounded capitalize">{eq}</span>)}
                  </div>
                </div>
                }

              {isExpanded && isRentalMode && boat.available_expeditions && boat.available_expeditions.length > 0 &&
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Available Expeditions</h4>
                  <div className="flex flex-wrap gap-1">
                    {boat.available_expeditions.map((exp) => <span key={exp} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">{exp.replace(/_/g, ' ')}</span>)}
                  </div>
                </div>
                }

              {isExpanded && boat.maintenance_records && boat.maintenance_records.length > 0 &&
                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2"><Wrench className="h-4 w-4" />Maintenance History ({boat.maintenance_records.length} records)</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {boat.maintenance_records.sort((a, b) => new Date(b.date) - new Date(a.date)).map((record, idx) =>
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border text-xs">
                        <div className="flex items-start justify-between mb-2">
                          <div><p className="font-semibold text-slate-800">{format(parseISO(record.date), 'MMM d, yyyy')}</p><Badge className={record.service_type === 'major' ? 'bg-purple-100 text-purple-800 text-xs' : record.service_type === 'minor' ? 'bg-blue-100 text-blue-800 text-xs' : record.service_type === 'repair' ? 'bg-red-100 text-red-800 text-xs' : 'bg-slate-100 text-slate-800 text-xs'}>{record.service_type}</Badge></div>
                          <p className="font-bold text-green-700">${record.cost?.toLocaleString()} MXN</p>
                        </div>
                        <p className="text-slate-600 mb-1"><strong>Engine Hours:</strong> {record.engine_hours} hrs</p>
                        {record.work_performed && <p className="text-slate-600 mb-1"><strong>Work:</strong> {record.work_performed}</p>}
                        {record.mechanic_name && <p className="text-slate-600"><strong>Mechanic:</strong> {record.mechanic_name}{record.mechanic_phone && ` (${record.mechanic_phone})`}</p>}
                        {record.notes && <p className="text-slate-500 mt-1 italic">{record.notes}</p>}
                      </div>
                    )}
                  </div>
                </div>
                }

              {isExpanded && isRentalMode &&
                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 mb-3">Booking Statistics</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg border border-emerald-400"><p className="text-white text-xs font-medium mb-1">Revenue</p><p className="font-bold text-xl text-white">${(stats.revenue / 1000).toFixed(1)}k</p></div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg border border-blue-400"><p className="text-white text-xs font-medium mb-1">Profit</p><p className="font-bold text-xl text-white">${(stats.profit / 1000).toFixed(1)}k</p></div>
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg border border-purple-400"><p className="text-white text-xs font-medium mb-1">Avg ROI</p><p className="font-bold text-xl text-white">{stats.roi}%</p></div>
                  </div>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg"><p className="text-xs text-amber-800"><span className="font-semibold">Note:</span> FILU charges 15% of the total booking price set by the owner.</p></div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-slate-500 text-xs">Total Bookings</p><p className="font-semibold text-lg">{stats.total}</p></div>
                    <div><p className="text-slate-500 text-xs">Future / Past</p><p className="font-semibold text-lg">{stats.future} / {stats.past}</p></div>
                  </div>
                  <div className="pt-2"><p className="text-slate-500 text-xs">Most Frequent Trip</p><p className="font-medium text-sm capitalize">{stats.frequentTrip} ({stats.frequentTripCount}x)</p></div>
                  {stats.lastTrip && <div className="pt-3 border-t"><p className="text-slate-500 text-xs mb-2">Last Completed Trip</p><div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm"><p className="font-medium capitalize">{stats.lastTrip.experience_type?.replace(/_/g, ' ')}</p><p className="text-xs text-slate-600">{format(parseISO(stats.lastTrip.date), 'MMM d, yyyy')} • {stats.lastTrip.guests} guests</p></div></div>}
                  {boat.last_service_date && <div className="pt-2"><p className="text-slate-500 text-xs mb-1">Last Service</p><div className="bg-blue-50 p-2 rounded text-xs"><p className="font-medium">{format(parseISO(boat.last_service_date), 'MMM d, yyyy')}</p>{boat.last_service_mechanic_phone && <p className="text-slate-600 mt-1">Mechanic: {boat.last_service_mechanic_phone}</p>}</div></div>}
                  {boat.mechanic_name && <div className="pt-2"><p className="text-slate-500 text-xs mb-1">Mechanic</p><div className="bg-slate-50 p-2 rounded text-xs space-y-1"><p className="font-medium">{boat.mechanic_name}</p>{boat.mechanic_phone && <p className="text-slate-600">📞 {boat.mechanic_phone}</p>}{boat.mechanic_email && <p className="text-slate-600">✉️ {boat.mechanic_email}</p>}</div></div>}
                  {needsMaintenance && <div className="pt-2"><Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Action Needed: Schedule Maintenance</Badge></div>}
                </div>
                }
            </CardContent>
            <div className="flex gap-2 px-4 pb-3">
              <Button variant="outline" size="sm" onClick={() => handleEdit(boat)} className="flex-1 h-8 text-xs"><Edit className="h-3 w-3 mr-1" />{readOnlyMode ? 'View / Fill Maintenance' : 'Manage Vessel'}</Button>
              {!readOnlyMode && <Button variant="destructive" size="sm" onClick={() => {if (window.confirm(`Delete ${boat.name}? This cannot be undone.`)) deleteMutation.mutate(boat.id);}} className="h-8"><Trash2 className="h-3 w-3" /></Button>}
            </div>
          </Card>);

        })}
      </div>
      
      {selectedBoatForTrips &&
      <PersonalTripDialog boat={selectedBoatForTrips} open={personalTripDialogOpen} onOpenChange={(open) => {setPersonalTripDialogOpen(open);if (!open) setSelectedBoatForTrips(null);}} />
      }
    </div>);

}