import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Ship, Home, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const pickupLocationsByZone = {
  ixtapa_zihuatanejo: [
    {
      id: 'marina_ixtapa',
      title: 'Marina Ixtapa',
      description: 'Meet directly at our dock - Dock #12',
      address: 'Blvd. Ixtapa, Marina Ixtapa, 40880',
      included: true,
    },
    {
      id: 'muelle_municipal',
      title: 'Muelle Municipal (Zihuatanejo)',
      description: 'Municipal pier in downtown Zihuatanejo',
      address: 'Paseo del Pescador, Zihuatanejo Centro',
      included: true,
    },
    {
      id: 'punta_ixtapa',
      title: 'Muelle Punta Ixtapa',
      description: 'Private dock at Punta Ixtapa',
      address: 'Punta Ixtapa residential area',
      included: true,
      note: 'Only available for Punta Ixtapa residents',
    },
  ],
  acapulco: [
    {
      id: 'marina_cabo_marques',
      title: 'Marina Cabo Marqués (Zona Diamante)',
      description: 'Premium marina in the luxury Diamante area',
      address: 'Carretera Escénica, Zona Diamante, Acapulco',
      included: true,
    },
    {
      id: 'pie_de_la_cuesta',
      title: 'Pie de la Cuesta',
      description: 'Tranquil beach on Coyuca Lagoon',
      address: 'Pie de la Cuesta, Acapulco',
      included: true,
    },
    {
      id: 'marina_acapulco',
      title: 'Marina Acapulco',
      description: 'Traditional marina in Acapulco Bay',
      address: 'Costera Miguel Alemán, Acapulco Centro',
      included: true,
    },
  ],
};

export default function PickupLocation({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const location = bookingData.location || 'ixtapa_zihuatanejo';
  const pickupOptions = pickupLocationsByZone[location];
  const defaultPickup = location === 'acapulco' ? 'marina_cabo_marques' : 'marina_ixtapa';
  const [selectedPickup, setSelectedPickup] = useState(bookingData.pickup_location || defaultPickup);

  const handleContinue = () => {
    setBookingData({
      ...bookingData,
      pickup_location: selectedPickup,
    });
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
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to date selection</span>
          </button>

          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Choose <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pickup Location</span>
            </h2>
            <p className="text-white/80 text-xl">Where should we pick you up?</p>
          </div>

          {/* Pickup Options */}
          <div className="space-y-4 mb-8">
            {pickupOptions.map((option) => {
              const isSelected = selectedPickup === option.id;
              return (
                <motion.button
                  key={option.id}
                  onClick={() => setSelectedPickup(option.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-6 rounded-2xl border-2 transition-all flex items-start gap-4 text-left ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-500/30'
                      : 'border-white/30 bg-white/10 hover:border-white/40 backdrop-blur-xl'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-cyan-400' : 'bg-white/20'
                  }`}>
                    {option.id.includes('marina') ? (
                      <Ship className={`h-6 w-6 ${isSelected ? 'text-slate-900' : 'text-white/70'}`} />
                    ) : option.id.includes('muelle') || option.id.includes('pie') ? (
                      <MapPin className={`h-6 w-6 ${isSelected ? 'text-slate-900' : 'text-white/70'}`} />
                    ) : (
                      <Home className={`h-6 w-6 ${isSelected ? 'text-slate-900' : 'text-white/70'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                        {option.title}
                      </h3>
                      {option.included ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          Included
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          +${option.extraFee}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 mt-1">{option.description}</p>
                    <p className="text-xs text-white/50 mt-1">{option.address}</p>
                    {option.note && (
                      <p className="text-xs text-amber-300 mt-1 font-medium">⚠️ {option.note}</p>
                    )}
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-white/40'
                  }`}>
                    {isSelected && <Check className="h-4 w-4 text-slate-900" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Continue Button */}
          <motion.div 
            className="flex justify-center mt-4"
            whileHover={{ scale: 1.02 }}
          >
            <Button
              onClick={handleContinue}
              className="relative px-16 py-8 bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white text-lg font-bold rounded-2xl transition-all duration-500 shadow-2xl shadow-cyan-500/40 hover:shadow-[0_0_50px_rgba(34,211,238,0.8)] border-2 border-cyan-400/30 overflow-hidden group"
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