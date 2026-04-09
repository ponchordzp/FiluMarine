import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';

export default function ImportEquipmentButton({ currentBoat, boats, onImport, isSuperAdmin, defaultOperator }) {
  const [open, setOpen] = useState(false);
  const [selectedBoatId, setSelectedBoatId] = useState('');

  const handleImport = () => {
    if (!selectedBoatId) return;
    const sourceBoat = boats.find(b => b.id === selectedBoatId);
    if (!sourceBoat) return;

    const updatedBoat = {
      ...currentBoat,
      equipment: sourceBoat.equipment || {},
      custom_equipment: sourceBoat.custom_equipment || [],
      equipment_visibility: sourceBoat.equipment_visibility || {},
      custom_equipment_visibility: sourceBoat.custom_equipment_visibility || []
    };

    setOpen(false);
    setTimeout(() => {
      onImport(updatedBoat, 'equipment');
    }, 100);
  };

  const otherBoats = boats.filter(b => {
    if (b.id === currentBoat.id) return false;
    if (!isSuperAdmin && defaultOperator) {
      if ((b.operator || '').toLowerCase() !== defaultOperator.toLowerCase()) return false;
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2.5 border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 shadow-sm w-full justify-start mt-1">
          <Copy className="h-3.5 w-3.5" />
          Import Equipment Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Equipment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-slate-600">Select a boat to import its equipment configuration to <strong>{currentBoat.name}</strong>.</p>
          <Select value={selectedBoatId} onValueChange={setSelectedBoatId}>
            <SelectTrigger>
              <SelectValue placeholder="Select source boat..." />
            </SelectTrigger>
            <SelectContent>
              {otherBoats.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={!selectedBoatId} className="bg-teal-600 hover:bg-teal-700 text-white">Import & Edit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}