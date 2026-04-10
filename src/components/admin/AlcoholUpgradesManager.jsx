import React from 'react';
import { ALCOHOL_UPGRADES_LIST } from '@/lib/alcoholUpgrades';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AlcoholUpgradesManager({ upgrades = [], onChange, currency = 'MXN', disabled = false }) {
  const handleToggle = (id, checked) => {
    const existing = upgrades.find(u => u.id === id);
    if (checked) {
      if (!existing) {
        const item = ALCOHOL_UPGRADES_LIST.find(i => i.id === id);
        const defaultPrice = currency === 'MXN' ? item.defaultPriceUSD * 19 : item.defaultPriceUSD;
        onChange([...upgrades, { id, checked: true, price: defaultPrice }]);
      } else {
        onChange(upgrades.map(u => u.id === id ? { ...u, checked: true } : u));
      }
    } else {
      if (existing) {
        onChange(upgrades.map(u => u.id === id ? { ...u, checked: false } : u));
      }
    }
  };

  const handlePriceChange = (id, price) => {
    onChange(upgrades.map(u => u.id === id ? { ...u, price: parseFloat(price) || 0 } : u));
  };

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALCOHOL_UPGRADES_LIST.map(item => {
          const upgrade = upgrades.find(u => u.id === item.id);
          const isChecked = upgrade?.checked || false;
          const currentPrice = upgrade ? upgrade.price : (currency === 'MXN' ? item.defaultPriceUSD * 19 : item.defaultPriceUSD);
          
          return (
            <div key={item.id} className={`p-3 rounded-lg border transition-all flex flex-col gap-2 ${isChecked ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  disabled={disabled}
                  checked={isChecked} 
                  onChange={(e) => handleToggle(item.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
                <Label className="text-xs font-semibold leading-tight cursor-pointer" onClick={() => !disabled && handleToggle(item.id, !isChecked)}>
                  {item.name}
                </Label>
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
                      value={currentPrice}
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
  );
}