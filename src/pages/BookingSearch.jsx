import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar as CalendarIcon, Clock, Users, Mail, Phone, ArrowLeft, Anchor, MapPin, Hash, Ship, Gift, ExternalLink, CheckCircle2, Clock as ClockIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

const statusColors = {
  pending:   'bg-amber-400/20 text-amber-200 border border-amber-400/40',
  confirmed: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40',
  cancelled: 'bg-red-400/20 text-red-200 border border-red-400/40',
  completed: 'bg-blue-400/20 text-blue-200 border border-blue-400/40',
};

const pickupLocationNames = {
  marina_ixtapa: 'Marina Ixtapa',
  muelle_municipal: 'Muelle Municipal (Zihuatanejo)',
  punta_ixtapa: 'Muelle Punta Ixtapa',
  marina_cabo_marques: 'Marina Cabo Marqués (Zona Diamante)',
  pie_de_la_cuesta: 'Pie de la Cuesta',
  marina_acapulco: 'Marina Acapulco',
};

function InfoBlock({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(30,136,229,0.2)', border: '1px solid rgba(30,136,229,0.3)' }}>
        <Icon className="h-4 w-4 text-[#60b4ff]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/35">{label}</p>
        <p className={`text-sm font-semibold truncate ${accent || 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function BookingSearch() {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [booking, setBooking] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!confirmationCode.trim()) { setError('Please enter a confirmation code'); return; }
    setSearching(true);
    setError('');
    setBooking(null);
    const bookings = await base44.entities.Booking.filter({ confirmation_code: confirmationCode.toUpperCase().trim() });
    setSearching(false);
    if (bookings.length === 0) setError('No booking found with this confirmation code');
    else setBooking(bookings[0]);
  };

  const remaining = booking ? Math.max(0, (booking.total_price || 0) - (booking.deposit_paid || 0)) : 0;
  const collectedOnSite = booking?.remaining_payment_status === 'collected_on_site';
  const effectiveRemaining = collectedOnSite ? 0 : remaining;
  const paypalLink = effectiveRemaining > 0 ? `https://paypal.me/filumarine/${effectiveRemaining}` : null;

  return (
    <div className="min-h-screen relative" style={{ background: '#060d14' }}>
      {/* Background image */}
      <div className="fixed inset-0"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6987f0afff96227dd3af0e68/b88e58c6f_FILUMarine1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
        }}
      />
      {/* Dark overlay gradient */}
      <div className="fixed inset-0" style={{ background: 'linear-gradient(160deg, #060d14 0%, rgba(6,13,20,0.85) 50%, #060d14 100%)' }} />

      {/* Header */}
      <div className="relative overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'url(https://media.base44.com/images/public/6987f0afff96227dd3af0e68/136c58332_FILUMarine2.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(5,13,26,0.80) 0%, rgba(9,26,48,0.72) 40%, rgba(13,36,68,0.80) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #1565c0 30%, #1e88e5 60%, transparent 100%)' }} />
        <div className="relative max-w-3xl mx-auto px-6 py-8">
          <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="h-4 w-4" />Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-end gap-1">
              <div className="w-8 h-6 bg-red-600 flex items-center justify-center shadow-sm"><div className="w-4 h-4 bg-white transform rotate-45"></div></div>
              <div className="w-8 h-6 bg-black flex items-center justify-center shadow-sm"><div className="w-4 h-4 bg-yellow-400 rounded-full"></div></div>
              <div className="w-8 h-6 grid grid-cols-2 grid-rows-2 shadow-sm"><div className="bg-yellow-400"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-yellow-400"></div></div>
              <div className="w-8 h-6 grid grid-cols-2 grid-rows-2 shadow-sm"><div className="bg-red-600"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-red-600"></div></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">FILU <span className="text-blue-200/60 font-light">Marine</span></h1>
              <p className="text-blue-200/40 text-sm">Find Your Booking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Search box */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-[#1e88e5]" />
              <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">Search Booking</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                <Input
                  placeholder="e.g., IXT-ABC123"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 h-11 rounded-xl text-white placeholder:text-white/25"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="h-11 px-6 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #1e88e5, #0d5fa8)', border: 'none' }}
              >
                {searching ? 'Searching…' : 'Search'}
              </Button>
            </div>
            {error && (
              <p className="mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
            )}
          </div>
        </motion.div>

        {/* Booking result */}
        {booking && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Status header */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-white/35 uppercase tracking-wider mb-1">Confirmation Code</p>
                  <p className="text-2xl font-bold font-mono text-white tracking-widest">{booking.confirmation_code}</p>
                </div>
                <Badge className={statusColors[booking.status]}>
                  {booking.status === 'confirmed' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <ClockIcon className="h-3 w-3 mr-1" />}
                  {booking.status?.toUpperCase()}
                </Badge>
              </div>
              <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(30,136,229,0.4), transparent)' }} />
              <div className="mt-4">
                <p className="text-white font-semibold text-lg">{booking.guest_name}</p>
                <p className="text-sm font-medium text-[#60b4ff] capitalize mt-0.5">{booking.experience_type?.replace(/_/g, ' ')}</p>
              </div>
            </div>

            {/* Trip details grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {booking.date && <InfoBlock icon={CalendarIcon} label="Date" value={format(parseISO(booking.date), 'MMM d, yyyy')} />}
              {booking.time_slot && <InfoBlock icon={Clock} label="Departure" value={booking.time_slot} />}
              {booking.boat_name && <InfoBlock icon={Ship} label="Boat" value={booking.boat_name} accent="text-[#60b4ff]" />}
              {booking.guests && <InfoBlock icon={Users} label="Guests" value={`${booking.guests} guest${booking.guests !== 1 ? 's' : ''}`} />}
            </div>

            {/* Meeting point */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(30,136,229,0.08)', border: '1px solid rgba(30,136,229,0.2)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-[#60b4ff]" />
                <span className="text-sm font-semibold text-[#60b4ff] uppercase tracking-wider">Meeting Point</span>
              </div>
              <p className="text-white font-medium">{pickupLocationNames[booking.pickup_location] || booking.pickup_location || 'Marina Ixtapa'}</p>
              <p className="text-sm text-white/45">
                {booking.location === 'acapulco'
                  ? 'Our crew will contact you 24 hours before departure with exact meeting details.'
                  : 'Please head to the pickup location. Look for the FILU Marine logo.'}
              </p>
              <p className="text-sm text-white/55">Please arrive <strong className="text-white/75">15 minutes early</strong> before your scheduled time.</p>
            </div>

            {/* Guest info */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Guest Information</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/70"><Mail className="h-3.5 w-3.5 text-white/30" />{booking.guest_email}</div>
                <div className="flex items-center gap-2 text-sm text-white/70"><Phone className="h-3.5 w-3.5 text-white/30" />{booking.guest_phone}</div>
              </div>
            </div>

            {/* Add-ons */}
            {booking.add_ons && booking.add_ons.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-4 w-4 text-purple-300/70" />
                  <span className="text-sm font-semibold text-purple-300/70 uppercase tracking-wider">Add-Ons</span>
                </div>
                <div className="space-y-1.5">
                  {booking.add_ons.map((addon, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400/60 rounded-full shrink-0" />
                      <span className="text-sm text-white/60 capitalize">{addon.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special requests */}
            {booking.special_requests && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs text-white/35 uppercase tracking-wider font-semibold mb-2">Special Requests</p>
                <p className="text-sm text-white/55 leading-relaxed">{booking.special_requests}</p>
              </div>
            )}

            {/* Payment */}
            {booking.total_price > 0 && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Payment Summary</p>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">Total Price</span>
                    <span className="text-lg font-bold text-white">${(booking.total_price || 0).toLocaleString()} MXN</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white/50">Deposit Paid</span>
                      {booking.payment_method && (
                        <span className="ml-2 text-xs text-white/25 capitalize">({booking.payment_method.replace(/_/g, ' ')})</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">${(booking.deposit_paid || 0).toLocaleString()} MXN</span>
                  </div>
                  <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">Balance on Arrival</span>
                    {collectedOnSite ? (
                      <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Collected
                        {booking.remaining_payment_method && (
                          <span className="text-xs text-white/30 font-normal ml-1 capitalize">({booking.remaining_payment_method.replace(/_/g, ' ')})</span>
                        )}
                      </span>
                    ) : (
                      <span className={`text-sm font-semibold ${effectiveRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {effectiveRemaining > 0 ? `$${effectiveRemaining.toLocaleString()} MXN` : 'Fully Paid'}
                      </span>
                    )}
                  </div>
                </div>

                {/* PayPal button */}
                {paypalLink && (
                  <Button
                    onClick={() => window.open(paypalLink, '_blank')}
                    className="w-full h-12 rounded-xl font-bold text-sm gap-2 mt-2"
                    style={{ background: 'linear-gradient(135deg, #003087, #009cde)', border: 'none' }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Pay ${effectiveRemaining.toLocaleString()} MXN via PayPal
                  </Button>
                )}

                {/* Remaining note if unpaid */}
                {!paypalLink && effectiveRemaining === 0 && !collectedOnSite && (
                  <div className="rounded-xl p-3 text-xs text-emerald-300/70" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    ✅ All payments are up to date. See you on the water!
                  </div>
                )}
                {effectiveRemaining > 0 && (
                  <p className="text-xs text-white/30 text-center">
                    You can also pay cash, by card, or bank transfer on arrival.
                  </p>
                )}
              </div>
            )}

            {/* Contact help */}
            <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-sm text-white/50 font-medium">Need help?</p>
                <p className="text-xs text-white/25">Contact us on WhatsApp</p>
              </div>
              <a
                href="https://wa.me/525513782169"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', color: '#4ade80' }}
              >
                <Phone className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}