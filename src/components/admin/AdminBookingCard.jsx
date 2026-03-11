import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon, Clock, Users, Mail, Phone, DollarSign,
  CheckCircle2, XCircle, Info, Trash2, PenSquare, FileText,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import TripReportDialog from './TripReportDialog';

const statusColors = {
  pending:   'bg-amber-400/20 text-amber-200 border border-amber-400/40',
  confirmed: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40',
  cancelled: 'bg-red-400/20 text-red-200 border border-red-400/40',
  completed: 'bg-blue-400/20 text-blue-200 border border-blue-400/40',
};

const statusBorderColor = {
  pending:   'border-l-amber-400',
  confirmed: 'border-l-emerald-400',
  cancelled: 'border-l-red-400',
  completed: 'border-l-blue-400',
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle2,
  cancelled: XCircle,
  completed: CheckCircle2,
};

function CompletionIndicator({ booking, hasExpenses }) {
  const [show, setShow] = useState(false);

  const balancePaid =
    booking.remaining_payment_status === 'collected_on_site' ||
    Math.max(0, (booking.total_price || 0) - (booking.deposit_paid || 0)) === 0;

  const criteria = [
    { label: 'Data Entry (Expenses)', done: hasExpenses },
    { label: 'Trip Completed',        done: booking.status === 'completed' },
    { label: 'Balance Collected',     done: balancePaid },
    { label: 'Operator Paid',         done: booking.payment_status === 'payment_done' },
  ];

  const completed = criteria.filter(c => c.done).length;
  const total = criteria.length;
  const allDone = completed === total;

  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const arc = completed === 0 ? 0 : (completed / total) * circumference;
  const ringColor = allDone ? '#34d399'
    : completed >= 3 ? '#fbbf24'
    : completed >= 2 ? '#60a5fa'
    : '#f87171';

  return (
    <div className="relative shrink-0" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {allDone ? (
        <div className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.2)', border: '2px solid rgba(16,185,129,0.5)' }}>
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
      ) : (
        <div className="w-9 h-9 relative flex items-center justify-center cursor-help">
          <svg width="36" height="36" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
            <circle cx="18" cy="18" r={radius} fill="none" stroke={ringColor} strokeWidth="2.5"
              strokeDasharray={`${arc} ${circumference}`} strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-bold relative z-10" style={{ color: ringColor }}>
            {completed}/{total}
          </span>
        </div>
      )}
      {show && (
        <div className="absolute right-0 top-11 z-[100] w-56 rounded-xl p-3 shadow-2xl pointer-events-none"
          style={{ background: 'rgba(8,18,38,0.98)', border: '1px solid rgba(30,136,229,0.35)', backdropFilter: 'blur(20px)' }}>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2.5">
            {allDone ? '✅ All Complete' : `${completed}/${total} Complete`}
          </p>
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              {c.done
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                : <div className="h-3.5 w-3.5 rounded-full shrink-0" style={{ border: '1.5px solid rgba(255,255,255,0.25)' }} />}
              <span className={`text-xs ${c.done ? 'text-white/40 line-through' : 'text-white/85'}`}>{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminBookingCard({
  booking,
  allBoats,
  expenses,
  hasElevatedAccess,
  getBookingExpenses,
  getBookingEarnings,
  getOperatorCommission,
  getOperatorPaypal,
  updatePaymentStatusMutation,
  updateRemainingPaymentMutation,
  updateRemainingMethodMutation,
  handleStatusChange,
  deleteBookingMutation,
  setExpenseBooking,
  setExpenseDialogOpen,
}) {
  const [reportOpen, setReportOpen] = useState(false);

  const StatusIcon = statusIcons[booking.status] || Clock;
  const expenseTotal = getBookingExpenses(booking.id);
  const hasExpenses = expenseTotal > 0;
  const boat = allBoats.find(b => b.name === booking.boat_name);
  const opName = boat?.operator?.trim() || (booking.boat_name ? 'FILU' : null);
  const commission = getOperatorCommission(booking.boat_name);
  const expenseRecord = expenses?.find(e => e.booking_id === booking.id);

  // Payment section data
  const remaining = Math.max(0, (booking.total_price || 0) - (booking.deposit_paid || 0));
  const isCollected = booking.remaining_payment_status === 'collected_on_site';
  const paypalUser = getOperatorPaypal(booking.boat_name);
  const isPaid = booking.payment_status === 'payment_done';

  // Summary badges for collapsed payment section
  const balanceBadge = isCollected
    ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">✅ Collected</span>
    : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">⏳ ${remaining.toLocaleString(undefined,{maximumFractionDigits:0})} MXN</span>;

  const operatorBadge = paypalUser
    ? isPaid
      ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">✅ Paid</span>
      : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">⏳ Pending</span>
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className={`rounded-2xl border-l-4 ${statusBorderColor[booking.status]} overflow-visible`}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
      >
        <div className="p-4">

          {/* ── TOP ROW: name/badges + indicators ── */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {/* Name + status badges */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="font-semibold text-base text-white">{booking.guest_name}</h3>
                {opName && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.35)', color: '#fdba74' }}>
                    {opName}
                  </span>
                )}
                <Badge className={statusColors[booking.status]}>
                  <StatusIcon className="h-3 w-3 mr-1" />{booking.status}
                </Badge>
              </div>

              {/* Code, location, boat */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <p className="text-xs text-white/40">Code: <span className="font-mono text-white/60">{booking.confirmation_code}</span></p>
                <span className="text-xs px-2 py-0.5 rounded-full text-white/50"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {booking.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}
                </span>
                {booking.boat_name && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(30,136,229,0.2)', border: '1px solid rgba(30,136,229,0.35)', color: '#60b4ff' }}>
                    {booking.boat_name}
                  </span>
                )}
              </div>

              {/* Key info strip */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                {booking.date && (
                  <span><span className="text-white/30">Date:</span> {format(parseISO(booking.date), 'MMM d, yyyy')}</span>
                )}
                {booking.time_slot && (
                  <span><span className="text-white/30">Departure:</span> {booking.time_slot}</span>
                )}
                <span><span className="text-white/30">Guests:</span> {booking.guests}</span>
                {booking.pickup_location && (
                  <span><span className="text-white/30">Pickup:</span> {booking.pickup_location}</span>
                )}
                {booking.created_date && (
                  <span><span className="text-white/30">Created:</span> {format(parseISO(booking.created_date), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>

            {/* Right column: completion ring + PDF button */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <CompletionIndicator booking={booking} hasExpenses={hasExpenses} />
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1 text-[10px] text-blue-400/60 hover:text-blue-300 transition-colors"
                title="Generate Trip Report"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Report</span>
              </button>
            </div>
          </div>

          {/* ── FINANCIAL SUMMARY (always visible) ── */}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
            <span><span className="text-white/30">Revenue:</span> <span className="text-emerald-300/80 font-semibold">${(booking.total_price || 0).toLocaleString()} MXN</span></span>
            <span><span className="text-white/30">Expenses:</span> <span className="text-red-300/80 font-medium">${expenseTotal.toLocaleString()} MXN</span></span>
            <span><span className="text-white/30">Net:</span> <span className={`font-medium ${getBookingEarnings(booking) >= 0 ? 'text-purple-300/80' : 'text-red-300/80'}`}>${getBookingEarnings(booking).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</span></span>
            {commission > 0 && (
              <span><span className="text-white/30">Fee:</span> <span className="text-orange-300/70">{commission}% (${((booking.total_price || 0) * commission / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN)</span></span>
            )}
          </div>

          {/* ── PAYMENT SECTION (always visible) ── */}
          {hasElevatedAccess && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2.5">
              {/* On-site balance */}
              {booking.total_price > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/75">
                    💵 On-Site Balance{' '}
                    <span className={isCollected ? 'text-emerald-400' : 'text-amber-400'}>
                      ({remaining > 0 ? `$${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN` : 'Fully Paid'})
                    </span>
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Select
                      value={booking.remaining_payment_status || 'pending_collection'}
                      onValueChange={(val) => updateRemainingPaymentMutation.mutate({ id: booking.id, remaining_payment_status: val })}
                    >
                      <SelectTrigger className="h-7 text-xs w-auto px-2" style={{
                        background: isCollected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)',
                        border: isCollected ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.3)',
                        color: isCollected ? '#6ee7b7' : '#fca5a5',
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending_collection">⏳ Pending Collection</SelectItem>
                        <SelectItem value="collected_on_site">✅ Collected On-Site</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={booking.remaining_payment_method || ''}
                      onValueChange={(val) => updateRemainingMethodMutation.mutate({ id: booking.id, remaining_payment_method: val })}
                    >
                      <SelectTrigger className="h-7 text-xs w-auto px-2" style={{
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1',
                      }}>
                        <SelectValue placeholder="Method…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Cash</SelectItem>
                        <SelectItem value="card">💳 Card</SelectItem>
                        <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                        <SelectItem value="paypal">🅿️ PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Operator payment */}
              {paypalUser && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/75">
                    🏦 Operator Payment
                    {commission > 0 && (
                      <span className={`ml-2 normal-case font-semibold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        → ${((booking.total_price || 0) - (booking.total_price || 0) * commission / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <a
                      href={`https://www.paypal.com/paypalme/${paypalUser}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: 'rgba(0,100,204,0.25)', border: '1px solid rgba(0,100,204,0.45)', color: '#93c5fd' }}
                    >
                      <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" className="h-3.5 w-3.5 rounded-sm" />
                      Pay via PayPal
                    </a>
                    <Select
                      value={booking.payment_status || 'pending_payment'}
                      onValueChange={(val) => updatePaymentStatusMutation.mutate({ id: booking.id, payment_status: val })}
                    >
                      <SelectTrigger className="h-7 text-xs w-auto px-2" style={{
                        background: isPaid ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                        border: isPaid ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(245,158,11,0.4)',
                        color: isPaid ? '#6ee7b7' : '#fcd34d',
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending_payment">⏳ Pending Payment</SelectItem>
                        <SelectItem value="payment_done">✅ Payment Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIONS (always visible inline) ── */}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Actions</span>
            <div className="flex flex-wrap items-center gap-2 ml-auto">

            <Button
              size="sm"
              className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300"
              style={{ border: '1px solid rgba(16,185,129,0.25)' }}
              onClick={() => { setExpenseBooking(booking); setExpenseDialogOpen(true); }}
            >
              <PenSquare className="h-3 w-3 mr-1.5" />Data Entry
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-blue-500/25"
                  style={{ background: 'rgba(30,136,229,0.18)', border: '1px solid rgba(30,136,229,0.35)', color: 'rgb(147,197,253)' }}
                >
                  <Info className="h-3 w-3" />Details
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-slate-500">Guest Name</Label><p className="font-medium">{booking.guest_name}</p></div>
                    <div><Label className="text-slate-500">Status</Label><div className="mt-1"><Badge className={statusColors[booking.status]}>{booking.status}</Badge></div></div>
                    <div><Label className="text-slate-500">Email</Label><p className="font-medium flex items-center gap-2"><Mail className="h-4 w-4" />{booking.guest_email}</p></div>
                    <div><Label className="text-slate-500">Phone</Label><p className="font-medium flex items-center gap-2"><Phone className="h-4 w-4" />{booking.guest_phone}</p></div>
                    <div><Label className="text-slate-500">Location</Label><p className="font-medium">{booking.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}</p></div>
                    <div><Label className="text-slate-500">Experience</Label><p className="font-medium capitalize">{booking.experience_type?.replace(/_/g, ' ')}</p></div>
                    <div><Label className="text-slate-500">Boat</Label><p className="font-medium">{booking.boat_name || 'N/A'}</p></div>
                    <div><Label className="text-slate-500">Pickup</Label><p className="font-medium">{booking.pickup_location || 'N/A'}</p></div>
                    <div><Label className="text-slate-500">Date</Label><p className="font-medium">{format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}</p></div>
                    <div><Label className="text-slate-500">Created</Label><p className="font-medium">{format(parseISO(booking.created_date), 'MMM d, yyyy h:mm a')}</p></div>
                    <div><Label className="text-slate-500">Time</Label><p className="font-medium">{booking.time_slot}</p></div>
                    <div><Label className="text-slate-500">Guests</Label><p className="font-medium">{booking.guests}</p></div>
                    <div><Label className="text-slate-500">Total Price</Label><p className="font-medium">${booking.total_price?.toLocaleString()} MXN</p></div>
                    <div><Label className="text-slate-500">Deposit Paid</Label><p className="font-medium">${booking.deposit_paid?.toLocaleString()} MXN</p></div>
                    <div><Label className="text-slate-500">Payment Method</Label><p className="font-medium">{booking.payment_method}</p></div>
                  </div>
                  {booking.payment_screenshot && (
                    <div>
                      <Label className="text-slate-500">Payment Screenshot</Label>
                      <div className="mt-2">
                        <a href={booking.payment_screenshot} target="_blank" rel="noopener noreferrer">
                          <img src={booking.payment_screenshot} alt="Payment proof" className="w-full max-w-md h-48 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer" />
                        </a>
                      </div>
                    </div>
                  )}
                  {booking.add_ons?.length > 0 && (
                    <div>
                      <Label className="text-slate-500">Add-ons</Label>
                      <ul className="mt-1 list-disc list-inside">
                        {booking.add_ons.map((addon, i) => <li key={i} className="text-sm">{addon.replace(/_/g, ' ')}</li>)}
                      </ul>
                    </div>
                  )}
                  {booking.special_requests && (
                    <div>
                      <Label className="text-slate-500">Special Requests</Label>
                      <p className="mt-1 text-sm bg-slate-50 p-3 rounded-lg">{booking.special_requests}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-slate-500 mb-2 block">Change Status</Label>
                    <div className="flex gap-2 flex-wrap">
                      {['pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                        <Button key={s} size="sm" variant={booking.status === s ? 'default' : 'outline'}
                          onClick={() => handleStatusChange(booking.id, s)} className="capitalize">{s}</Button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Select value={booking.status} onValueChange={(value) => handleStatusChange(booking.id, value)}>
              <SelectTrigger className="w-[130px] text-xs bg-white/5 border-white/10 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400"
              style={{ border: '1px solid rgba(239,68,68,0.2)' }}
              onClick={() => { if (window.confirm(`Delete booking ${booking.confirmation_code}? This cannot be undone.`)) deleteBookingMutation.mutate(booking.id); }}
              disabled={deleteBookingMutation.isPending}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Report Dialog */}
      <TripReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        booking={booking}
        expenseRecord={expenseRecord}
        commissionPct={commission}
      />
    </motion.div>
  );
}