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

const pickupLocationNames = {
  marina_ixtapa: 'Marina Ixtapa',
  muelle_municipal: 'Muelle Municipal (Zihuatanejo)',
  punta_ixtapa: 'Muelle Punta Ixtapa',
  marina_cabo_marques: 'Marina Cabo Marqués (Zona Diamante)',
  pie_de_la_cuesta: 'Pie de la Cuesta',
  marina_acapulco: 'Marina Acapulco',
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
    <div className="min-h-screen bg-gradient-to-b from-[#001529] via-[#0c2847] to-[#0a1f3d] relative">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/d6f4a51df_vecteezy_ai-generated-crisp-blue-ocean-waves-png_42148150.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <Link 
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
              Find Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Booking</span>
            </h1>
            <p className="text-white/70 text-xl">Enter your confirmation code to view booking details</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-xl border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Search className="h-5 w-5 text-cyan-400" />
                Search Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="code" className="text-white/90">Confirmation Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., IXT-ABC123"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-lg bg-white/90 border-white/30"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleSearch}
                    disabled={searching}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 w-full sm:w-auto"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="text-red-400 mt-4 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</p>
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
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-xl border border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Booking Details</CardTitle>
                  <Badge className={statusColors[booking.status]}>
                    {booking.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Confirmation Code */}
                <div className="bg-white/10 p-4 rounded-lg text-center border border-white/20">
                  <p className="text-sm text-white/70 mb-1">Confirmation Code</p>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{booking.confirmation_code}</p>
                </div>

                {/* Trip Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Scheduled Date</p>
                      <p className="font-semibold text-white">{format(parseISO(booking.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Departure Time</p>
                      <p className="font-semibold text-white">{booking.time_slot}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Anchor className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Boat</p>
                      <p className="font-semibold text-white">{booking.boat_name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Guests</p>
                      <p className="font-semibold text-white">{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</p>
                    </div>
                  </div>
                </div>

                {/* Experience Type */}
                <div>
                  <Label className="text-white/70">Experience</Label>
                  <p className="font-medium text-lg capitalize text-white">{booking.experience_type?.replace(/_/g, ' ')}</p>
                </div>

                {/* Guest Information */}
                <div className="border-t border-white/20 pt-4">
                  <h3 className="font-semibold text-white mb-3">Guest Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/80">
                      <p className="font-medium">{booking.guest_name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Mail className="h-4 w-4" />
                      <p>{booking.guest_email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Phone className="h-4 w-4" />
                      <p>{booking.guest_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Meeting Point */}
                <div className="border-t border-white/20 pt-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                    Meeting Point
                  </h3>
                  <p className="text-white/90 font-medium mb-2">
                    {pickupLocationNames[booking.pickup_location] || booking.pickup_location || 'Marina Ixtapa'}
                  </p>
                  <p className="text-sm text-white/70">
                    {booking.location === 'acapulco' 
                      ? 'Our crew will contact you 24 hours before departure with exact meeting details.'
                      : 'Dock #12, near the main entrance. Look for our boat with the FILU Marine logo.'}
                  </p>
                  <p className="text-sm text-white/80 mt-2">
                    Please arrive <strong>15 minutes before</strong> your scheduled departure time.
                  </p>
                </div>

                {/* Add-ons */}
                {booking.add_ons && booking.add_ons.length > 0 && (
                  <div>
                    <Label className="text-white/70">Add-ons</Label>
                    <ul className="mt-2 space-y-1">
                      {booking.add_ons.map((addon, i) => (
                        <li key={i} className="flex items-center gap-2 text-white/80">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                          {addon.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Special Requests */}
                {booking.special_requests && (
                  <div>
                    <Label className="text-white/70">Special Requests</Label>
                    <p className="mt-1 text-sm bg-white/10 p-3 rounded-lg text-white/80 border border-white/20">{booking.special_requests}</p>
                  </div>
                )}

                {/* Payment Info */}
                <div className="border-t border-white/20 pt-4">
                  <h3 className="font-semibold text-white mb-3">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70">Total Price</Label>
                      <p className="text-2xl font-bold text-white">${booking.total_price?.toLocaleString()} MXN</p>
                    </div>
                    <div>
                      <Label className="text-white/70">Deposit Paid</Label>
                      <p className="text-2xl font-bold text-emerald-400">${booking.deposit_paid?.toLocaleString()} MXN</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-white/70">Amount Remaining</Label>
                      <p className="text-2xl font-bold text-amber-400">${((booking.total_price || 0) - (booking.deposit_paid || 0)).toLocaleString()} MXN</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-white/70">Payment Method Used for Deposit</Label>
                    <p className="font-medium capitalize text-white/90">{booking.payment_method?.replace(/_/g, ' ')}</p>
                  </div>
                  
                  {/* Remaining Payment Information */}
                  {booking.total_price > booking.deposit_paid && (
                    <div className="mt-4 bg-amber-500/20 border border-amber-400/30 rounded-lg p-4">
                      <h4 className="font-semibold text-amber-300 mb-2 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Remaining Balance - Due on Arrival
                      </h4>
                      <p className="text-sm text-white/80 mb-3">
                        Please pay the remaining balance of <strong className="text-amber-300">${((booking.total_price || 0) - (booking.deposit_paid || 0)).toLocaleString()} MXN</strong> upon arrival. 
                        We accept the following payment methods:
                      </p>
                      
                      <div className="space-y-3 text-sm text-white/90">
                        <div>
                          <p className="font-semibold mb-1">💳 Cash (MXN or USD)</p>
                          <p className="text-white/70">Pay directly at the marina</p>
                        </div>
                        
                        <div>
                          <p className="font-semibold mb-1">🏦 Bank Transfer (SPEI)</p>
                          <div className="bg-white/10 p-3 rounded border border-white/30 mt-1">
                            <p className="text-white/80 mb-1">CLABE Number:</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-bold text-white flex-1">012180004713413911</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText('012180004713413911');
                                  alert('CLABE copied to clipboard!');
                                }}
                                className="shrink-0 bg-white/20 border-white/30 text-white hover:bg-white/30"
                              >
                                Copy
                              </Button>
                            </div>
                            <p className="text-xs text-white/60 mt-1">Bank: BBVA Bancomer</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="font-semibold mb-1">💬 WhatsApp Payment</p>
                          <p className="text-white/70">Contact us to arrange payment via WhatsApp</p>
                        </div>
                        
                        <div>
                          <p className="font-semibold mb-1">💳 Card Payment</p>
                          <p className="text-white/70">Credit/Debit cards accepted on-site</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-white/60 mt-3 italic">
                        💡 Tip: If paying by bank transfer, please send us the payment confirmation via WhatsApp before your trip.
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Need Help?</h4>
                  <p className="text-sm text-white/80 mb-2">Contact us on WhatsApp:</p>
                  <a 
                    href="https://wa.me/525513782169"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 font-medium"
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