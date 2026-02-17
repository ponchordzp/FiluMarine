import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Calendar, Clock, Users, CreditCard, Building, Check, Shield, Car, ChevronDown, MessageCircle, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

const getAddOnPrice = (id, boatName) => {
  const isTycoon = boatName === 'TYCOON';
  const prices = {
    drinks_catering: isTycoon ? 4500 : 1500,
    celebration_package: isTycoon ? 6000 : 2000,
  };
  return prices[id] || 0;
};

const addOnTitles = {
  drinks_catering: 'Premium Drinks & Catering',
  celebration_package: 'Celebration Package',
};

export default function BookingSummary({ experience, onBack, onConfirm, bookingData, setBookingData, isSubmitting }) {
  const [paymentMethod, setPaymentMethod] = useState(bookingData.payment_method || 'card');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: bookingData.guest_name || '',
    email: bookingData.guest_email || '',
    phone: bookingData.guest_phone || '',
  });
  const [errors, setErrors] = useState({});
  const [paymentScreenshot, setPaymentScreenshot] = useState(bookingData.payment_screenshot || null);
  const [isUploading, setIsUploading] = useState(false);
  
  const whatsappLink = `https://wa.me/525513782169?text=Hello!%20I%20have%20made%20a%20direct%20deposit%20for%20booking%20with%20confirmation%20code:%20${bookingData.confirmation_code || 'PENDING'}`;

  const addOnsTotal = (bookingData.add_ons || []).reduce((sum, id) => {
    const addOn = addOnOptions.find(a => a.id === id);
    return sum + (addOn?.price || 0);
  }, 0);

  const taxiFee = bookingData.taxi_fee || 0;
  const boatMultiplier = bookingData.boat_multiplier || 1;
  const basePrice = Math.round(experience.price * boatMultiplier);
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
    
    if ((paymentMethod === 'bank_transfer' || paymentMethod === 'paypal') && !paymentScreenshot) {
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
                
                <RadioGroup value={paymentMethod} onValueChange={(val) => { setPaymentMethod(val); setShowBankDetails(val === 'bank_transfer'); }}>
                  <div className="space-y-3">
                    <div>
                      <label 
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'bank_transfer' ? 'border-[#1e88e5] bg-[#1e88e5]/5' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Building className={`h-5 w-5 ${paymentMethod === 'bank_transfer' ? 'text-[#1e88e5]' : 'text-slate-400'}`} />
                        <div className="flex-1">
                          <p className={`font-medium ${paymentMethod === 'bank_transfer' ? 'text-[#1e88e5]' : 'text-slate-700'}`}>
                            Direct Deposit
                          </p>
                          <p className="text-sm text-slate-500">Bank transfer</p>
                        </div>
                        <ChevronDown className={`h-5 w-5 transition-transform ${showBankDetails ? 'rotate-180' : ''} ${paymentMethod === 'bank_transfer' ? 'text-[#1e88e5]' : 'text-slate-400'}`} />
                      </label>
                      
                      {showBankDetails && paymentMethod === 'bank_transfer' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
                        >
                          <h4 className="font-semibold text-slate-800 mb-3">Bank Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Bank:</span>
                              <span className="font-medium text-slate-800">BBVA</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Cuenta CLABE:</span>
                              <span className="font-mono font-medium text-slate-800">012180 004713413911</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-xs text-amber-800 mb-2">
                              <strong>Important:</strong> After making the deposit, please contact us via WhatsApp to confirm:
                            </p>
                            <ul className="text-xs text-amber-700 list-disc list-inside space-y-1 mb-3">
                              <li>Send screenshot of the transfer</li>
                              <li>Include the transfer amount</li>
                              <li>Include your confirmation code</li>
                            </ul>
                            <a 
                              href={whatsappLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium text-sm"
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp: +52 55 1378 2169
                            </a>
                            <img 
                              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/fc470a313_image.png" 
                              alt="WhatsApp QR Code" 
                              className="w-24 h-24 mx-auto mt-3"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <a
                      href="https://www.paypal.com/paypalme/ponchordzp"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setPaymentMethod('paypal')}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'paypal' ? 'border-[#1e88e5] bg-[#1e88e5]/5' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <RadioGroupItem value="paypal" id="paypal" />
                      <CreditCard className={`h-5 w-5 ${paymentMethod === 'paypal' ? 'text-[#1e88e5]' : 'text-slate-400'}`} />
                      <div>
                        <p className={`font-medium ${paymentMethod === 'paypal' ? 'text-[#1e88e5]' : 'text-slate-700'}`}>
                          PayPal (@ponchordzp)
                        </p>
                        <p className="text-sm text-slate-500">Click to pay via PayPal</p>
                      </div>
                    </a>
                  </div>
                </RadioGroup>

                {/* Payment Screenshot Upload */}
                {(paymentMethod === 'bank_transfer' || paymentMethod === 'paypal') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-xl"
                  >
                    <Label className="text-slate-700 mb-2 block">Payment Screenshot *</Label>
                    <p className="text-sm text-slate-500 mb-3">Upload proof of payment (required)</p>
                    
                    {!paymentScreenshot ? (
                      <div>
                        <label htmlFor="screenshot-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-sm font-medium text-slate-600">Click to upload screenshot</p>
                            <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                          </div>
                        </label>
                        <input
                          id="screenshot-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
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
                        <button
                          onClick={() => setPaymentScreenshot(null)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {errors.screenshot && (
                      <p className="text-xs text-red-500 mt-2">{errors.screenshot}</p>
                    )}
                  </motion.div>
                )}
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