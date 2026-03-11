import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Users, Ship, Hash, ChevronDown, ChevronUp, MapPin, ExternalLink, Gift, MessageSquare } from 'lucide-react';

const EXP_LABELS = {
  half_day_fishing: 'Half Day Fishing',
  full_day_fishing: 'Full Day Fishing',
  extended_fishing: 'Extended Fishing',
  snorkeling: 'Snorkeling',
  coastal_leisure: 'Coastal Leisure',
};

const STATUS = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
  completed: { label: 'Completed', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
};

const pickupLocationNames = {
  marina_ixtapa: 'Marina Ixtapa',
  muelle_municipal: 'Muelle Municipal (Zihuatanejo)',
  punta_ixtapa: 'Muelle Punta Ixtapa',
  marina_cabo_marques: 'Marina Cabo Marqués',
  pie_de_la_cuesta: 'Pie de la Cuesta',
  marina_acapulco: 'Marina Acapulco',
};

export default function UserTripCard({ booking, allBoats = [] }) {
  const [expanded, setExpanded] = useState(false);

  const boat = allBoats.find(b => b.name === booking.boat_name);
  const s = STATUS[booking.status] || STATUS.pending;
  const tripDate = booking.date ? parseISO(booking.date) : null;
  const upcoming = tripDate && new Date(booking.date) >= new Date(new Date().toDateString());

  const total = booking.total_price || 0;
  const paid = booking.deposit_paid || 0;
  const collectedOnSite = booking.remaining_payment_status === 'collected_on_site';
  const remaining = collectedOnSite ? 0 : Math.max(0, total - paid);
  // Always link to @filumarine
  const paypalLink = remaining > 0 ? `https://paypal.me/filumarine/${remaining}` : null;

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{
      background: upcoming ? 'rgba(30,136,229,0.08)' : 'rgba(255,255,255,0.04)',
      border: upcoming ? '1px solid rgba(30,136,229,0.2)' : '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-base leading-tight">{EXP_LABELS[booking.experience_type] || booking.experience_type}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Ship className="h-3 w-3 text-[#1e88e5] shrink-0" />
            <p className="text-xs text-[#60b4ff]">{booking.boat_name || '—'}</p>
          </div>
        </div>
        <Badge className={`${s.cls} border text-xs shrink-0`}>{s.label}</Badge>
      </div>

      {/* Key info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {tripDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-white/30 shrink-0" />
            <span className="text-xs text-white/55">{format(tripDate, 'MMM d, yyyy')}</span>
          </div>
        )}
        {booking.time_slot && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-white/30 shrink-0" />
            <span className="text-xs text-white/55">{booking.time_slot}</span>
          </div>
        )}
        {booking.guests && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-white/30 shrink-0" />
            <span className="text-xs text-white/55">{booking.guests} guests</span>
          </div>
        )}
        {booking.confirmation_code && (
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-white/30 shrink-0" />
            <span className="text-xs text-white/35 font-mono">{booking.confirmation_code}</span>
          </div>
        )}
      </div>

      {/* Payment summary */}
      {total > 0 && (
        <div className="pt-2.5 border-t border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">Total Price</span>
            <span className="text-sm font-bold text-white">${total.toLocaleString()} MXN</span>
          </div>
          {paid > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/25">Deposit Paid</span>
              <span className="text-xs text-emerald-400">${paid.toLocaleString()} MXN</span>
            </div>
          )}
          {collectedOnSite ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/25">Balance</span>
              <span className="text-xs text-emerald-400">✅ Collected On-Site</span>
            </div>
          ) : remaining > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/25">Balance Due</span>
              <span className="text-xs text-amber-400 font-semibold">${remaining.toLocaleString()} MXN</span>
            </div>
          ) : null}
        </div>
      )}

      {/* PayPal button if balance unpaid */}
      {paypalLink && (
        <Button
          onClick={() => window.open(paypalLink, '_blank')}
          className="w-full h-9 rounded-xl font-semibold text-xs gap-2"
          style={{ background: 'linear-gradient(135deg, #003087, #009cde)', border: 'none' }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Pay ${remaining.toLocaleString()} MXN via PayPal
        </Button>
      )}

      {/* More Details collapsible */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-center gap-1.5 pt-1 text-xs text-white/30 hover:text-white/55 transition-colors"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {expanded ? 'Hide Details' : 'More Details'}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-3 pt-1 border-t border-white/[0.06]">
          {/* Meeting Point */}
          <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(30,136,229,0.07)', border: '1px solid rgba(30,136,229,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#60b4ff]" />
              <span className="text-xs font-semibold text-[#60b4ff] uppercase tracking-wider">Meeting Point</span>
            </div>
            <p className="text-xs text-white/70 font-medium">
              {pickupLocationNames[booking.pickup_location] || booking.pickup_location || 'Marina Ixtapa'}
            </p>
            <p className="text-xs text-white/35">
              {booking.location === 'acapulco'
                ? 'Our crew will contact you 24 hours before departure.'
                : 'Dock #12, near the main entrance. Look for the FILU Marine logo.'}
            </p>
            <p className="text-xs text-white/45 mt-1">
              Please arrive <strong className="text-white/60">15 minutes early</strong> before your departure.
            </p>
          </div>

          {/* Add-ons */}
          {booking.add_ons && booking.add_ons.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Gift className="h-3.5 w-3.5 text-purple-300/60" />
                <span className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Add-Ons</span>
              </div>
              <div className="space-y-1">
                {booking.add_ons.map((addon, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400/60 rounded-full shrink-0" />
                    <span className="text-xs text-white/55 capitalize">{addon.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Requests */}
          {booking.special_requests && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Special Requests</p>
              <p className="text-xs text-white/55 leading-relaxed">{booking.special_requests}</p>
            </div>
          )}

          {/* Deposit method */}
          {booking.payment_method && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">Deposit Method</span>
              <span className="text-xs text-white/50 capitalize">{booking.payment_method.replace(/_/g, ' ')}</span>
            </div>
          )}

          {/* Balance method if collected */}
          {collectedOnSite && booking.remaining_payment_method && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">Balance Collected Via</span>
              <span className="text-xs text-emerald-400 capitalize">{booking.remaining_payment_method.replace(/_/g, ' ')}</span>
            </div>
          )}

          {/* WhatsApp help */}
          <a
            href="https://wa.me/525513782169"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full justify-center py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#4ade80' }}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Contact FILU Marine on WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}