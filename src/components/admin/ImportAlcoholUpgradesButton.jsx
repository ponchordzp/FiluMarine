import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';

export default function ImportAlcoholUpgradesButton({ currentBoat, boats, onImport, isSuperAdmin, defaultOperator }) {
  const [open, setOpen] = useState(false);
  const [selectedBoatId, setSelectedBoatId] = useState('');

  const handleImport = () => {
    if (!selectedBoatId) return;
    const sourceBoat = boats.find(b => b.id === selectedBoatId);
    if (!sourceBoat) return;

    const updatedBoat = {
      ...currentBoat,
      alcohol_upgrades: sourceBoat.alcohol_upgrades || []
    };

    setOpen(false);
    setTimeout(() => {
      onImport(updatedBoat, 'alcohol');
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
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2.5 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-sm w-full justify-start mt-1">
          <Copy className="h-3.5 w-3.5" />
          Import Alcohol Upgrades
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Alcohol Upgrades</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-slate-600">Select a boat to import its alcohol upgrades configuration to <strong>{currentBoat.name}</strong>.</p>
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
            <Button onClick={handleImport} disabled={!selectedBoatId} className="bg-indigo-600 hover:bg-indigo-700 text-white">Import & Edit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}