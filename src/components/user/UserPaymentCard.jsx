import React from 'react';
import { format, parseISO } from 'date-fns';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXP_LABELS = {
  half_day_fishing: 'Half Day Fishing',
  full_day_fishing: 'Full Day Fishing',
  extended_fishing: 'Extended Fishing',
  snorkeling: 'Snorkeling',
  coastal_leisure: 'Coastal Leisure',
};

export default function UserPaymentCard({ booking, allBoats }) {
  const boat = allBoats.find(b => b.name === booking.boat_name);
  const total = booking.total_price || 0;
  const paid = booking.deposit_paid || 0;
  const rawRemaining = Math.max(0, total - paid);
  const collectedOnSite = booking.remaining_payment_status === 'collected_on_site';
  const remaining = collectedOnSite ? 0 : rawRemaining;
  const pct = total > 0 ? Math.min(100, Math.round(((collectedOnSite ? total : paid) / total) * 100)) : 0;
  const fullyPaid = remaining === 0 || booking.payment_status === 'payment_done' || collectedOnSite;
  const paypalLink = boat?.paypal_username && remaining > 0
    ? `https://paypal.me/${boat.paypal_username}/${remaining}`
    : null;

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white text-sm">{EXP_LABELS[booking.experience_type] || booking.experience_type}</p>
          <p className="text-xs text-white/35 mt-0.5">
            {booking.date ? format(parseISO(booking.date), 'MMM d, yyyy') : '—'} · {booking.boat_name}
          </p>
        </div>
        {fullyPaid ? (
          <div className="flex items-center gap-1 text-emerald-400 shrink-0">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-semibold">Paid</span>
          </div>
        ) : (
          <div className="text-right shrink-0">
            <p className="text-amber-400 text-sm font-bold">${remaining.toLocaleString()}</p>
            <p className="text-xs text-white/25">remaining</p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-white/35">
          <span>Paid: ${paid.toLocaleString()} MXN</span>
          <span>Total: ${total.toLocaleString()} MXN</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: fullyPaid ? '#10b981' : 'linear-gradient(90deg, #1e88e5, #60b4ff)' }} />
        </div>
        <p className="text-xs text-white/20">{pct}% of total paid</p>
      </div>

      {/* Action */}
      {!fullyPaid && paypalLink && (
        <Button onClick={() => window.open(paypalLink, '_blank')} className="w-full h-11 rounded-xl font-semibold text-sm gap-2" style={{ background: 'linear-gradient(135deg, #003087, #009cde)', border: 'none' }}>
          <ExternalLink className="h-4 w-4" />
          Pay ${remaining.toLocaleString()} MXN via PayPal
        </Button>
      )}
      {!fullyPaid && !paypalLink && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-xs text-white/35" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          Contact your operator to complete payment
        </div>
      )}
    </div>
  );
}