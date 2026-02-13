import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Anchor, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const boats = [
  {
    id: 'filu',
    name: 'FILU',
    type: '28ft Center Console',
    year: '2019',
    description: 'Perfect for fishing and snorkeling adventures. Fast, stable, and equipped with premium gear.',
    features: ['Twin engines', 'Fish finder', 'Cooler storage', 'Shade canopy', 'Starlink', 'CCTV safety'],
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    capacity: '6 guests',
  },
  {
    id: 'tycoon',
    name: 'TYCOON',
    type: '55ft Azimut Yacht',
    year: '2002',
    description: 'Luxurious yacht in pristine condition. Ideal for extended expeditions and leisure cruises with maximum comfort.',
    features: ['Spacious cabin', 'Full galley', 'Bathroom', 'Sun deck', 'Premium sound system', 'Starlink', 'CCTV safety'],
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80',
    capacity: '10 guests',
  },
];

export default function BoatSelector({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const [selectedBoat, setSelectedBoat] = useState(bookingData.boat_id || null);

  const handleContinue = () => {
    const boat = boats.find(b => b.id === selectedBoat);
    setBookingData({
      ...bookingData,
      boat_id: selectedBoat,
      boat_name: boat.name,
    });
    onContinue();
  };

  return (
    <section className="min-h-screen bg-[#f8f6f3] py-8 md:py-16">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to experiences</span>
          </button>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-light text-slate-800 mb-3">
              Select Your <span className="font-semibold">Boat</span>
            </h2>
            <p className="text-slate-600">Choose the perfect vessel for your {experience.title}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {boats.map((boat) => (
              <motion.button
                key={boat.id}
                onClick={() => setSelectedBoat(boat.id)}
                whileTap={{ scale: 0.98 }}
                className={`text-left rounded-2xl overflow-hidden border-2 transition-all ${
                  selectedBoat === boat.id
                    ? 'border-[#1e88e5] shadow-xl'
                    : 'border-slate-100 hover:border-slate-200 shadow-sm'
                }`}
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <img 
                    src={boat.image} 
                    alt={boat.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedBoat === boat.id && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-[#1e88e5] rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-5 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">{boat.name}</h3>
                      <p className="text-sm text-slate-500">{boat.type} • {boat.year}</p>
                    </div>
                    <Anchor className="h-6 w-6 text-[#1e88e5] flex-shrink-0 ml-2" />
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{boat.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {boat.features.map((feature, idx) => (
                      <span key={idx} className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Capacity: {boat.capacity}</p>
                </div>
              </motion.button>
            ))}
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selectedBoat}
            className="w-full md:w-auto md:min-w-[200px] bg-[#0c2340] hover:bg-[#1e88e5] text-white py-6 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            Continue to Date & Time
          </Button>
        </motion.div>
      </div>
    </section>
  );
}