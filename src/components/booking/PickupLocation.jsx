import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function PickupLocation({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const location = bookingData.location || 'ixtapa_zihuatanejo';
  const boatName = bookingData.boat_name;

  const { data: allPickupLocations = [] } = useQuery({
    queryKey: ['pickup-locations'],
    queryFn: () => base44.entities.PickupLocation.list('sort_order'),
  });

  // Filter by destination and boat (empty applicable_boats = all boats)
  const availablePickupLocations = allPickupLocations.filter(pl => {
    if (!pl.visible) return false;
    if (pl.location !== location) return false;
    if (pl.applicable_boats?.length > 0 && boatName && !pl.applicable_boats.includes(boatName)) return false;
    return true;
  });

  const [selectedPickup, setSelectedPickup] = useState(
    bookingData.pickup_location || (availablePickupLocations.length > 0 ? availablePickupLocations[0]?.name : '')
  );

  const handleContinue = () => {
    setBookingData({ ...bookingData, pickup_location: selectedPickup });
    onContinue();
  };

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
            <span>Back to date selection</span>
          </button>

          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Choose <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pickup Location</span>
            </h2>
            <p className="text-white/80 text-xl">Where should we pick you up?</p>
          </div>

          <div className="bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl p-8 border-2 border-white/30 hover:border-cyan-400/40 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/20 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-6 w-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Select Pickup Location
              </h3>
            </div>

            {availablePickupLocations.length > 0 ? (
              <Select value={selectedPickup} onValueChange={setSelectedPickup}>
                <SelectTrigger className="w-full bg-white/10 border-white/30 text-white h-14 text-lg">
                  <SelectValue placeholder="Choose a pickup location" />
                </SelectTrigger>
                <SelectContent>
                  {availablePickupLocations.map((pl) => (
                    <SelectItem key={pl.id} value={pl.name} className="text-base">
                      {pl.name}{pl.address ? ` — ${pl.address}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-4 bg-amber-500/20 border border-amber-400/30 rounded-xl">
                <p className="text-amber-200 text-sm">
                  No pickup locations configured for this destination. Please contact support.
                </p>
              </div>
            )}

            {selectedPickup && (
              <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-xl">
                <p className="text-cyan-200 text-sm flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Selected: <span className="font-semibold">{selectedPickup}</span>
                </p>
                {availablePickupLocations.find(pl => pl.name === selectedPickup)?.notes && (
                  <p className="text-cyan-300/60 text-xs mt-1 ml-6">
                    {availablePickupLocations.find(pl => pl.name === selectedPickup).notes}
                  </p>
                )}
              </div>
            )}
          </div>

          <motion.div className="flex justify-center mt-4" whileHover={{ scale: 1.02 }}>
            <Button
              onClick={handleContinue}
              disabled={!selectedPickup}
              className="relative px-16 py-8 bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white text-lg font-bold rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-cyan-500/40 hover:shadow-[0_0_50px_rgba(34,211,238,0.8)] border-2 border-cyan-400/30 overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative">Continue to Extras</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}