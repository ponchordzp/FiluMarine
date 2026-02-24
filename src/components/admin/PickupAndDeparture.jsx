import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, MapPin, Clock } from 'lucide-react';

export default function PickupAndDeparture({ pickupAndDepartures = [], onUpdate, expeditionType }) {
  const handleAdd = () => {
    const newEntry = {
      id: Date.now(),
      pickup_location: '',
      departure_time: ''
    };
    onUpdate([...pickupAndDepartures, newEntry]);
  };

  const handleRemove = (id) => {
    onUpdate(pickupAndDepartures.filter(item => item.id !== id));
  };

  const handleChange = (id, field, value) => {
    onUpdate(pickupAndDepartures.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="space-y-3">
      {pickupAndDepartures.length > 0 ? (
        <div className="space-y-2">
          {pickupAndDepartures.map((item, idx) => (
            <div key={item.id} className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg border">
              <div className="flex-1">
                <Label className="text-xs">Pickup Location</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <Input
                    value={item.pickup_location || ''}
                    onChange={(e) => handleChange(item.id, 'pickup_location', e.target.value)}
                    placeholder="e.g., Marina Bay"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Departure Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <Input
                    value={item.departure_time || ''}
                    onChange={(e) => handleChange(item.id, 'departure_time', e.target.value)}
                    placeholder="e.g., 7:00 AM"
                    className="text-sm"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(item.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-slate-50 rounded-lg border text-center">
          <p className="text-xs text-slate-500">No pickup locations added yet</p>
        </div>
      )}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full text-xs"
      >
        <Plus className="h-3 w-3 mr-2" />
        Add Pickup Location & Time
      </Button>
    </div>
  );
}