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
    guests: 1,
    destination: '',
    notes: ''
  });
  const [newSupply, setNewSupply] = useState({ name: '', quantity: 0 });

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
        guests: 1,
        destination: '',
        notes: ''
      });
      setNewSupply({ name: '', quantity: 0 });
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
  };

  const totalEngineHours = trips.reduce((sum, t) => sum + (t.engine_hours_used || 0), 0);
  const totalFuelCost = trips.reduce((sum, t) => sum + ((t.fuel_quantity || 0) * (t.fuel_price_per_unit || 0)), 0);

  const addSupplyToTrip = () => {
    if (!newSupply.name || !newSupply.quantity) return;
    setNewTrip({
      ...newTrip,
      supplies_used: [...(newTrip.supplies_used || []), { ...newSupply }]
    });
    setNewSupply({ name: '', quantity: 0 });
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
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-blue-700">Total Trips</p>
                <p className="text-lg font-bold text-blue-900">{trips.length}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Engine Hours</p>
                <p className="text-lg font-bold text-blue-900">{totalEngineHours.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Fuel Cost</p>
                <p className="text-lg font-bold text-blue-900">${totalFuelCost.toFixed(0)}</p>
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
                        <span>{supply.name} (x{supply.quantity})</span>
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
                <div className="flex gap-2">
                  <Input
                    value={newSupply.name}
                    onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                    placeholder="Supply name"
                    className="text-sm flex-1"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={newSupply.quantity}
                    onChange={(e) => setNewSupply({ ...newSupply, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="Qty"
                    className="text-sm w-20"
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
                              {supply.name} (x{supply.quantity})
                            </span>
                          ))}
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