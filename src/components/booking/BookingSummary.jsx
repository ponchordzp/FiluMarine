import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ArrowLeft, Calendar, Clock, Users, CreditCard, Check, Shield, Car, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function BookingSummary({ experience, onBack, onConfirm, bookingData, setBookingData, isSubmitting }) {
  const { data: boats = [] } = useQuery({
    queryKey: ['all-boats'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  const selectedBoat = boats.find(b => b.name === bookingData.boat_name);
  const expPricing = (selectedBoat?.expedition_pricing || []).find(p => p.expedition_type === bookingData.experience_type);
  const addOnOptions = expPricing?.extras || [];
  const currency = selectedBoat?.currency || 'MXN';

  const isScubaExtra = (name) => name && name.toLowerCase().includes('scuba');

  const getAddOnPrice = (id) => {
    const extra = addOnOptions.find(e => e.extra_id === id);
    let price = extra?.price || 0;
    const name = extra?.extra_name || extra?.name || id;
    if (isScubaExtra(name)) {
      price += 200 * (bookingData.scuba_divers_count || 1);
    }
    return price;
  };

  const getAddOnTitle = (id) => {
    const extra = addOnOptions.find(e => e.extra_id === id);
    let title = extra?.extra_name || extra?.name || id;
    if (isScubaExtra(title)) {
      title += ` (${bookingData.scuba_divers_count || 1} Certified Diver${(bookingData.scuba_divers_count || 1) > 1 ? 's' : ''})`;
    }
    return title;
  };

  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [guestInfo, setGuestInfo] = useState({
    name: bookingData.guest_name || '',
    email: bookingData.guest_email || '',
    phone: bookingData.guest_phone || '',
  });
  const [errors, setErrors] = useState({});
  const [paymentScreenshot, setPaymentScreenshot] = useState(bookingData.payment_screenshot || null);
  const [isUploading, setIsUploading] = useState(false);
  
  const addOnsTotal = (bookingData.add_ons || []).reduce((sum, id) => {
    return sum + getAddOnPrice(id);
  }, 0);

  const taxiFee = bookingData.taxi_fee || 0;
  const perPersonDockFee = selectedBoat?.dock_fee || 0;
  const totalDockFee = perPersonDockFee * (bookingData.guests || 1);
  const basePrice = bookingData.boat_price || experience.price;
  const totalPrice = basePrice + addOnsTotal + taxiFee;
  const deposit = Math.round(totalPrice * 0.4);
  const remaining = totalPrice - deposit;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({...errors, screenshot: 'Please upload an image file'});
      return;
    }

    setIsUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setPaymentScreenshot(result.file_url);
      setErrors({...errors, screenshot: null});
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({...errors, screenshot: 'Failed to upload image'});
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!guestInfo.name.trim()) newErrors.name = 'Name is required';
    if (!guestInfo.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(guestInfo.email)) newErrors.email = 'Invalid email';
    if (!guestInfo.phone.trim()) newErrors.phone = 'Phone/WhatsApp is required';
    
    if (!paymentScreenshot) {
      newErrors.screenshot = 'Payment screenshot is required';
    }
    
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
      payment_screenshot: paymentScreenshot,
      total_price: totalPrice,
      deposit_paid: deposit,
      currency: currency,
      dock_fee: totalDockFee,
      scuba_divers_count: bookingData.scuba_divers_count || 0,
    };
    
    setBookingData(finalData);
    onConfirm(finalData);
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#0a1f3d] via-[#0c2847] to-[#001529] py-8 md:py-16">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
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
            <span>Back to extras</span>
          </button>

          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-light text-white mb-2 sm:mb-3">
              Complete Your <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Booking</span>
            </h2>
            <p className="text-sm sm:text-base text-white/70">Review details and confirm your reservation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
            {/* Booking Summary */}
            <div className="md:col-span-2 space-y-6 min-w-0">
              <div className="bg-white rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm">
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
                        const price = getAddOnPrice(id);
                        const title = getAddOnTitle(id);
                        return title ? (
                          <div key={id} className="flex justify-between text-sm">
                            <span className="text-slate-600">{title}</span>
                            <span className="text-slate-800">${price.toLocaleString()} {currency}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-white rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Price Breakdown</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Experience ({bookingData.boat_name})</span>
                    <span className="text-slate-800">${basePrice.toLocaleString()} {currency}</span>
                  </div>
                  {addOnsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Add-ons</span>
                      <span className="text-slate-800">${addOnsTotal.toLocaleString()} {currency}</span>
                    </div>
                  )}
                  {taxiFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Taxi pickup</span>
                      <span className="text-slate-800">${taxiFee} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-3 border-t border-slate-100">
                    <span className="text-slate-800">Total</span>
                    <span className="text-slate-800">${totalPrice.toLocaleString()} {currency}</span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-[#1e88e5]/10 rounded-xl">
                  <p className="text-sm font-medium text-[#0c2340] mb-2">Payment Schedule</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#0c2340]/80">Deposit (40%) - due today</span>
                      <span className="font-semibold text-[#0c2340]">${deposit.toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#0c2340]/80">Balance (60%) - on arrival</span>
                      <span className="text-[#0c2340]/80">${remaining.toLocaleString()} {currency}</span>
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
            <div className="md:col-span-3 space-y-6 min-w-0">
              {/* Guest Information */}
              <div className="bg-white rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm">
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
              <div className="bg-white rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2">Deposit Payment (40%)</h3>
                <p className="text-sm text-slate-500 mb-4">Non-refundable reservation fee: <span className="font-semibold text-slate-700">${deposit.toLocaleString()} {currency}</span></p>

                {/* PayPal only */}
                <a
                  href={`https://www.paypal.com/paypalme/${selectedBoat?.paypal_username || 'filumarine'}/${deposit}${currency}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPaymentMethod('paypal')}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border-2 border-[#1e88e5] bg-[#1e88e5]/5 cursor-pointer transition-all hover:bg-[#1e88e5]/10"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <CreditCard className="h-5 w-5 text-[#1e88e5] flex-shrink-0" />
                    <div className="flex-1 sm:hidden">
                      <p className="font-medium text-[#1e88e5]">Pay via PayPal</p>
                    </div>
                    <span className="sm:hidden text-sm font-semibold text-[#1e88e5] whitespace-nowrap">${deposit.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex-1 hidden sm:block">
                    <p className="font-medium text-[#1e88e5]">Pay via PayPal</p>
                    <p className="text-sm text-slate-500 truncate">Click to open PayPal · @{selectedBoat?.paypal_username || 'filumarine'}</p>
                  </div>
                  <div className="sm:hidden w-full">
                    <p className="text-xs text-slate-500 truncate">Click to open PayPal · @{selectedBoat?.paypal_username || 'filumarine'}</p>
                  </div>
                  <span className="hidden sm:inline-block text-sm font-semibold text-[#1e88e5] whitespace-nowrap">${deposit.toLocaleString()} {currency}</span>
                </a>

                {/* Screenshot upload */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-xl"
                >
                  <Label className="text-slate-700 mb-2 block">Payment Screenshot *</Label>
                  <p className="text-sm text-slate-500 mb-3">Upload proof of PayPal payment (required to confirm booking)</p>
                  {!paymentScreenshot ? (
                    <div>
                      <label htmlFor="screenshot-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                          <Upload className="h-8 w-8 text-slate-400 mb-2" />
                          <p className="text-sm font-medium text-slate-600">Click to upload screenshot</p>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      </label>
                      <input id="screenshot-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                      {isUploading && (
                        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-600">
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={paymentScreenshot} alt="Payment proof" className="w-full h-48 object-cover rounded-lg" />
                      <button onClick={() => setPaymentScreenshot(null)} className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {errors.screenshot && <p className="text-xs text-red-500 mt-2">{errors.screenshot}</p>}
                </motion.div>
              </div>

              {/* Remaining Balance Info */}
              <div className="bg-[#f0f5f9] rounded-lg md:rounded-2xl p-4 md:p-6">
                <h3 className="font-semibold text-slate-800 mb-2">Remaining Balance (60%)</h3>
                <p className="text-sm text-slate-500 mb-3">Due on arrival: <span className="font-semibold text-slate-700">${remaining.toLocaleString()} {currency}</span></p>
                {totalDockFee > 0 && (
                  <div className="mb-3 p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700 font-medium">Additional Dock Fee</p>
                    <p className="text-sm text-slate-500">A separate dock fee of <span className="font-semibold">${totalDockFee.toLocaleString()} {currency}</span> (${perPersonDockFee.toLocaleString()} {currency} per person) must be paid in cash upon arrival.</p>
                  </div>
                )}
                <p className="text-sm text-slate-600 mb-3">Payment options available on the day of your trip:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border">PayPal</span>
                  <span className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border">Credit Card</span>
                  <span className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border">Cash</span>
                </div>
              </div>

              {/* Confirm Button */}
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full bg-[#1e88e5] hover:bg-[#1976d2] text-white py-4 sm:py-6 rounded-lg md:rounded-xl font-medium text-base sm:text-lg transition-all disabled:opacity-50 h-auto"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-center flex-wrap justify-center">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Confirm Booking</span>
                    <span className="hidden sm:inline">-</span>
                    <span>Pay ${deposit.toLocaleString()} {currency}</span>
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