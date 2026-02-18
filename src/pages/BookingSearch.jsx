import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar as CalendarIcon, Clock, Users, Mail, Phone, DollarSign, ArrowLeft, Anchor, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

export default function BookingSearch() {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [booking, setBooking] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!confirmationCode.trim()) {
      setError('Please enter a confirmation code');
      return;
    }

    setSearching(true);
    setError('');
    setBooking(null);

    try {
      const bookings = await base44.entities.Booking.filter({ 
        confirmation_code: confirmationCode.toUpperCase().trim() 
      });

      if (bookings.length === 0) {
        setError('No booking found with this confirmation code');
      } else {
        setBooking(bookings[0]);
      }
    } catch (err) {
      setError('Error searching for booking. Please try again.');
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1929] relative">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/d6f4a51df_vecteezy_ai-generated-crisp-blue-ocean-waves-png_42148150.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="py-12">
          <div className="max-w-4xl mx-auto px-6">
            <Link 
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-3 text-white drop-shadow-lg">Find Your Booking</h1>
            <p className="text-white/90 text-lg drop-shadow">Enter your confirmation code to view booking details</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 pb-12">
        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-xl border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Search className="h-5 w-5 text-[#1e88e5]" />
                Search Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="code">Confirmation Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., IXT-ABC123"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-lg"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleSearch}
                    disabled={searching}
                    className="bg-[#1e88e5] hover:bg-[#1976d2] w-full sm:w-auto"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="text-red-600 mt-4 text-sm">{error}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Details */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-800">Booking Details</CardTitle>
                  <Badge className={statusColors[booking.status]}>
                    {booking.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Confirmation Code */}
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-1">Confirmation Code</p>
                  <p className="text-2xl font-bold font-mono text-slate-800">{booking.confirmation_code}</p>
                </div>

                {/* Trip Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-[#1e88e5] rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Scheduled Date</p>
                      <p className="font-semibold text-slate-800">{format(parseISO(booking.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-[#1e88e5] rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Departure Time</p>
                      <p className="font-semibold text-slate-800">{booking.time_slot}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-[#1e88e5] rounded-lg flex items-center justify-center">
                      <Anchor className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Boat</p>
                      <p className="font-semibold text-slate-800">{booking.boat_name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-[#1e88e5] rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Guests</p>
                      <p className="font-semibold text-slate-800">{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</p>
                    </div>
                  </div>
                </div>

                {/* Experience Type */}
                <div>
                  <Label className="text-slate-500">Experience</Label>
                  <p className="font-medium text-lg capitalize">{booking.experience_type?.replace(/_/g, ' ')}</p>
                </div>

                {/* Guest Information */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-slate-800 mb-3">Guest Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <p className="font-medium">{booking.guest_name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-4 w-4" />
                      <p>{booking.guest_email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4" />
                      <p>{booking.guest_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Pickup Location */}
                {booking.pickup_location && (
                  <div>
                    <Label className="text-slate-500 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pickup Location
                    </Label>
                    <p className="font-medium">{booking.pickup_location}</p>
                  </div>
                )}

                {/* Add-ons */}
                {booking.add_ons && booking.add_ons.length > 0 && (
                  <div>
                    <Label className="text-slate-500">Add-ons</Label>
                    <ul className="mt-2 space-y-1">
                      {booking.add_ons.map((addon, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-700">
                          <span className="w-1.5 h-1.5 bg-[#1e88e5] rounded-full"></span>
                          {addon.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Special Requests */}
                {booking.special_requests && (
                  <div>
                    <Label className="text-slate-500">Special Requests</Label>
                    <p className="mt-1 text-sm bg-slate-50 p-3 rounded-lg">{booking.special_requests}</p>
                  </div>
                )}

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-slate-800 mb-3">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-500">Total Price</Label>
                      <p className="text-2xl font-bold text-slate-800">${booking.total_price?.toLocaleString()} MXN</p>
                    </div>
                    <div>
                      <Label className="text-slate-500">Deposit Paid</Label>
                      <p className="text-2xl font-bold text-emerald-600">${booking.deposit_paid?.toLocaleString()} MXN</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-slate-500">Amount Remaining</Label>
                      <p className="text-2xl font-bold text-amber-600">${((booking.total_price || 0) - (booking.deposit_paid || 0)).toLocaleString()} MXN</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-slate-500">Payment Method Used for Deposit</Label>
                    <p className="font-medium capitalize">{booking.payment_method?.replace(/_/g, ' ')}</p>
                  </div>
                  
                  {/* Remaining Payment Information */}
                  {booking.total_price > booking.deposit_paid && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Remaining Balance - Due on Arrival
                      </h4>
                      <p className="text-sm text-amber-800 mb-3">
                        Please pay the remaining balance of <strong>${((booking.total_price || 0) - (booking.deposit_paid || 0)).toLocaleString()} MXN</strong> upon arrival. 
                        We accept the following payment methods:
                      </p>
                      
                      <div className="space-y-3 text-sm text-amber-900">
                        <div>
                          <p className="font-semibold mb-1">💳 Cash (MXN or USD)</p>
                          <p className="text-amber-700">Pay directly at the marina</p>
                        </div>
                        
                        <div>
                          <p className="font-semibold mb-1">🏦 Bank Transfer (SPEI)</p>
                          <div className="bg-white p-3 rounded border border-amber-300 mt-1">
                            <p className="text-amber-700 mb-1">CLABE Number:</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-bold text-amber-900 flex-1">012180004713413911</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText('012180004713413911');
                                  alert('CLABE copied to clipboard!');
                                }}
                                className="shrink-0"
                              >
                                Copy
                              </Button>
                            </div>
                            <p className="text-xs text-amber-600 mt-1">Bank: BBVA Bancomer</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="font-semibold mb-1">💬 WhatsApp Payment</p>
                          <p className="text-amber-700">Contact us to arrange payment via WhatsApp</p>
                        </div>
                        
                        <div>
                          <p className="font-semibold mb-1">💳 Card Payment</p>
                          <p className="text-amber-700">Credit/Debit cards accepted on-site</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-amber-700 mt-3 italic">
                        💡 Tip: If paying by bank transfer, please send us the payment confirmation via WhatsApp before your trip.
                      </p>
                    </div>
                  )}
                </div>

                {/* Meeting Point Info */}
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-2">📍 Meeting Point</h4>
                  <p className="text-sm text-slate-700">
                    <strong>Marina Ixtapa</strong><br/>
                    Dock #12, near the main entrance<br/>
                    Please arrive <strong>15 minutes before</strong> your scheduled departure time.
                  </p>
                </div>

                {/* Contact Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-2">Need Help?</h4>
                  <p className="text-sm text-slate-600 mb-2">Contact us on WhatsApp:</p>
                  <a 
                    href="https://wa.me/525513782169"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Phone className="h-4 w-4" />
                    +52 55 1378 2169
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
}