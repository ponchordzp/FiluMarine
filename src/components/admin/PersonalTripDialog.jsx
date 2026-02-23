import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

export default function PersonalTripDialog({ boat, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [newTrip, setNewTrip] = useState({
    trip_date: '',
    duration_hours: 0,
    engine_hours_used: 0,
    guests: 1,
    destination: '',
    notes: ''
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
        guests: 1,
        destination: '',
        notes: ''
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personal Trips - {boat.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-900">Total Trips: {trips.length}</p>
                <p className="text-xs text-blue-700">Total Engine Hours: {totalEngineHours.toFixed(1)} hrs</p>
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
                    <div className="grid grid-cols-3 gap-2 text-slate-600">
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