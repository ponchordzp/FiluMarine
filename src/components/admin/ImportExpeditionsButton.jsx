import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';

export default function ImportExpeditionsButton({ currentBoat, boats, onImport, isSuperAdmin, defaultOperator }) {
  const [open, setOpen] = useState(false);
  const [selectedBoatId, setSelectedBoatId] = useState('');

  const handleImport = () => {
    if (!selectedBoatId) return;
    const sourceBoat = boats.find(b => b.id === selectedBoatId);
    if (!sourceBoat) return;

    const rawVault = localStorage.getItem('filu_expedition_pricing_vault');
    let sourceVault = null;
    if (rawVault) {
      try {
        const vault = JSON.parse(rawVault);
        sourceVault = vault[sourceBoat.id];
      } catch(e) {}
    }

    let sourceExpPricing = sourceBoat.expedition_pricing || [];
    if (sourceExpPricing.length === 0 && sourceVault?.expedition_pricing) {
      sourceExpPricing = sourceVault.expedition_pricing;
    }
    
    const sourcePDeps = sourceVault?.pickup_departures || {};

    const mergedExpPricing = sourceExpPricing.map(p => {
      const deps = sourcePDeps[p.expedition_type];
      if (deps && deps.length > 0 && (!p.pickup_departures || p.pickup_departures.length === 0)) {
        return {
          ...p,
          pickup_departures: deps,
          pickup_location: deps[0]?.pickup_location || p.pickup_location || '',
          departure_time: deps[0]?.departure_time || p.departure_time || '',
        };
      }
      return p;
    });

    const updatedBoat = {
      ...currentBoat,
      available_expeditions: sourceBoat.available_expeditions || [],
      expedition_pricing: mergedExpPricing,
      price_per_additional_hour: sourceBoat.price_per_additional_hour || 0,
    };

    // Use setTimeout to ensure the dialog closes smoothly before the edit modal opens
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
          Import Expeditions Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Expeditions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-slate-600">Select a boat to import its available expeditions and pricing configuration to <strong>{currentBoat.name}</strong>.</p>
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