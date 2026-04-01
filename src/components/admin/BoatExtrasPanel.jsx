import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export default function BoatExtrasPanel({ boat }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [selectedExtraId, setSelectedExtraId] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const { data: allExtras = [] } = useQuery({
    queryKey: ['extras'],
    queryFn: () => base44.entities.Extra.list('sort_order'),
  });

  const boatExtras = boat.boat_extras || [];

  // Only show extras not already added to this boat
  const availableExtras = allExtras.filter(e =>
    e.visible && !boatExtras.some(be => be.extra_id === e.id)
  );

  const saveMutation = useMutation({
    mutationFn: (updatedExtras) =>
      base44.entities.BoatInventory.update(boat.id, { boat_extras: updatedExtras }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boats'] }),
  });

  const addExtra = () => {
    const extra = allExtras.find(e => e.id === selectedExtraId);
    if (!extra) return;
    const updated = [
      ...boatExtras,
      {
        extra_id: extra.id,
        extra_name: extra.name,
        description: extra.description || '',
        price: parseFloat(customPrice) || extra.price || 0,
      },
    ];
    saveMutation.mutate(updated);
    setSelectedExtraId('');
    setCustomPrice('');
  };

  const removeExtra = (extraId) => {
    saveMutation.mutate(boatExtras.filter(e => e.extra_id !== extraId));
  };

  const updatePrice = (extraId, newPrice) => {
    const updated = boatExtras.map(e =>
      e.extra_id === extraId ? { ...e, price: parseFloat(newPrice) || 0 } : e
    );
    saveMutation.mutate(updated);
  };

  return (
    <div className="mt-3 pt-3 border-t">
      <button
        type="button"
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between gap-2 mb-2"
      >
        <h4 className="font-semibold text-xs text-purple-700 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Extras ({boatExtras.length})
        </h4>
        {expanded ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-2">
          {boatExtras.length === 0 && (
            <p className="text-xs text-slate-400 italic">No extras added yet.</p>
          )}
          {boatExtras.map(be => (
            <div key={be.extra_id} className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <Sparkles className="h-3 w-3 text-purple-500 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700 flex-1 truncate">{be.extra_name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">$</span>
                <Input
                  type="number"
                  min="0"
                  value={be.price}
                  onChange={e => updatePrice(be.extra_id, e.target.value)}
                  onBlur={e => updatePrice(be.extra_id, e.target.value)}
                  className="h-6 w-20 text-xs px-1"
                />
                <span className="text-xs text-slate-400">MXN</span>
              </div>
              <button
                type="button"
                onClick={() => removeExtra(be.extra_id)}
                className="text-red-400 hover:text-red-600 flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {availableExtras.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedExtraId}
                onChange={e => {
                  setSelectedExtraId(e.target.value);
                  const ex = allExtras.find(x => x.id === e.target.value);
                  setCustomPrice(ex?.price?.toString() || '0');
                }}
                className="flex-1 h-7 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select extra...</option>
                {availableExtras.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">$</span>
                <Input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  placeholder="Price"
                  className="h-7 w-20 text-xs px-1"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={addExtra}
                disabled={!selectedExtraId || saveMutation.isPending}
                className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}