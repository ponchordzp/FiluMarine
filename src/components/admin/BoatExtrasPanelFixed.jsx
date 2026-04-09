import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// boat = boat record (for card mode), inline = true means controlled via formData/onChange (no direct DB save)
export default function BoatExtrasPanelFixed({ boat, inline = false, formData, onChange, disabled = false }) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [selectedExtraId, setSelectedExtraId] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const { data: allExtras = [] } = useQuery({
    queryKey: ['extras'],
    queryFn: () => base44.entities.Extra.list('sort_order'),
  });

  const currency = inline ? (formData?.currency || 'MXN') : (boat?.currency || 'MXN');

  // In inline mode, read from formData; otherwise read from boat
  const boatExtras = inline ? (formData?.boat_extras || []) : (boat?.boat_extras || []);

  // Fetch from the user's extras list located in the extras tab
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const operatorExtras = isSuperAdmin
    ? allExtras
    : allExtras.filter(e => {
        const userOp = currentUser?.operator || 'FILU';
        const allowed = e.allowed_operators || [];
        // Show extras that are either explicitly allowed for this operator, or global (empty allowed_operators)
        return allowed.length === 0 || allowed.some(o => o.toLowerCase() === userOp.toLowerCase());
      });

  // Extras not yet added to this boat
  const availableExtras = operatorExtras.filter(e => !boatExtras.some(be => be.extra_id === e.id));

  const saveMutation = useMutation({
    mutationFn: (updatedExtras) =>
      base44.entities.BoatInventory.update(boat.id, { boat_extras: updatedExtras }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boats'] }),
  });

  const commit = (updatedExtras) => {
    if (inline) {
      onChange(updatedExtras);
    } else {
      saveMutation.mutate(updatedExtras);
      // Also update vault if not inline
      try {
        const vaultKey = 'filu_expedition_pricing_vault';
        const raw = localStorage.getItem(vaultKey);
        const vault = raw ? JSON.parse(raw) : {};
        if (boat?.id) {
          vault[boat.id] = {
            ...vault[boat.id],
            boat_extras: updatedExtras,
            saved_at: Date.now()
          };
          localStorage.setItem(vaultKey, JSON.stringify(vault));
        }
      } catch (e) {}
    }
  };

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
    commit(updated);
    setSelectedExtraId('');
    setCustomPrice('');
  };

  const removeExtra = (extraId) => {
    commit(boatExtras.filter(e => e.extra_id !== extraId));
  };

  const updatePrice = (extraId, newPrice) => {
    const updated = boatExtras.map(e =>
      e.extra_id === extraId ? { ...e, price: parseFloat(newPrice) || 0 } : e
    );
    commit(updated);
  };

  const extrasList = (
    <>
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
              disabled={disabled}
              value={be.price}
              onChange={e => !disabled && updatePrice(be.extra_id, e.target.value)}
              className="h-6 w-20 text-xs px-1"
            />
            <span className="text-xs text-slate-400">{currency}</span>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && removeExtra(be.extra_id)}
            className={`text-red-400 hover:text-red-600 flex-shrink-0 ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {availableExtras.length > 0 && !disabled && (
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
            <span className="text-xs text-slate-400">{currency}</span>
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
    </>
  );

  // In inline (form) mode, render content directly without the card-style expand toggle
  if (inline) {
    return (
      <div className="space-y-2">
        {disabled && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">Section locked — unlock to edit.</div>}
        {extrasList}
      </div>
    );
  }

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
          {extrasList}
        </div>
      )}
    </div>
  );
}