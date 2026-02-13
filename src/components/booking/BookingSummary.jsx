import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Calendar, Clock, Users, CreditCard, Building, Check, Shield, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const addOnOptions = [
  { id: 'drinks_catering', title: 'Premium Drinks & Catering', price: 75 },
  { id: 'celebration_package', title: 'Celebration Package', price: 100 },
];

export default function BookingSummary({ experience, onBack, onConfirm, bookingData, setBookingData, isSubmitting }) {
  const [paymentMethod, setPaymentMethod] = useState(bookingData.payment_method || 'card');
  const [guestInfo, setGuestInfo] = useState({
    name: bookingData.guest_name || '',
    email: bookingData.guest_email || '',
    phone: bookingData.guest_phone || '',
  });
  const [errors, setErrors] = useState({});

  const addOnsTotal = (bookingData.add_ons || []).reduce((sum, id) => {
    const addOn = addOnOptions.find(a => a.id === id);
    return sum + (addOn?.price || 0);
  }, 0);

  const taxiFee = bookingData.taxi_fee || 0;
  const totalPrice = experience.price + addOnsTotal + taxiFee;
  const deposit = Math.round(totalPrice * 0.4);
  const remaining = totalPrice - deposit;

  const validate = () => {
    const newErrors = {};
    if (!guestInfo.name.trim()) newErrors.name = 'Name is required';
    if (!guestInfo.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(guestInfo.email)) newErrors.email = 'Invalid email';
    if (!guestInfo.phone.trim()) newErrors.phone = 'Phone/WhatsApp is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    
    const finalData = {
      ...bookingData,
      guest_name: guestInfo.name,
      guest_email: guestInfo.email,
      guest_phone: guestInfo.phone,
      payment_method: paymentMethod,
      total_price: totalPrice,
      deposit_paid: deposit,
    };
    
    setBookingData(finalData);
    onConfirm(finalData);
  };

  return (
    <section className="min-h-screen bg-[#f8f6f3] py-8 md:py-16">
      <div className="max-w-4xl mx-auto px-6">
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
            <span>Back to extras</span>
          </button>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-light text-slate-800 mb-3">
              Complete Your <span className="font-semibold">Booking</span>
            </h2>
            <p className="text-slate-600">Review details and confirm your reservation</p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Booking Summary */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Booking Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <img 
                      src={experience.image} 
                      alt={experience.title}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-800">{experience.title}</p>
                      <p className="text-sm text-slate-500">{experience.duration}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">
                        {format(new Date(bookingData.date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">{bookingData.time_slot}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">{bookingData.guests} guest{bookingData.guests > 1 ? 's' : ''}</span>
                    </div>
                    {bookingData.needs_taxi && (
                      <div className="flex items-center gap-3 text-sm">
                        <Car className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">Taxi pickup included</span>
                      </div>
                    )}
                  </div>

                  {bookingData.add_ons?.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-500 mb-2">Add-ons</p>
                      {bookingData.add_ons.map(id => {
                        const addOn = addOnOptions.find(a => a.id === id);
                        return addOn ? (
                          <div key={id} className="flex justify-between text-sm">
                            <span className="text-slate-600">{addOn.title}</span>
                            <span className="text-slate-800">${addOn.price}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Price Breakdown</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Experience ({bookingData.boat_name})</span>
                    <span className="text-slate-800">${basePrice.toLocaleString()} MXN</span>
                  </div>
                  {addOnsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Add-ons</span>
                      <span className="text-slate-800">${addOnsTotal.toLocaleString()} MXN</span>
                    </div>
                  )}
                  {taxiFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Taxi pickup</span>
                      <span className="text-slate-800">${taxiFee} MXN</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-3 border-t border-slate-100">
                    <span className="text-slate-800">Total</span>
                    <span className="text-slate-800">${totalPrice.toLocaleString()} MXN</span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-[#1e88e5]/10 rounded-xl">
                  <p className="text-sm font-medium text-[#0c2340] mb-2">Payment Schedule</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#0c2340]/80">Deposit (40%) - due today</span>
                      <span className="font-semibold text-[#0c2340]">${deposit.toLocaleString()} MXN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#0c2340]/80">Balance (60%) - on arrival</span>
                      <span className="text-[#0c2340]/80">${remaining.toLocaleString()} MXN</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-3 flex items-start gap-2">
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  The 40% deposit is non-refundable and secures your booking.
                </p>
              </div>
            </div>

            {/* Guest Info & Payment */}
            <div className="md:col-span-3 space-y-6">
              {/* Guest Information */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Guest Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-700">Full Name *</Label>
                    <Input
                      id="name"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                      className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="John Smith"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-700">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                      className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-slate-700">Phone / WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                      className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                      placeholder="+1 555 123 4567"
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Method - Deposit */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2">Deposit Payment (40%)</h3>
                <p className="text-sm text-slate-500 mb-4">Non-refundable reservation fee: <span className="font-semibold text-slate-700">${deposit.toLocaleString()} MXN</span></p>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    <label 
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'bank_transfer' ? 'border-[#1e88e5] bg-[#1e88e5]/5' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Building className={`h-5 w-5 ${paymentMethod === 'bank_transfer' ? 'text-[#1e88e5]' : 'text-slate-400'}`} />
                      <div>
                        <p className={`font-medium ${paymentMethod === 'bank_transfer' ? 'text-[#1e88e5]' : 'text-slate-700'}`}>
                          Direct Deposit
                        </p>
                        <p className="text-sm text-slate-500">Bank transfer - details sent via email</p>
                      </div>
                    </label>

                    <label 
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'paypal' ? 'border-[#1e88e5] bg-[#1e88e5]/5' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <RadioGroupItem value="paypal" id="paypal" />
                      <CreditCard className={`h-5 w-5 ${paymentMethod === 'paypal' ? 'text-[#1e88e5]' : 'text-slate-400'}`} />
                      <div>
                        <p className={`font-medium ${paymentMethod === 'paypal' ? 'text-[#1e88e5]' : 'text-slate-700'}`}>
                          PayPal
                        </p>
                        <p className="text-sm text-slate-500">Secure payment via PayPal</p>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Remaining Balance Info */}
              <div className="bg-[#f0f5f9] rounded-2xl p-6">
                <h3 className="font-semibold text-slate-800 mb-2">Remaining Balance (60%)</h3>
                <p className="text-sm text-slate-500 mb-3">Due on arrival: <span className="font-semibold text-slate-700">${remaining.toLocaleString()} MXN</span></p>
                <p className="text-sm text-slate-600 mb-3">Payment options available on the day of your trip:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border">Direct Deposit</span>
                  <span className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border">PayPal</span>
                  <span className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border">Credit Card</span>
                  <span className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border">Cash</span>
                </div>
              </div>

              {/* Confirm Button */}
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full bg-[#1e88e5] hover:bg-[#1976d2] text-white py-6 rounded-xl font-medium text-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Confirm Booking - Pay ${deposit.toLocaleString()} MXN Deposit
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}