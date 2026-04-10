import React, { useState } from 'react';
import { ALCOHOL_UPGRADES_LIST } from '@/lib/alcoholUpgrades';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

export default function AlcoholUpgradesManager({ upgrades = [], onChange, currency = 'MXN', disabled = false }) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  
  // Combine default list and custom items that exist in upgrades
  const allItems = [...ALCOHOL_UPGRADES_LIST];
  const customItems = upgrades.filter(u => u.id.startsWith('custom_'));
  
  // Create a combined view list
  const displayItems = [
    ...allItems.map(item => {
      const upgrade = upgrades.find(u => u.id === item.id);
      return {
        ...item,
        isCustom: false,
        checked: upgrade?.checked || false,
        price: upgrade ? upgrade.price : (currency === 'MXN' ? item.defaultPriceUSD * 19 : item.defaultPriceUSD)
      };
    }),
    ...customItems.map(item => ({
      id: item.id,
      name: item.name,
      isCustom: true,
      checked: item.checked,
      price: item.price
    }))
  ];

  const handleToggle = (id, checked, name, defaultPrice) => {
    const existing = upgrades.find(u => u.id === id);
    if (checked) {
      if (!existing) {
        onChange([...upgrades, { id, name, checked: true, price: defaultPrice }]);
      } else {
        onChange(upgrades.map(u => u.id === id ? { ...u, checked: true } : u));
      }
    } else {
      if (existing) {
        // If it's a custom item, unchecked doesn't delete it, just unchecks it, 
        // but maybe we want to keep it unchecked so it stays in the list to be re-checked later?
        // Actually, for custom items, if they uncheck it, it stays in upgrades but checked=false.
        onChange(upgrades.map(u => u.id === id ? { ...u, checked: false } : u));
      }
    }
  };

  const handlePriceChange = (id, price) => {
    onChange(upgrades.map(u => u.id === id ? { ...u, price: parseFloat(price) || 0 } : u));
  };
  
  const handleNameChange = (id, newName) => {
    onChange(upgrades.map(u => u.id === id ? { ...u, name: newName } : u));
    setEditingId(null);
  };

  const handleAddCustom = () => {
    if (!newItemName.trim()) return;
    const newId = `custom_${Date.now()}`;
    const price = parseFloat(newItemPrice) || 0;
    
    onChange([...upgrades, {
      id: newId,
      name: newItemName.trim(),
      checked: true,
      price: price
    }]);
    
    setNewItemName('');
    setNewItemPrice('');
  };
  
  const handleDeleteCustom = (id) => {
    onChange(upgrades.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Add Custom Item */}
      {!disabled && (
        <div className="bg-white p-3 rounded-lg border border-indigo-200 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs text-slate-600 mb-1 block">New Custom Upgrade</Label>
            <Input 
              placeholder="e.g. Dom Pérignon Vintage" 
              value={newItemName} 
              onChange={e => setNewItemName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="w-24">
            <Label className="text-xs text-slate-600 mb-1 block">Price ({currency})</Label>
            <Input 
              type="number" 
              min="0"
              placeholder="0" 
              value={newItemPrice} 
              onChange={e => setNewItemPrice(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Button 
            onClick={handleAddCustom} 
            disabled={!newItemName.trim()} 
            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white px-3"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      )}

      {/* Upgrades List */}
      <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayItems.map(item => {
            const isChecked = item.checked;
            
            return (
              <div key={item.id} className={`p-3 rounded-lg border transition-all flex flex-col gap-2 ${isChecked ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    disabled={disabled}
                    checked={isChecked} 
                    onChange={(e) => handleToggle(item.id, e.target.checked, item.name, item.price)}
                    className="mt-1 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer flex-shrink-0"
                  />
                  
                  {editingId === item.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <Input 
                        value={editingName} 
                        onChange={e => setEditingName(e.target.value)} 
                        className="h-6 text-xs px-1.5"
                        autoFocus
                      />
                      <button onClick={() => handleNameChange(item.id, editingName)} className="text-green-600 p-1"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 p-1"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="flex-1 flex justify-between items-start group">
                      <Label className="text-xs font-semibold leading-tight cursor-pointer pr-1" onClick={() => !disabled && handleToggle(item.id, !isChecked, item.name, item.price)}>
                        {item.name}
                      </Label>
                      
                      {!disabled && item.isCustom && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingId(item.id); setEditingName(item.name); }} className="text-slate-400 hover:text-indigo-600">
                            <Edit className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDeleteCustom(item.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {isChecked && (
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-xs font-medium text-slate-500">Price ({currency}):</span>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1.5 text-xs text-slate-500">$</span>
                      <Input 
                        type="number"
                        disabled={disabled}
                        min="0"
                        value={item.price}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="h-7 text-xs pl-5 border-indigo-200 focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}