import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar, Fuel, Package, Gauge, Navigation, Clock, Users, MapPin, CheckCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

const EMPTY_TRIP = {
  trip_date: '',
  duration_hours: '',
  engine_hours_used: '',
  distance_km: '',
  fuel_quantity: '',
  fuel_unit: 'gallons',
  fuel_price_per_unit: '',
  additional_expenses: '',
  additional_expenses_notes: '',
  guests: 1,
  destination: '',
  notes: ''
};

export default function PersonalTripDialog({ boat, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [newTrip, setNewTrip] = useState({ ...EMPTY_TRIP });
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Supply deductions: array of { supplyIndex, amountUsed }
  const [supplyDeductions, setSupplyDeductions] = useState([]);

  // Fetch current boat data (fresh, to get latest supplies_inventory)
  const { data: boatData } = useQuery({
    queryKey: ['boat-detail', boat.id],
    queryFn: async () => {
      const boats = await base44.entities.BoatInventory.list();
      return boats.find(b => b.id === boat.id) || boat;
    },
    enabled: open,
    initialData: boat
  });

  const supplies = (boatData?.supplies_inventory || []);

  const { data: trips = [] } = useQuery({
    queryKey: ['personal-trips', boat.id],
    queryFn: async () => {
      const allTrips = await base44.entities.PersonalTrip.list();
      return allTrips.filter(t => t.boat_id === boat.id).sort((a, b) => new Date(b.trip_date) - new Date(a.trip_date));
    },
    enabled: open
  });

  // Reset deductions when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSupplyDeductions([]);
      setNewTrip({ ...EMPTY_TRIP });
      setSaved(false);
    }
  }, [open]);

  const updateBoatMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BoatInventory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      queryClient.invalidateQueries({ queryKey: ['boat-detail', boat.id] });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (tripData) => {
      // 1. Save the trip
      const trip = await base44.entities.PersonalTrip.create(tripData);

      // 2. Apply supply deductions to boat inventory
      if (supplyDeductions.length > 0) {
        const updatedSupplies = supplies.map((supply, idx) => {
          const deduction = supplyDeductions.find(d => d.supplyIndex === idx);
          if (!deduction || !deduction.amountUsed) return supply;

          const amountUsed = parseFloat(deduction.amountUsed) || 0;
          if (amountUsed <= 0) return supply;

          const newQty = Math.max(0, (supply.quantity || 0) - amountUsed);
          const usageLog = supply.usage_log || [];

          return {
            ...supply,
            // Store original_quantity on first deduction if not set
            original_quantity: supply.original_quantity ?? supply.quantity,
            quantity: newQty,
            status: newQty <= 0 ? 'needed' : supply.status,
            usage_log: [
              ...usageLog,
              {
                date: new Date().toISOString().split('T')[0],
                amount_used: amountUsed,
                trip_date: tripData.trip_date,
                destination: tripData.destination || '',
                note: `Used during trip on ${tripData.trip_date}`
              }
            ]
          };
        });

        await updateBoatMutation.mutateAsync({
          id: boat.id,
          data: { ...boatData, supplies_inventory: updatedSupplies }
        });
      }

      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-trips'] });
      queryClient.invalidateQueries({ queryKey: ['personal-trips', boat.id] });
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      setSaved(true);
      setNewTrip({ ...EMPTY_TRIP });
      setSupplyDeductions([]);
      setTimeout(() => setSaved(false), 4000);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalTrip.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-trips'] });
      queryClient.invalidateQueries({ queryKey: ['personal-trips', boat.id] });
    }
  });

  const handleAddTrip = () => {
    if (!newTrip.trip_date || !newTrip.engine_hours_used) return;
    createMutation.mutate({
      ...newTrip,
      duration_hours: parseFloat(newTrip.duration_hours) || 0,
      engine_hours_used: parseFloat(newTrip.engine_hours_used) || 0,
      distance_km: parseFloat(newTrip.distance_km) || 0,
      fuel_quantity: parseFloat(newTrip.fuel_quantity) || 0,
      fuel_price_per_unit: parseFloat(newTrip.fuel_price_per_unit) || 0,
      additional_expenses: parseFloat(newTrip.additional_expenses) || 0,
      // Store supply usage snapshot on the trip record too
      supplies_used: supplyDeductions
        .filter(d => d.supplyIndex >= 0 && parseFloat(d.amountUsed) > 0)
        .map(d => ({
          name: supplies[d.supplyIndex]?.name || '',
          quantity: parseFloat(d.amountUsed) || 0,
          unit: supplies[d.supplyIndex]?.unit || '',
          price: (supplies[d.supplyIndex]?.price_per_unit || 0) * (parseFloat(d.amountUsed) || 0)
        })),
      boat_id: boat.id,
      boat_name: boat.name
    });
  };

  const setDeduction = (supplyIndex, amountUsed) => {
    setSupplyDeductions(prev => {
      const existing = prev.find(d => d.supplyIndex === supplyIndex);
      if (existing) {
        return prev.map(d => d.supplyIndex === supplyIndex ? { ...d, amountUsed } : d);
      }
      return [...prev, { supplyIndex, amountUsed }];
    });
  };

  const removeDeduction = (supplyIndex) => {
    setSupplyDeductions(prev => prev.filter(d => d.supplyIndex !== supplyIndex));
  };

  const totalEngineHours = trips.reduce((sum, t) => sum + (t.engine_hours_used || 0), 0);
  const totalDistanceKm = trips.reduce((sum, t) => sum + (t.distance_km || 0), 0);
  const totalFuelCost = trips.reduce((sum, t) => sum + ((t.fuel_quantity || 0) * (t.fuel_price_per_unit || 0)), 0);
  const totalAdditionalExpenses = trips.reduce((sum, t) => sum + (t.additional_expenses || 0), 0);
  const fuelCostPreview = (parseFloat(newTrip.fuel_quantity) || 0) * (parseFloat(newTrip.fuel_price_per_unit) || 0);

  const inStockSupplies = supplies.filter(s => s.status !== 'needed' && (s.quantity || 0) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Navigation className="h-5 w-5 text-blue-600" />
            Trip Log — {boat.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">

          {/* ── Summary Stats ── */}
          {trips.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { icon: Calendar, label: 'Trips', value: trips.length, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                { icon: Gauge, label: 'Eng Hrs', value: totalEngineHours.toFixed(1), color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { icon: Navigation, label: 'Km', value: totalDistanceKm > 0 ? totalDistanceKm.toFixed(0) : '—', color: 'bg-sky-50 text-sky-700 border-sky-200' },
                { icon: Fuel, label: 'Fuel $', value: `$${totalFuelCost.toFixed(0)}`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { icon: Package, label: 'Other $', value: `$${totalAdditionalExpenses.toFixed(0)}`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className={`rounded-lg border p-2.5 text-center ${color}`}>
                  <Icon className="h-3.5 w-3.5 mx-auto mb-1 opacity-70" />
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</p>
                  <p className="text-base font-bold">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Log New Trip Form ── */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              Log New Trip
            </h3>

            {saved && (
              <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700">
                <CheckCircle className="h-4 w-4" /> Trip saved! Engine hours &amp; supply inventory updated.
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Date *</Label>
                <Input type="date" value={newTrip.trip_date} onChange={(e) => setNewTrip({ ...newTrip, trip_date: e.target.value })} className="text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Gauge className="h-3 w-3 text-amber-600" /> Engine Hours *</Label>
                <Input type="number" min="0" step="0.1" value={newTrip.engine_hours_used} onChange={(e) => setNewTrip({ ...newTrip, engine_hours_used: e.target.value })} placeholder="e.g., 4.5" className="text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Duration (hrs)</Label>
                <Input type="number" min="0" step="0.5" value={newTrip.duration_hours} onChange={(e) => setNewTrip({ ...newTrip, duration_hours: e.target.value })} placeholder="e.g., 6" className="text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Navigation className="h-3 w-3 text-sky-600" /> Distance (km)</Label>
                <Input type="number" min="0" step="0.1" value={newTrip.distance_km} onChange={(e) => setNewTrip({ ...newTrip, distance_km: e.target.value })} placeholder="e.g., 35" className="text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Users className="h-3 w-3" /> Guests</Label>
                <Input type="number" min="1" value={newTrip.guests} onChange={(e) => setNewTrip({ ...newTrip, guests: parseInt(e.target.value) || 1 })} className="text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Destination</Label>
                <Input value={newTrip.destination} onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })} placeholder="e.g., Isla Ixtapa" className="text-sm mt-1" />
              </div>
            </div>

            {/* ── Fuel ── */}
            <div className="mt-3 border-t pt-3">
              <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Fuel className="h-3 w-3 text-orange-500" /> Fuel Consumption
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input type="number" min="0" step="0.1" value={newTrip.fuel_quantity} onChange={(e) => setNewTrip({ ...newTrip, fuel_quantity: e.target.value })} className="text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Select value={newTrip.fuel_unit} onValueChange={(v) => setNewTrip({ ...newTrip, fuel_unit: v })}>
                    <SelectTrigger className="text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gallons">Gallons</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Price/Unit ($)</Label>
                  <Input type="number" min="0" step="0.1" value={newTrip.fuel_price_per_unit} onChange={(e) => setNewTrip({ ...newTrip, fuel_price_per_unit: e.target.value })} className="text-sm mt-1" />
                </div>
              </div>
              {fuelCostPreview > 0 && (
                <p className="text-xs text-orange-600 mt-1.5 font-medium">Fuel cost: ${fuelCostPreview.toFixed(2)}</p>
              )}
            </div>

            {/* ── Supplies Used (from Vessel Inventory) ── */}
            <div className="mt-3 border-t pt-3">
              <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Package className="h-3 w-3 text-emerald-600" /> Supplies Used
                <span className="text-slate-400 font-normal">(deducted from vessel inventory)</span>
              </h4>

              {inStockSupplies.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No supplies in vessel inventory. Add them in Vessel Manager first.</p>
              ) : (
                <div className="space-y-2">
                  {inStockSupplies.map((supply) => {
                    const originalIndex = supplies.indexOf(supply);
                    const deduction = supplyDeductions.find(d => d.supplyIndex === originalIndex);
                    const amountUsed = parseFloat(deduction?.amountUsed) || 0;
                    const remaining = Math.max(0, (supply.quantity || 0) - amountUsed);
                    const isLow = remaining < (supply.quantity || 0) * 0.2 && amountUsed > 0;

                    return (
                      <div key={originalIndex} className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${deduction?.amountUsed ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800">{supply.name}</span>
                            {supply.category && <span className="text-slate-400">({supply.category})</span>}
                            <span className="text-slate-500">
                              Available: <strong>{supply.quantity} {supply.unit || 'units'}</strong>
                            </span>
                            {amountUsed > 0 && (
                              <span className={`flex items-center gap-0.5 font-medium ${isLow ? 'text-red-600' : 'text-amber-700'}`}>
                                {isLow && <AlertTriangle className="h-2.5 w-2.5" />}
                                → {remaining} {supply.unit || 'units'} remaining
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max={supply.quantity}
                            step="0.1"
                            placeholder="Used"
                            value={deduction?.amountUsed || ''}
                            onChange={(e) => {
                              if (e.target.value === '' || e.target.value === '0') {
                                removeDeduction(originalIndex);
                              } else {
                                setDeduction(originalIndex, e.target.value);
                              }
                            }}
                            className="w-20 h-7 text-xs text-center"
                          />
                          <span className="text-slate-400 text-xs">{supply.unit || 'units'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {supplyDeductions.filter(d => parseFloat(d.amountUsed) > 0).length > 0 && (
                <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Inventory will be updated automatically when you save this trip.
                </p>
              )}
            </div>

            {/* ── Additional expenses ── */}
            <div className="mt-3 border-t pt-3 grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Additional Expenses ($)</Label>
                <Input type="number" min="0" step="0.01" value={newTrip.additional_expenses} onChange={(e) => setNewTrip({ ...newTrip, additional_expenses: e.target.value })} placeholder="e.g., 250" className="text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input value={newTrip.additional_expenses_notes} onChange={(e) => setNewTrip({ ...newTrip, additional_expenses_notes: e.target.value })} placeholder="Snacks, ice, etc." className="text-sm mt-1" />
              </div>
            </div>

            {/* ── Notes ── */}
            <div className="mt-3">
              <Label className="text-xs">Notes</Label>
              <Textarea value={newTrip.notes} onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })} placeholder="Trip conditions, observations…" className="text-sm mt-1" rows={2} />
            </div>

            {/* Per-trip checks */}
            {(boat?.engine_config === 'outboard' || boat?.engine_config === 'inboard') && (
              <div className="mt-3 border-t pt-3">
                <h4 className="text-xs font-semibold text-slate-600 mb-2">Per-Trip Checks ({boat.engine_config})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {(boat.engine_config === 'outboard'
                    ? ['Engine freshwater flush (saltwater)', 'Visual inspection (fuel lines, leaks)', 'Battery voltage check', 'Bilge pump test', 'Navigation lights test', 'Propeller visual inspection']
                    : ['Engine room visual inspection', 'Fluid levels (oil, coolant, transmission)', 'Bilge inspection', 'Generator test run', 'Seawater strainer check', 'Shore power connection inspection']
                  ).map((item) => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer text-xs py-1 px-2 rounded hover:bg-white">
                      <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600" />
                      <span className="text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleAddTrip}
              disabled={!newTrip.trip_date || !newTrip.engine_hours_used || createMutation.isPending}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Saving…' : 'Save Trip'}
            </Button>
          </div>

          {/* ── Trip History ── */}
          {trips.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowHistory(h => !h)}
                className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 py-2"
              >
                <span>Trip History ({trips.length})</span>
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showHistory && (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {trips.map((trip) => {
                    const fuelCost = (trip.fuel_quantity || 0) * (trip.fuel_price_per_unit || 0);
                    const suppliesCost = (trip.supplies_used || []).reduce((s, x) => s + (x.price || 0), 0);
                    const totalCost = fuelCost + suppliesCost + (trip.additional_expenses || 0);
                    return (
                      <div key={trip.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800">{format(parseISO(trip.trip_date), 'MMM d, yyyy')}</span>
                              {trip.destination && <span className="flex items-center gap-0.5 text-slate-500"><MapPin className="h-2.5 w-2.5" />{trip.destination}</span>}
                            </div>
                            <div className="flex gap-3 flex-wrap mt-1 text-slate-600">
                              {trip.engine_hours_used > 0 && <span className="flex items-center gap-1"><Gauge className="h-2.5 w-2.5 text-amber-500" />{trip.engine_hours_used}h eng</span>}
                              {trip.duration_hours > 0 && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{trip.duration_hours}h trip</span>}
                              {trip.distance_km > 0 && <span className="flex items-center gap-1"><Navigation className="h-2.5 w-2.5 text-sky-500" />{trip.distance_km}km</span>}
                              {trip.guests > 0 && <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{trip.guests} guests</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {totalCost > 0 && <span className="font-bold text-red-600">${totalCost.toFixed(0)}</span>}
                            <button onClick={() => { if (window.confirm('Delete this trip?')) deleteMutation.mutate(trip.id); }} className="text-red-400 hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {trip.fuel_quantity > 0 && (
                          <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded text-orange-700 mt-1">
                            <Fuel className="h-3 w-3" />
                            <span>{trip.fuel_quantity} {trip.fuel_unit} @ ${trip.fuel_price_per_unit}/{trip.fuel_unit?.slice(0, -1) || 'unit'} = <strong>${fuelCost.toFixed(2)}</strong></span>
                          </div>
                        )}
                        {trip.supplies_used && trip.supplies_used.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {trip.supplies_used.map((s, i) => (
                              <span key={i} className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded">
                                {s.name}: {s.quantity} {s.unit || 'units'}
                              </span>
                            ))}
                          </div>
                        )}
                        {trip.additional_expenses > 0 && (
                          <div className="mt-1 bg-slate-50 px-2 py-1 rounded text-slate-600">
                            Other: <strong>${trip.additional_expenses.toFixed(2)}</strong>
                            {trip.additional_expenses_notes && <span className="text-slate-400"> — {trip.additional_expenses_notes}</span>}
                          </div>
                        )}
                        {trip.notes && <p className="text-slate-400 mt-1 italic">{trip.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}