import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from 'lucide-react';

const standardEquipmentOptions = [
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'live_well', label: 'Live Well' },
  { value: 'starlink', label: 'Starlink' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'audio_system', label: 'Audio System' },
  { value: 'gps', label: 'GPS' },
  { value: 'fishing_gear', label: 'Fishing Gear' },
  { value: 'snorkeling_gear', label: 'Snorkeling Gear' }
];

export default function EquipmentManager({ equipment, customEquipment, onToggleEquipment, onAddCustom, onRemoveCustom, newEquipment, onNewEquipmentChange }) {
  const [selectedEquipment, setSelectedEquipment] = React.useState('');
  
  const handleAddStandardEquipment = () => {
    if (selectedEquipment) {
      onToggleEquipment(selectedEquipment);
      setSelectedEquipment('');
    }
  };

  const availableStandardEquipment = standardEquipmentOptions.filter(
    opt => !equipment[opt.value]
  );

  return (
    <div>
      <Label className="mb-3 block">Equipment</Label>
      
      {/* Selected Standard Equipment */}
      {Object.entries(equipment).filter(([_, selected]) => selected).length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {Object.entries(equipment).filter(([_, selected]) => selected).map(([eq]) => (
            <div key={eq} className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-1.5">
              <span className="text-sm capitalize">{eq.replace(/_/g, ' ')}</span>
              <button
                type="button"
                onClick={() => onToggleEquipment(eq)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Standard Equipment Dropdown */}
      {availableStandardEquipment.length > 0 && (
        <div className="flex gap-2 mb-3">
          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Add standard equipment" />
            </SelectTrigger>
            <SelectContent>
              {availableStandardEquipment.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={handleAddStandardEquipment}
            size="sm"
            variant="outline"
            className="flex-shrink-0"
            disabled={!selectedEquipment}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Custom Equipment List */}
      {customEquipment.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {customEquipment.map((eq, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-cyan-50 border border-cyan-300 rounded-lg px-3 py-1.5">
              <span className="text-sm capitalize">{eq}</span>
              <button
                type="button"
                onClick={() => onRemoveCustom(idx)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Custom Equipment Input */}
      <div className="flex gap-2">
        <Input
          value={newEquipment}
          onChange={(e) => onNewEquipmentChange(e.target.value)}
          placeholder="Add custom equipment (e.g., WiFi, Kayaks)"
          className="text-sm"
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddCustom())}
        />
        <Button
          type="button"
          onClick={onAddCustom}
          size="sm"
          variant="outline"
          className="flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}