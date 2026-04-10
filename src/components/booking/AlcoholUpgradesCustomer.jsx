import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, GlassWater, ChevronDown, ChevronUp } from 'lucide-react';
import { ALCOHOL_UPGRADES_LIST } from '@/lib/alcoholUpgrades';

export default function AlcoholUpgradesCustomer({ boat, selectedItems, onToggleItem }) {
  const [expanded, setExpanded] = useState(false);
  const currency = boat?.currency || 'MXN';
  const availableUpgrades = (boat?.alcohol_upgrades || []).filter(u => u.checked);

  if (availableUpgrades.length === 0) return null;

  return (
    <div className="mb-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-indigo-400/50 bg-indigo-500/10 hover:bg-indigo-500/20 backdrop-blur-xl transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
            <GlassWater className="h-5 w-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-indigo-300">Alcohol Upgrades</h3>
            <p className="text-xs sm:text-sm text-indigo-200/70">Premium champagne, whiskey, tequila & more</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full font-bold">
              {selectedItems.length} selected
            </span>
          )}
          {expanded ? <ChevronUp className="text-indigo-300 h-5 w-5" /> : <ChevronDown className="text-indigo-300 h-5 w-5" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {availableUpgrades.map(upgrade => {
                const baseItem = ALCOHOL_UPGRADES_LIST.find(i => i.id === upgrade.id);
                if (!baseItem) return null;
                const isSelected = selectedItems.includes(upgrade.id);
                const price = upgrade.price || 0;

                return (
                  <motion.button
                    key={upgrade.id}
                    onClick={() => onToggleItem(upgrade.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-400/20 shadow-lg shadow-indigo-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-400 bg-indigo-400' : 'border-white/40'}`}>
                      {isSelected && <Check className="h-3 w-3 text-slate-900" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${isSelected ? 'text-indigo-300' : 'text-white/90'}`}>
                        {baseItem.name}
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-white/60'}`}>
                        ${price.toLocaleString()} {currency}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}