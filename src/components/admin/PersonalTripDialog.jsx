import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar, Fuel, Package, Gauge, Navigation, Clock, Users, MapPin, CheckCircle } from 'lucide-react';
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
  supplies_used: [],
  additional_expenses: '',
  additional_expenses_notes: '',
  guests: 1,
  destination: '',
  notes: ''
};

export default function PersonalTripDialog({ boat, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [newTrip, setNewTrip] = useState({ ...EMPTY_TRIP });
  const [newSupply, setNewSupply] = useState({ name: '', quantity: 0, price: 0 });
  const [saved, setSaved] = useState(false);

  const { data: trips = [] } = useQuery({
    queryKey: ['personal-trips', boat.id],
    queryFn: async () => {
      const allTrips = await base44.entities.PersonalTrip.list();
      return allTrips.filter(t => t.boat_id === boat.id).sort((a, b) => new Date(b.trip_date) - new Date(a.trip_date));
    },
    enabled: open
  });

  // Also fetch all personal trips for this boat to calculate total hours offset
  const { data: allPersonalTrips = [] } = useQuery({
    queryKey: ['personal-trips'],
    queryFn: () => base44.entities.PersonalTrip.list('-trip_date')
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const trip = await base44.entities.PersonalTrip.create(data);
      // Auto-update boat's current_hours by adding the engine hours delta
      // We do this by recalculating total personal trip hours from scratch
      const boatPersonalTrips = allPersonalTrips.filter(t => t.boat_id === boat.id);
      const previousPersonalHours = boatPersonalTrips.reduce((sum, t) => sum + (t.engine_hours_used || 0), 0);
      const newTotalPersonalHours = previousPersonalHours + (data.engine_hours_used || 0);
      // current_hours on the boat is the BASE meter reading. We track incremental personal hours separately.
      // But we still want the boat card to reflect reality — so we don't overwrite current_hours here.
      // The MechanicPortal and BoatManagement already compute: base + bookings + personal trips dynamically.
      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-trips'] });
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      setSaved(true);
      setNewTrip({ ...EMPTY_TRIP });
      setNewSupply({ name: '', quantity: 0, price: 0 });
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalTrip.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-trips'] });
      queryClient.invalidateQueries({ queryKey: ['boats'] });
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
      boat_id: boat.id,
      boat_name: boat.name
    });
  };

  const totalEngineHours = trips.reduce((sum, t) => sum + (t.engine_hours_used || 0), 0);
  const totalDistanceKm = trips.reduce((sum, t) => sum + (t.distance_km || 0), 0);
  const totalFuelCost = trips.reduce((sum, t) => sum + ((t.fuel_quantity || 0) * (t.fuel_price_per_unit || 0)), 0);
  const totalFuelQty = trips.reduce((sum, t) => sum + (t.fuel_quantity || 0), 0);
  const totalAdditionalExpenses = trips.reduce((sum, t) => sum + (t.additional_expenses || 0), 0);

  const boatSupplies = boat?.supplies_inventory || [];

  const addSupplyToTrip = () => {
    if (!newSupply.name || !newSupply.quantity) return;
    setNewTrip({ ...newTrip, supplies_used: [...(newTrip.supplies_used || []), { ...newSupply }] });
    setNewSupply({ name: '', quantity: 0, price: 0 });
  };

  const removeSupplyFromTrip = (index) => {
    setNewTrip({ ...newTrip, supplies_used: newTrip.supplies_used.filter((_, i) => i !== index) });
  };

  const fuelCostPreview = (parseFloat(newTrip.fuel_quantity) || 0) * (parseFloat(newTrip.fuel_price_per_unit) || 0);

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
                <CheckCircle className="h-4 w-4" /> Trip saved! Engine hours updated across the portal.
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Row 1 */}
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

              {/* Row 2 */}
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

            {/* Fuel */}
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
                <p className="text-xs text-orange-600 mt-1.5 font-medium">
                  Fuel cost: ${fuelCostPreview.toFixed(2)}
                </p>
              )}
            </div>

            {/* Supplies */}
            <div className="mt-3 border-t pt-3">
              <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Package className="h-3 w-3" /> Supplies Used
              </h4>
              {newTrip.supplies_used && newTrip.supplies_used.length > 0 && (
                <div className="space-y-1 mb-2">
                  {newTrip.supplies_used.map((supply, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-2 py-1 rounded border text-xs">
                      <span>{supply.name} (x{supply.quantity}) — ${((supply.quantity || 0) * (supply.price || 0)).toFixed(2)}</span>
                      <button type="button" onClick={() => removeSupplyFromTrip(idx)} className="text-red-500 hover:text-red-700 ml-2">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {boatSupplies.length > 0 ? (
                  <Select onValueChange={(value) => {
                    const selected = boatSupplies.find(s => s.name === value);
                    if (selected) setNewSupply({ name: value, quantity: 1, price: selected.price_per_unit || 0 });
                  }}>
                    <SelectTrigger className="text-xs h-8 flex-1"><SelectValue placeholder="Quick-select from inventory" /></SelectTrigger>
                    <SelectContent>
                      {boatSupplies.map((s, idx) => <SelectItem key={idx} value={s.name}>{s.name}{s.price_per_unit ? ` ($${s.price_per_unit})` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={newSupply.name} onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })} placeholder="Supply name" className="text-xs h-8 flex-1" />
                )}
                <Input type="number" min="1" value={newSupply.quantity} onChange={(e) => setNewSupply({ ...newSupply, quantity: parseInt(e.target.value) || 0 })} placeholder="Qty" className="text-xs h-8 w-16" />
                <Input type="number" min="0" step="0.01" value={newSupply.price} onChange={(e) => setNewSupply({ ...newSupply, price: parseFloat(e.target.value) || 0 })} placeholder="$/unit" className="text-xs h-8 w-20" />
                <Button type="button" size="sm" variant="outline" onClick={addSupplyToTrip} disabled={!newSupply.name || !newSupply.quantity} className="h-8 text-xs">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Additional expenses */}
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

            {/* Notes */}
            <div className="mt-3">
              <Label className="text-xs">Notes</Label>
              <Textarea value={newTrip.notes} onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })} placeholder="Trip conditions, observations…" className="text-sm mt-1" rows={2} />
            </div>

            {/* Maintenance Checklist (Outboard) */}
            {boat?.engine_config === 'outboard' && (
              <div className="mt-3 border-t pt-3">
                <h4 className="text-xs font-semibold text-slate-600 mb-2">Per-Trip Checks (Outboard)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {[
                    'Engine freshwater flush (saltwater)',
                    'Visual inspection (fuel lines, leaks)',
                    'Battery voltage check',
                    'Bilge pump test',
                    'Navigation lights test',
                    'Propeller visual inspection'
                  ].map((item) => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer text-xs py-1 px-2 rounded hover:bg-white">
                      <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600" />
                      <span className="text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {boat?.engine_config === 'inboard' && (
              <div className="mt-3 border-t pt-3">
                <h4 className="text-xs font-semibold text-slate-600 mb-2">Per-Trip Checks (Inboard)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {[
                    'Engine room visual inspection',
                    'Fluid levels (oil, coolant, transmission)',
                    'Bilge inspection',
                    'Generator test run',
                    'Seawater strainer check',
                    'Shore power connection inspection'
                  ].map((item) => (
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
              <h3 className="font-semibold text-sm text-slate-700 mb-2">Trip History ({trips.length})</h3>
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {trips.map((trip) => {
                  const fuelCost = (trip.fuel_quantity || 0) * (trip.fuel_price_per_unit || 0);
                  const suppliesCost = (trip.supplies_used || []).reduce((s, x) => s + (x.quantity || 0) * (x.price || 0), 0);
                  const totalCost = fuelCost + suppliesCost + (trip.additional_expenses || 0);
                  return (
                    <div key={trip.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">
                              {format(parseISO(trip.trip_date), 'MMM d, yyyy')}
                            </span>
                            {trip.destination && (
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <MapPin className="h-2.5 w-2.5" />{trip.destination}
                              </span>
                            )}
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
                          <button
                            onClick={() => { if (window.confirm('Delete this trip?')) deleteMutation.mutate(trip.id); }}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {trip.fuel_quantity > 0 && (
                        <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded text-orange-700">
                          <Fuel className="h-3 w-3" />
                          <span>{trip.fuel_quantity} {trip.fuel_unit} @ ${trip.fuel_price_per_unit}/{trip.fuel_unit?.slice(0, -1) || 'unit'} = <strong>${fuelCost.toFixed(2)}</strong></span>
                        </div>
                      )}
                      {trip.supplies_used && trip.supplies_used.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trip.supplies_used.map((s, i) => (
                            <span key={i} className="bg-slate-100 px-2 py-0.5 rounded">{s.name} (x{s.quantity})</span>
                          ))}
                        </div>
                      )}
                      {trip.additional_expenses > 0 && (
                        <div className="mt-1 bg-emerald-50 px-2 py-1 rounded text-emerald-700">
                          Other: <strong>${trip.additional_expenses.toFixed(2)}</strong>
                          {trip.additional_expenses_notes && <span className="text-slate-500"> — {trip.additional_expenses_notes}</span>}
                        </div>
                      )}
                      {trip.notes && <p className="text-slate-400 mt-1 italic">{trip.notes}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}