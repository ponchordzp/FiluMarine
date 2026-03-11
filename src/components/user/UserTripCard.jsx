import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Users, Ship, Hash } from 'lucide-react';

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

export default function UserTripCard({ booking }) {
  const s = STATUS[booking.status] || STATUS.pending;
  const tripDate = booking.date ? parseISO(booking.date) : null;
  const upcoming = tripDate && new Date(booking.date) >= new Date(new Date().toDateString());

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{
      background: upcoming ? 'rgba(30,136,229,0.08)' : 'rgba(255,255,255,0.04)',
      border: upcoming ? '1px solid rgba(30,136,229,0.2)' : '1px solid rgba(255,255,255,0.08)',
    }}>
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

      {booking.total_price > 0 && (
        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
          <span className="text-xs text-white/30">Total Price</span>
          <span className="text-sm font-bold text-white">${booking.total_price?.toLocaleString()} MXN</span>
        </div>
      )}
    </div>
  );
}