import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function AddOns({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const [selectedAddOns, setSelectedAddOns] = useState(bookingData.add_ons || []);
  const [specialRequests, setSpecialRequests] = useState(bookingData.special_requests || '');

  const boatName = bookingData.boat_name;

  const { data: boats = [] } = useQuery({
    queryKey: ['all-boats'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  // Use the per-boat extras directly — these have operator-set prices
  const selectedBoat = boats.find(b => b.name === boatName);
  const addOnOptions = selectedBoat?.boat_extras || [];

  const toggleAddOn = (id) => {
    setSelectedAddOns(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    setBookingData({ ...bookingData, add_ons: selectedAddOns, special_requests: specialRequests });
    onContinue();
  };

  const totalAddOns = selectedAddOns.reduce((sum, id) => {
    const extra = addOnOptions.find(e => e.extra_id === id);
    return sum + (extra?.price || 0);
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
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Enhance Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Experience</span>
            </h2>
            <p className="text-white/80 text-xl">Optional extras to make your trip even better</p>
          </div>

          {/* Add-ons */}
          {addOnOptions.length > 0 ? (
            <div className="space-y-4 mb-10">
              {addOnOptions.map((extra) => {
                const isSelected = selectedAddOns.includes(extra.extra_id);
                return (
                  <motion.button
                    key={extra.extra_id}
                    onClick={() => toggleAddOn(extra.extra_id)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-500/30'
                        : 'border-white/30 bg-white/10 hover:border-white/40 backdrop-blur-xl'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-cyan-400' : 'bg-white/20'}`}>
                      <Sparkles className={`h-6 w-6 ${isSelected ? 'text-slate-900' : 'text-white/70'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isSelected ? 'text-cyan-400' : 'text-white'}`}>{extra.extra_name || extra.name}</h3>
                      {extra.description && <p className="text-sm text-white/70 leading-relaxed">{extra.description}</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`font-semibold ${isSelected ? 'text-cyan-400' : 'text-white/80'}`}>
                        ${(extra.price || 0).toLocaleString()} MXN
                      </span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-white/40'}`}>
                        {isSelected && <Check className="h-4 w-4 text-slate-900" />}
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
            {totalAddOns > 0 && (
              <div className="text-white/90 text-lg">
                Add-ons total: <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">${totalAddOns.toLocaleString()} MXN</span>
              </div>
            )}
            <motion.div whileHover={{ scale: 1.02 }}>
              <Button
                onClick={handleContinue}
                className="relative px-16 py-8 bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white text-lg font-bold rounded-2xl transition-all duration-500 shadow-2xl shadow-cyan-500/40 hover:shadow-[0_0_50px_rgba(34,211,238,0.8)] border-2 border-cyan-400/30 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative">Continue to Payment</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}