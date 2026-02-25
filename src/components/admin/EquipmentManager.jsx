import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from 'lucide-react';

export default function EquipmentManager({ equipment, customEquipment, onToggleEquipment, onAddCustom, onRemoveCustom, newEquipment, onNewEquipmentChange }) {
  return (
    <div>
      <Label className="mb-3 block">Equipment</Label>
      
      {/* Standard Equipment Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {Object.keys(equipment).map(eq => (
          <button
            key={eq}
            type="button"
            onClick={() => onToggleEquipment(eq)}
            className={`p-2 rounded-lg border text-xs transition-colors capitalize ${
              equipment[eq]
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            {eq.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      
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