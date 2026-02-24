import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar, Fuel, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

export default function PersonalTripDialog({ boat, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [newTrip, setNewTrip] = useState({
    trip_date: '',
    duration_hours: 0,
    engine_hours_used: 0,
    fuel_quantity: 0,
    fuel_unit: 'gallons',
    fuel_price_per_unit: 0,
    supplies_used: [],
    additional_expenses: 0,
    additional_expenses_notes: '',
    guests: 1,
    destination: '',
    notes: ''
  });
  const [newSupply, setNewSupply] = useState({ name: '', quantity: 0, price: 0 });
  const [maintenanceChecklist, setMaintenanceChecklist] = useState({
    // Outboard
    freshwater_flush: false,
    visual_inspection: false,
    battery_check: false,
    bilge_pump_test: false,
    navigation_lights_test: false,
    propeller_inspection: false,
    // Inboard
    engine_room_inspection: false,
    fluid_level_check: false,
    bilge_inspection: false,
    generator_test: false,
    seawater_strainer_check: false,
    shore_power_inspection: false
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['personal-trips', boat.id],
    queryFn: async () => {
      const allTrips = await base44.entities.PersonalTrip.list();
      return allTrips.filter(t => t.boat_id === boat.id).sort((a, b) => new Date(b.trip_date) - new Date(a.trip_date));
    },
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonalTrip.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-trips'] });
      setNewTrip({
        trip_date: '',
        duration_hours: 0,
        engine_hours_used: 0,
        fuel_quantity: 0,
        fuel_unit: 'gallons',
        fuel_price_per_unit: 0,
        supplies_used: [],
        additional_expenses: 0,
        additional_expenses_notes: '',
        guests: 1,
        destination: '',
        notes: ''
      });
      setNewSupply({ name: '', quantity: 0, price: 0 });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalTrip.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-trips'] });
    }
  });

  const handleAddTrip = () => {
    if (!newTrip.trip_date) return;
    createMutation.mutate({
      ...newTrip,
      boat_id: boat.id,
      boat_name: boat.name
    });
    // Reset maintenance checklist
    setMaintenanceChecklist({
      freshwater_flush: false,
      visual_inspection: false,
      battery_check: false,
      bilge_pump_test: false,
      navigation_lights_test: false,
      propeller_inspection: false,
      engine_room_inspection: false,
      fluid_level_check: false,
      bilge_inspection: false,
      generator_test: false,
      seawater_strainer_check: false,
      shore_power_inspection: false
    });
  };

  const totalEngineHours = trips.reduce((sum, t) => sum + (t.engine_hours_used || 0), 0);
  const totalFuelCost = trips.reduce((sum, t) => sum + ((t.fuel_quantity || 0) * (t.fuel_price_per_unit || 0)), 0);
  const totalSuppliesCost = trips.reduce((sum, t) => {
    const suppliesCost = (t.supplies_used || []).reduce((s, supply) => s + ((supply.quantity || 0) * (supply.price || 0)), 0);
    return sum + suppliesCost;
  }, 0);
  const totalAdditionalExpenses = trips.reduce((sum, t) => sum + (t.additional_expenses || 0), 0);

  const boatSupplies = boat?.supplies_inventory || [];

  const addSupplyToTrip = () => {
    if (!newSupply.name || !newSupply.quantity) return;
    setNewTrip({
      ...newTrip,
      supplies_used: [...(newTrip.supplies_used || []), { ...newSupply }]
    });
    setNewSupply({ name: '', quantity: 0, price: 0 });
  };

  const removeSupplyFromTrip = (index) => {
    setNewTrip({
      ...newTrip,
      supplies_used: newTrip.supplies_used.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personal Trips - {boat.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div>
                <p className="text-xs text-blue-700">Trips</p>
                <p className="text-lg font-bold text-blue-900">{trips.length}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Eng Hours</p>
                <p className="text-lg font-bold text-blue-900">{totalEngineHours.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Fuel</p>
                <p className="text-lg font-bold text-blue-900">${totalFuelCost.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Supplies</p>
                <p className="text-lg font-bold text-blue-900">${totalSuppliesCost.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Other</p>
                <p className="text-lg font-bold text-blue-900">${totalAdditionalExpenses.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Add New Trip Form */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Log New Trip</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Trip Date *</Label>
                <Input
                  type="date"
                  value={newTrip.trip_date}
                  onChange={(e) => setNewTrip({ ...newTrip, trip_date: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Duration (hours)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newTrip.duration_hours}
                  onChange={(e) => setNewTrip({ ...newTrip, duration_hours: parseFloat(e.target.value) || 0 })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Engine Hours Used *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newTrip.engine_hours_used}
                  onChange={(e) => setNewTrip({ ...newTrip, engine_hours_used: parseFloat(e.target.value) || 0 })}
                  className="text-sm"
                  placeholder="e.g., 4.5"
                />
              </div>
              <div>
                <Label className="text-xs">Guests</Label>
                <Input
                  type="number"
                  min="1"
                  value={newTrip.guests}
                  onChange={(e) => setNewTrip({ ...newTrip, guests: parseInt(e.target.value) || 1 })}
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Destination</Label>
                <Input
                  value={newTrip.destination}
                  onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                  placeholder="e.g., Isla Ixtapa"
                  className="text-sm"
                />
              </div>
              
              {/* Fuel Section */}
              <div className="col-span-2 border-t pt-3 mt-2">
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Fuel className="h-3 w-3" />
                  Fuel Consumption
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newTrip.fuel_quantity}
                      onChange={(e) => setNewTrip({ ...newTrip, fuel_quantity: parseFloat(e.target.value) || 0 })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Unit</Label>
                    <Select value={newTrip.fuel_unit} onValueChange={(value) => setNewTrip({ ...newTrip, fuel_unit: value })}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gallons">Gallons</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Price/Unit</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newTrip.fuel_price_per_unit}
                      onChange={(e) => setNewTrip({ ...newTrip, fuel_price_per_unit: parseFloat(e.target.value) || 0 })}
                      className="text-sm"
                    />
                  </div>
                </div>
                {newTrip.fuel_quantity > 0 && newTrip.fuel_price_per_unit > 0 && (
                  <p className="text-xs text-slate-600 mt-1">
                    Total fuel cost: <span className="font-semibold">${(newTrip.fuel_quantity * newTrip.fuel_price_per_unit).toFixed(2)}</span>
                  </p>
                )}
              </div>

              {/* Supplies Section */}
              <div className="col-span-2 border-t pt-3">
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Supplies Used
                </h4>
                {newTrip.supplies_used && newTrip.supplies_used.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {newTrip.supplies_used.map((supply, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded text-xs">
                        <span>{supply.name} (x{supply.quantity}) ${((supply.quantity || 0) * (supply.price || 0)).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => removeSupplyFromTrip(idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Input
                    value={newSupply.name}
                    onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                    placeholder="Supply name (type or select below)"
                    className="text-sm"
                  />
                  {boatSupplies.length > 0 && (
                    <Select onValueChange={(value) => {
                      const selected = boatSupplies.find(s => s.name === value);
                      if (selected) {
                        setNewSupply({ name: value, quantity: 1, price: selected.price_per_unit || 0 });
                      }
                    }}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Or quick-select from inventory" />
                      </SelectTrigger>
                      <SelectContent>
                        {boatSupplies.map((supply, idx) => (
                          <SelectItem key={idx} value={supply.name}>
                            {supply.name} {supply.price_per_unit ? `($${supply.price_per_unit})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={newSupply.quantity}
                      onChange={(e) => setNewSupply({ ...newSupply, quantity: parseInt(e.target.value) || 0 })}
                      placeholder="Qty"
                      className="text-sm w-16"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newSupply.price}
                      onChange={(e) => setNewSupply({ ...newSupply, price: parseFloat(e.target.value) || 0 })}
                      placeholder="Price/unit"
                      className="text-sm flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addSupplyToTrip}
                      disabled={!newSupply.name || !newSupply.quantity}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Additional Expenses */}
              <div className="col-span-2 border-t pt-3">
                <h4 className="text-xs font-semibold text-slate-700 mb-2">Additional Expenses (Snacks, Drinks, etc.)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTrip.additional_expenses}
                      onChange={(e) => setNewTrip({ ...newTrip, additional_expenses: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 250"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={newTrip.additional_expenses_notes}
                      onChange={(e) => setNewTrip({ ...newTrip, additional_expenses_notes: e.target.value })}
                      placeholder="e.g., Snacks and drinks"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={newTrip.notes}
                  onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
                  placeholder="Trip details, conditions, etc."
                  className="text-sm"
                  rows={2}
                />
              </div>

              {/* Maintenance Checklist - Outboard Engines */}
              {boat?.engine_config === 'outboard' && (
                <div className="col-span-2 border-t pt-3">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Routine / Per-Use Maintenance (per trip)</h4>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border">
                    {[
                      { key: 'freshwater_flush', label: 'Engine freshwater flush', note: 'Every Outing (saltwater mandatory)' },
                      { key: 'visual_inspection', label: 'Visual inspection (fuel lines, clamps, leaks, corrosion)', note: 'Every outing' },
                      { key: 'battery_check', label: 'Battery voltage check', note: 'Weekly or before departure' },
                      { key: 'bilge_pump_test', label: 'Bilge pump test', note: 'Weekly' },
                      { key: 'navigation_lights_test', label: 'Navigation lights test', note: 'Before night operation, Every Outing' },
                      { key: 'propeller_inspection', label: 'Propeller visual inspection', note: 'After each trip' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-start gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={maintenanceChecklist[item.key]}
                          onChange={(e) => setMaintenanceChecklist({ ...maintenanceChecklist, [item.key]: e.target.checked })}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.note}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance Checklist - Inboard Engines */}
              {boat?.engine_config === 'inboard' && (
                <div className="col-span-2 border-t pt-3">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Routine / Per-Use Maintenance</h4>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border">
                    {[
                      { key: 'engine_room_inspection', label: 'Engine room visual inspection' },
                      { key: 'fluid_level_check', label: 'Fluid level check (oil, coolant, transmission)' },
                      { key: 'bilge_inspection', label: 'Bilge inspection' },
                      { key: 'generator_test', label: 'Generator test run' },
                      { key: 'seawater_strainer_check', label: 'Seawater strainer check' },
                      { key: 'shore_power_inspection', label: 'Shore power connection inspection' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-start gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={maintenanceChecklist[item.key]}
                          onChange={(e) => setMaintenanceChecklist({ ...maintenanceChecklist, [item.key]: e.target.checked })}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-800">{item.label}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleAddTrip}
              disabled={!newTrip.trip_date || !newTrip.engine_hours_used}
              className="w-full mt-3"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Trip
            </Button>
          </div>

          {/* Trip History */}
          {trips.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Trip History</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {trips.map((trip) => (
                  <div key={trip.id} className="p-3 bg-slate-50 rounded-lg border text-xs">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <p className="font-semibold text-slate-800">
                            {format(parseISO(trip.trip_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        {trip.destination && (
                          <p className="text-slate-600 mt-1">📍 {trip.destination}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Delete this trip?')) {
                            deleteMutation.mutate(trip.id);
                          }
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-slate-600 text-xs">
                      <div className="flex gap-3 flex-wrap">
                        <div>
                          <span className="font-medium">Engine Hours:</span> {trip.engine_hours_used}
                        </div>
                        {trip.duration_hours > 0 && (
                          <div>
                            <span className="font-medium">Duration:</span> {trip.duration_hours}h
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Guests:</span> {trip.guests}
                        </div>
                      </div>
                      {trip.fuel_quantity > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded">
                          <Fuel className="h-3 w-3 text-amber-600" />
                          <span>{trip.fuel_quantity} {trip.fuel_unit} @ ${trip.fuel_price_per_unit}/{trip.fuel_unit?.slice(0, -1) || 'unit'} = <span className="font-semibold">${((trip.fuel_quantity || 0) * (trip.fuel_price_per_unit || 0)).toFixed(2)}</span></span>
                        </div>
                      )}
                      {trip.supplies_used && trip.supplies_used.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {trip.supplies_used.map((supply, idx) => (
                            <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                              {supply.name} (x{supply.quantity}) ${((supply.quantity || 0) * (supply.price || 0)).toFixed(2)}
                            </span>
                          ))}
                        </div>
                      )}
                      {trip.additional_expenses > 0 && (
                        <div className="bg-green-50 px-2 py-1 rounded text-xs">
                          <span className="font-medium">Additional: ${trip.additional_expenses.toFixed(2)}</span>
                          {trip.additional_expenses_notes && <span className="text-slate-600"> - {trip.additional_expenses_notes}</span>}
                        </div>
                      )}
                    </div>
                    {trip.notes && (
                      <p className="text-slate-500 mt-2 italic">{trip.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}