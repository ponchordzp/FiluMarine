import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Wine, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const getAddOnOptions = (boatName) => {
  const isTycoon = boatName === 'TYCOON';
  
  return [
    {
      id: 'drinks_catering',
      title: 'Premium Drinks & Catering',
      description: isTycoon 
        ? 'Premium open bar (beer, wine, cocktails), gourmet cheese & charcuterie boards, fresh ceviche bar, tropical fruit platters, and artisan canapés'
        : 'Local beers, wine selection, fresh ceviche, guacamole with chips, seasonal fruit platter, and assorted gourmet snacks',
      price: isTycoon ? 4500 : 1500,
      icon: Wine,
    },
    {
      id: 'celebration_package',
      title: 'Celebration Package',
      description: isTycoon
        ? 'Premium champagne & sparkling wine, custom cake or dessert bar, luxury floral arrangements, balloon decorations, celebration banner, photographer service (1 hour), and party favors'
        : 'Champagne bottle, celebration cake, festive decorations, balloons, personalized banner, and special setup',
      price: isTycoon ? 6000 : 2000,
      icon: Sparkles,
    },
  ];
};

export default function AddOns({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const [selectedAddOns, setSelectedAddOns] = useState(bookingData.add_ons || []);
  const [specialRequests, setSpecialRequests] = useState(bookingData.special_requests || '');
  
  const addOnOptions = getAddOnOptions(bookingData.boat_name);

  const toggleAddOn = (id) => {
    setSelectedAddOns(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    setBookingData({
      ...bookingData,
      add_ons: selectedAddOns,
      special_requests: specialRequests,
    });
    onContinue();
  };

  const totalAddOns = selectedAddOns.reduce((sum, id) => {
    const addOn = addOnOptions.find(a => a.id === id);
    return sum + (addOn?.price || 0);
  }, 0);

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
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to pickup location</span>
          </button>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-light text-slate-800 mb-3">
              Enhance Your <span className="font-semibold">Experience</span>
            </h2>
            <p className="text-slate-600">Optional extras to make your trip even better</p>
          </div>

          {/* Add-ons */}
          <div className="space-y-4 mb-10">
            {addOnOptions.map((addOn) => {
              const isSelected = selectedAddOns.includes(addOn.id);
              return (
                <motion.button
                  key={addOn.id}
                  onClick={() => toggleAddOn(addOn.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                    isSelected
                      ? 'border-[#1e88e5] bg-[#1e88e5]/5'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-[#1e88e5]' : 'bg-slate-100'
                  }`}>
                    <addOn.icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isSelected ? 'text-[#1e88e5]' : 'text-slate-800'}`}>
                      {addOn.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{addOn.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`font-semibold ${isSelected ? 'text-[#1e88e5]' : 'text-slate-700'}`}>
                      ${addOn.price.toLocaleString()} MXN
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#1e88e5] bg-[#1e88e5]' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Special Requests */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Special Requests</h3>
            <Textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any dietary restrictions, special occasions, or other requests..."
              className="min-h-[100px] border-slate-200 focus:border-sky-500 resize-none"
            />
          </div>

          {/* Summary & Continue */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {totalAddOns > 0 && (
              <div className="text-slate-600">
                Add-ons total: <span className="font-semibold text-slate-800">${totalAddOns.toLocaleString()} MXN</span>
              </div>
            )}
            <Button
              onClick={handleContinue}
              className="w-full md:w-auto md:min-w-[200px] bg-[#0c2340] hover:bg-[#1e88e5] text-white py-6 rounded-xl font-medium transition-all"
            >
              Continue to Payment
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}