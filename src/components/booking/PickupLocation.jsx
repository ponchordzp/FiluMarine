import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Hotel, Car, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const pickupOptions = [
  {
    id: 'marina',
    title: 'Marina Ixtapa',
    description: 'Meet directly at our dock - Dock #12',
    address: 'Blvd. Ixtapa, Marina Ixtapa, 40880',
    included: true,
  },
  {
    id: 'hotel_zona',
    title: 'Hotel Zone Ixtapa',
    description: 'Pickup from any hotel in the Ixtapa hotel zone',
    address: 'We\'ll confirm exact pickup time',
    included: true,
  },
  {
    id: 'zihuatanejo',
    title: 'Zihuatanejo Downtown',
    description: 'Pickup from hotels or locations in Zihuatanejo',
    address: 'Centro or La Ropa beach area',
    included: false,
    extraFee: 15,
  },
];

export default function PickupLocation({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const [selectedPickup, setSelectedPickup] = useState(bookingData.pickup_location || 'marina');
  const [hotelName, setHotelName] = useState(bookingData.hotel_name || '');

  const handleContinue = () => {
    const pickupOption = pickupOptions.find(p => p.id === selectedPickup);
    setBookingData({
      ...bookingData,
      pickup_location: selectedPickup,
      hotel_name: selectedPickup !== 'marina' ? hotelName : '',
      pickup_fee: pickupOption?.extraFee || 0,
    });
    onContinue();
  };

  const needsHotelName = selectedPickup === 'hotel_zona' || selectedPickup === 'zihuatanejo';

  return (
    <section className="min-h-screen bg-[#f8f6f3] py-8 md:py-16">
      <div className="max-w-3xl mx-auto px-6">
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
            <span>Back to date selection</span>
          </button>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-light text-slate-800 mb-3">
              Choose <span className="font-semibold">Pickup Location</span>
            </h2>
            <p className="text-slate-600">Where should we pick you up?</p>
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
                  className={`w-full p-5 rounded-2xl border-2 transition-all flex items-start gap-4 text-left ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-sky-500' : 'bg-slate-100'
                  }`}>
                    {option.id === 'marina' ? (
                      <MapPin className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    ) : option.id === 'hotel_zona' ? (
                      <Hotel className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    ) : (
                      <Car className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isSelected ? 'text-sky-700' : 'text-slate-800'}`}>
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
                    <p className="text-sm text-slate-500 mt-1">{option.description}</p>
                    <p className="text-xs text-slate-400 mt-1">{option.address}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="h-4 w-4 text-white" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Hotel Name Input */}
          {needsHotelName && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white rounded-2xl p-6 shadow-sm mb-8"
            >
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hotel or Location Name *
              </label>
              <Input
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="e.g., Las Brisas Ixtapa, Hotel Pacifica..."
                className="border-slate-200 focus:border-sky-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                We'll contact you to confirm the exact pickup time and meeting point.
              </p>
            </motion.div>
          )}

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={needsHotelName && !hotelName.trim()}
            className="w-full md:w-auto md:min-w-[200px] bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            Continue to Extras
          </Button>
        </motion.div>
      </div>
    </section>
  );
}