import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';

export default function ImportExtraGuestsButton({ currentBoat, boats, onImport, isSuperAdmin, defaultOperator }) {
  const [open, setOpen] = useState(false);
  const [selectedBoatId, setSelectedBoatId] = useState('');

  const handleImport = () => {
    if (!selectedBoatId) return;
    const sourceBoat = boats.find(b => b.id === selectedBoatId);
    if (!sourceBoat) return;

    const sourceExpPricing = sourceBoat.expedition_pricing || [];
    let targetExpPricing = [...(currentBoat.expedition_pricing || [])];
    
    sourceExpPricing.forEach(sourceP => {
      const targetP = targetExpPricing.find(p => p.expedition_type === sourceP.expedition_type);
      if (targetP) {
        targetP.price_per_extra_guest = sourceP.price_per_extra_guest || 0;
      } else {
         targetExpPricing.push({
            expedition_type: sourceP.expedition_type,
            price_per_extra_guest: sourceP.price_per_extra_guest || 0,
         });
      }
    });

    const updatedBoat = {
      ...currentBoat,
      expedition_pricing: targetExpPricing,
    };

    setOpen(false);
    setTimeout(() => {
      onImport(updatedBoat, 'section-expeditions');
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
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2.5 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 shadow-sm w-full justify-start mt-1">
          <Copy className="h-3.5 w-3.5" />
          Import Extra Guest Pricing
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Extra Guest Pricing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-slate-600">Select a boat to import its Price per Extra Guest configuration to <strong>{currentBoat.name}</strong>.</p>
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
            <Button onClick={handleImport} disabled={!selectedBoatId} className="bg-blue-600 hover:bg-blue-700 text-white">Import & Edit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}