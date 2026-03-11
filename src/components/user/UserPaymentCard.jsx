import React from 'react';
import { format, parseISO } from 'date-fns';
import { ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXP_LABELS = {
  half_day_fishing: 'Half Day Fishing',
  full_day_fishing: 'Full Day Fishing',
  extended_fishing: 'Extended Fishing',
  snorkeling: 'Snorkeling',
  coastal_leisure: 'Coastal Leisure',
};

const PAYMENT_METHOD_LABELS = {
  cash: '💵 Cash',
  card: '💳 Card',
  bank_transfer: '🏦 Bank Transfer',
  paypal: '🅿️ PayPal',
  whatsapp: '💬 WhatsApp',
};

export default function UserPaymentCard({ booking }) {
  const total = booking.total_price || 0;
  const paid = booking.deposit_paid || 0;
  const rawRemaining = Math.max(0, total - paid);
  const collectedOnSite = booking.remaining_payment_status === 'collected_on_site';
  const remaining = collectedOnSite ? 0 : rawRemaining;
  const pct = total > 0 ? Math.min(100, Math.round(((collectedOnSite ? total : paid) / total) * 100)) : 0;
  const fullyPaid = remaining === 0 || booking.payment_status === 'payment_done' || collectedOnSite;

  // Always link to @filumarine for remaining balance
  const paypalLink = remaining > 0 ? `https://paypal.me/filumarine/${remaining}` : null;

  const depositMethodLabel = PAYMENT_METHOD_LABELS[booking.payment_method] || (booking.payment_method?.replace(/_/g, ' ') || '—');
  const balanceMethodLabel = booking.remaining_payment_method
    ? (PAYMENT_METHOD_LABELS[booking.remaining_payment_method] || booking.remaining_payment_method.replace(/_/g, ' '))
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
            <span className="text-xs font-semibold">Fully Paid</span>
          </div>
        ) : (
          <div className="text-right shrink-0">
            <p className="text-amber-400 text-sm font-bold">${remaining.toLocaleString()} MXN</p>
            <p className="text-xs text-white/25">remaining</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-white/35">
          <span>${(collectedOnSite ? total : paid).toLocaleString()} MXN paid</span>
          <span>${total.toLocaleString()} MXN total</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: fullyPaid ? '#10b981' : 'linear-gradient(90deg, #1e88e5, #60b4ff)' }} />
        </div>
        <p className="text-xs text-white/20">{pct}% of total paid</p>
      </div>

      {/* Deposit breakdown */}
      <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40 font-medium">💰 Deposit Paid</span>
          <div className="text-right">
            <p className="text-emerald-400 font-semibold">${paid.toLocaleString()} MXN</p>
            {booking.payment_method && (
              <p className="text-white/30 text-xs mt-0.5">{depositMethodLabel}</p>
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.05] pt-2 flex items-center justify-between text-xs">
          <span className="text-white/40 font-medium">🏖️ Balance (On Arrival)</span>
          <div className="text-right">
            {collectedOnSite ? (
              <div>
                <p className="text-emerald-400 font-semibold">✅ Collected</p>
                {balanceMethodLabel && <p className="text-white/30 text-xs mt-0.5">{balanceMethodLabel}</p>}
              </div>
            ) : (
              <div>
                <p className="text-amber-400 font-semibold">${rawRemaining.toLocaleString()} MXN</p>
                <p className="text-white/30 text-xs mt-0.5">Due on arrival</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PayPal button — always @filumarine */}
      {!fullyPaid && paypalLink && (
        <Button
          onClick={() => window.open(paypalLink, '_blank')}
          className="w-full h-11 rounded-xl font-semibold text-sm gap-2"
          style={{ background: 'linear-gradient(135deg, #003087, #009cde)', border: 'none' }}
        >
          <ExternalLink className="h-4 w-4" />
          Pay ${remaining.toLocaleString()} MXN via PayPal
        </Button>
      )}
    </div>
  );
}