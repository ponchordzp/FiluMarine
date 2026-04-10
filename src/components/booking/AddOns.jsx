import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from '@/api/base44Client';
import AlcoholUpgradesCustomer from './AlcoholUpgradesCustomer';
import { useQuery } from '@tanstack/react-query';

export default function AddOns({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const [selectedAddOns, setSelectedAddOns] = useState(bookingData.add_ons || []);
  const [selectedAlcohol, setSelectedAlcohol] = useState(bookingData.alcohol_upgrades || []);
  const [specialRequests, setSpecialRequests] = useState(bookingData.special_requests || '');
  const [scubaDiversCount, setScubaDiversCount] = useState(bookingData.scuba_divers_count || 1);
  const [scubaDialogOpen, setScubaDialogOpen] = useState(false);
  const [tempScubaExtraId, setTempScubaExtraId] = useState(null);

  const boatName = bookingData.boat_name;

  const { data: boats = [] } = useQuery({
    queryKey: ['all-boats'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  const { data: extras = [] } = useQuery({
    queryKey: ['all-extras'],
    queryFn: () => base44.entities.Extra.list(),
  });

  // Use the per-expedition extras — these have operator-set prices
  const selectedBoat = boats.find(b => b.name === boatName);
  const expPricing = (selectedBoat?.expedition_pricing || []).find(p => p.expedition_type === bookingData.experience_type);
  const addOnOptions = expPricing?.extras || [];
  const currency = selectedBoat?.currency || 'MXN';

  const isScubaExtra = (name) => name && name.toLowerCase().includes('scuba');

  const getExtraName = (id) => {
    const extra = addOnOptions.find(e => e.extra_id === id);
    return extra?.extra_name || extra?.name || '';
  };

  const toggleAddOn = (id) => {
    const extraName = getExtraName(id);
    if (isScubaExtra(extraName)) {
      if (selectedAddOns.includes(id)) {
        setSelectedAddOns(prev => prev.filter(a => a !== id));
      } else {
        setTempScubaExtraId(id);
        setScubaDialogOpen(true);
      }
    } else {
      setSelectedAddOns(prev =>
        prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
      );
    }
  };

  const handleConfirmScuba = () => {
    if (tempScubaExtraId && !selectedAddOns.includes(tempScubaExtraId)) {
      setSelectedAddOns(prev => [...prev, tempScubaExtraId]);
    }
    setScubaDialogOpen(false);
  };

  const handleContinue = () => {
    setBookingData({ ...bookingData, add_ons: selectedAddOns, alcohol_upgrades: selectedAlcohol, special_requests: specialRequests, scuba_divers_count: scubaDiversCount });
    onContinue();
  };

  const totalAlcohol = selectedAlcohol.reduce((sum, id) => {
    const upgrade = (selectedBoat?.alcohol_upgrades || []).find(u => u.id === id);
    return sum + (upgrade?.price || 0);
  }, 0);

  const totalAddOns = selectedAddOns.reduce((sum, id) => {
    const extra = addOnOptions.find(e => e.extra_id === id);
    let price = extra?.price || 0;
    const name = extra?.extra_name || extra?.name || '';
    if (isScubaExtra(name)) {
      price += 200 * scubaDiversCount;
    }
    return sum + price;
  }, 0);

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#0a1f3d] via-[#0c2847] to-[#001529] py-8 md:py-16">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to pickup location</span>
          </button>

          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-2 sm:mb-4">
              Enhance Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Experience</span>
            </h2>
            <p className="text-white/80 text-base sm:text-xl">Optional extras to make your trip even better</p>
          </div>

          {/* Alcohol Upgrades */}
          <AlcoholUpgradesCustomer 
            boat={selectedBoat}
            selectedItems={selectedAlcohol}
            onToggleItem={(id) => {
              setSelectedAlcohol(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
            }}
          />

          {/* Add-ons */}
          {addOnOptions.length > 0 ? (
            <div className="space-y-4 mb-10">
              {addOnOptions.map((extra) => {
                const isSelected = selectedAddOns.includes(extra.extra_id);
                const fullExtra = extras.find(e => e.id === extra.extra_id || e.name === extra.extra_name || e.name === extra.name);
                const imageUrl = fullExtra?.image;
                const extraName = extra.extra_name || extra.name || '';
                const isScuba = isScubaExtra(extraName);
                const displayedPrice = isScuba && isSelected 
                  ? (extra.price || 0) + (200 * scubaDiversCount)
                  : (extra.price || 0);
                
                return (
                  <motion.button
                    key={extra.extra_id}
                    onClick={() => toggleAddOn(extra.extra_id)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 text-left ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-500/30'
                        : 'border-white/30 bg-white/10 hover:border-white/40 backdrop-blur-xl'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-5 w-full">
                      <div className={`w-24 sm:w-40 h-[60px] sm:h-[70px] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${isSelected ? 'bg-cyan-400' : 'bg-white/20'}`}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={extra.extra_name || extra.name} className="w-full h-full object-cover" />
                        ) : (
                          <Sparkles className={`h-6 w-6 sm:h-8 sm:w-8 ${isSelected ? 'text-slate-900' : 'text-white/70'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm sm:text-base truncate sm:whitespace-normal ${isSelected ? 'text-cyan-400' : 'text-white'}`}>{extra.extra_name || extra.name}</h3>
                        {extra.description && <p className="text-xs sm:text-sm text-white/70 leading-relaxed line-clamp-2 sm:line-clamp-none">{extra.description}</p>}
                      </div>
                      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                        <span className={`font-semibold ${isSelected ? 'text-cyan-400' : 'text-white/80'}`}>
                          ${displayedPrice.toLocaleString()} {currency}
                          {isScuba && !isSelected && <span className="text-xs text-white/50 block font-normal">+ $200 {currency}/diver</span>}
                        </span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-white/40'}`}>
                          {isSelected && <Check className="h-4 w-4 text-slate-900" />}
                        </div>
                      </div>
                    </div>
                    {/* Mobile Price & Check */}
                    <div className="flex sm:hidden items-center justify-between w-full pt-2 border-t border-white/10 mt-1">
                      <span className={`font-semibold text-sm ${isSelected ? 'text-cyan-400' : 'text-white/80'}`}>
                        ${displayedPrice.toLocaleString()} {currency}
                        {isScuba && !isSelected && <span className="text-xs text-white/50 ml-1 font-normal">+ $200 {currency}/diver</span>}
                      </span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-white/40'}`}>
                        {isSelected && <Check className="h-3 w-3 text-slate-900" />}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="mb-10 p-6 rounded-2xl border border-white/20 bg-white/5 text-center text-white/40">
              No extras available for this trip.
            </div>
          )}

          {/* Special Requests */}
          <div className="bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl p-8 border-2 border-white/30 shadow-2xl mb-10">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">Special Requests</h3>
            <Textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any dietary restrictions, special occasions, or other requests..."
              className="min-h-[120px] bg-white/10 border-2 border-white/30 focus:border-cyan-400 text-white placeholder:text-white/50 resize-none rounded-xl backdrop-blur-sm"
            />
          </div>

          {/* Summary & Continue */}
          <div className="flex flex-col items-center gap-6">
            {(totalAddOns > 0 || totalAlcohol > 0) && (
              <div className="text-white/90 text-lg flex flex-col items-center gap-1">
                {totalAddOns > 0 && <div>Add-ons total: <span className="font-bold text-cyan-400">${totalAddOns.toLocaleString()} {currency}</span></div>}
                {totalAlcohol > 0 && <div>Alcohol Upgrades total: <span className="font-bold text-indigo-400">${totalAlcohol.toLocaleString()} {currency}</span></div>}
                {(totalAddOns > 0 && totalAlcohol > 0) && <div className="font-bold text-xl mt-2 border-t border-white/20 pt-2">Extras Total: <span className="text-white">${(totalAddOns + totalAlcohol).toLocaleString()} {currency}</span></div>}
              </div>
            )}
            <motion.div whileHover={{ scale: 1.02 }}>
              <Button
                onClick={handleContinue}
                className="relative w-full sm:w-auto px-8 sm:px-16 py-6 sm:py-8 bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl transition-all duration-500 shadow-2xl shadow-cyan-500/40 hover:shadow-[0_0_50px_rgba(34,211,238,0.8)] border-2 border-cyan-400/30 overflow-hidden group h-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative">Continue to Payment</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <Dialog open={scubaDialogOpen} onOpenChange={setScubaDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-cyan-400">Certified Scuba Divers</DialogTitle>
            <DialogDescription className="text-slate-300">
              Please enter the number of certified scuba divers for this trip. The dive master rate is flat, and each diver is an additional $200 {currency}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <Label htmlFor="scuba-divers" className="text-slate-300 mb-2 block">
              Number of Certified Divers (Max {bookingData.guests || 1})
            </Label>
            <Input
              id="scuba-divers"
              type="number"
              min={1}
              max={bookingData.guests || 1}
              value={scubaDiversCount}
              onChange={(e) => setScubaDiversCount(Math.max(1, Math.min(bookingData.guests || 1, parseInt(e.target.value) || 1)))}
              className="bg-slate-800 border-slate-600 text-white focus:border-cyan-400"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setScubaDialogOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={handleConfirmScuba} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              Confirm & Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}