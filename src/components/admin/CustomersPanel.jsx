import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { Mail, Phone, User, Calendar, Ship, Gift, CreditCard, CheckCircle, XCircle, Search, Users } from 'lucide-react';

const EXP_LABELS = {
  half_day_fishing: 'Half Day Fishing',
  full_day_fishing: 'Full Day Fishing',
  extended_fishing: 'Extended Fishing',
  snorkeling: 'Snorkeling',
  coastal_leisure: 'Coastal Leisure',
};

export default function CustomersPanel() {
  const [search, setSearch] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customer-users'],
    queryFn: () => base44.entities.CustomerUser.list('-created_date'),
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['all-bookings-customers'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const { data: addonRequests = [] } = useQuery({
    queryKey: ['all-addon-requests'],
    queryFn: () => base44.entities.CustomerAddOnRequest.list('-created_date'),
  });

  const filtered = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.username?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header + search */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Customers</h2>
          <p className="text-white/35 text-sm mt-0.5">{customers.length} registered customer{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, username…"
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-14 w-14 text-white/8 mx-auto mb-3" />
          <p className="text-white/25 text-sm">{search ? 'No customers match your search' : 'No registered customers yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(customer => {
            const bookings = allBookings.filter(b => b.guest_email?.toLowerCase() === customer.email?.toLowerCase());
            const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && b.date && new Date(b.date) >= new Date(new Date().toDateString()));
            const completedBookings = bookings.filter(b => b.status === 'completed');
            const activeBookings = bookings.filter(b => b.status !== 'cancelled');
            const totalSpent = activeBookings.reduce((s, b) => s + (b.deposit_paid || 0), 0);
            const totalRevenue = activeBookings.reduce((s, b) => s + (b.total_price || 0), 0);
            const pending = activeBookings.reduce((s, b) => {
              if (b.remaining_payment_status === 'collected_on_site') return s;
              return s + Math.max(0, (b.total_price || 0) - (b.deposit_paid || 0));
            }, 0);
            const requests = addonRequests.filter(r => r.customer_email?.toLowerCase() === customer.email?.toLowerCase());
            const pendingRequests = requests.filter(r => r.status === 'pending');
            const initials = (customer.full_name || customer.username || '?')[0].toUpperCase();

            return (
              <div
                key={customer.id}
                className="rounded-2xl p-5 space-y-4 flex flex-col"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
              >
                {/* Top: avatar + name + status */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(30,136,229,0.3), rgba(13,95,168,0.3))', border: '1px solid rgba(30,136,229,0.25)' }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white text-sm leading-tight truncate">{customer.full_name || customer.username}</p>
                      {customer.is_active !== false ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs shrink-0">
                          <XCircle className="h-3 w-3 mr-1" />Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-white/35 text-xs mt-0.5">@{customer.username}</p>
                    <p className="text-white/25 text-xs">
                      Joined {customer.created_date ? format(parseISO(customer.created_date), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-white/25 shrink-0" />
                    <span className="text-xs text-white/50 truncate">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-white/25 shrink-0" />
                      <span className="text-xs text-white/50">{customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Booking stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(30,136,229,0.1)', border: '1px solid rgba(30,136,229,0.18)' }}>
                    <p className="font-bold text-[#60b4ff] text-lg leading-none">{bookings.length}</p>
                    <p className="text-white/30 text-xs mt-0.5">Bookings</p>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.18)' }}>
                    <p className="font-bold text-emerald-300 text-lg leading-none">{completedBookings.length}</p>
                    <p className="text-white/30 text-xs mt-0.5">Completed</p>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.18)' }}>
                    <p className="font-bold text-amber-300 text-lg leading-none">{upcomingBookings.length}</p>
                    <p className="text-white/30 text-xs mt-0.5">Upcoming</p>
                  </div>
                </div>

                {/* Financial */}
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-xs text-white/35 font-medium uppercase tracking-wider">Payments</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/35">Total Revenue</span>
                    <span className="text-emerald-300 font-semibold">${totalRevenue.toLocaleString()} MXN</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/35">Paid (Deposit)</span>
                    <span className="text-white/55">${totalSpent.toLocaleString()} MXN</span>
                  </div>
                  {pending > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/35">Remaining</span>
                      <span className="text-amber-300 font-semibold">${pending.toLocaleString()} MXN</span>
                    </div>
                  )}
                </div>

                {/* Upcoming trips */}
                {upcomingBookings.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-white/25" />
                      <span className="text-xs text-white/35 font-medium uppercase tracking-wider">Upcoming Trips</span>
                    </div>
                    {upcomingBookings.slice(0, 2).map(b => (
                      <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(30,136,229,0.08)', border: '1px solid rgba(30,136,229,0.15)' }}>
                        <Ship className="h-3.5 w-3.5 text-[#60b4ff] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/60 truncate">{EXP_LABELS[b.experience_type] || b.experience_type}</p>
                          <p className="text-xs text-white/30">{b.date ? format(parseISO(b.date), 'MMM d') : ''} · {b.boat_name}</p>
                        </div>
                        <Badge className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0">
                          {b.status}
                        </Badge>
                      </div>
                    ))}
                    {upcomingBookings.length > 2 && (
                      <p className="text-xs text-white/20 text-center">+{upcomingBookings.length - 2} more</p>
                    )}
                  </div>
                )}

                {/* Add-on requests */}
                {requests.length > 0 && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Gift className="h-3.5 w-3.5 text-purple-300/60" />
                      <span className="text-xs text-purple-300/60 font-medium uppercase tracking-wider">Add-On Requests</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/35">{requests.length} total request{requests.length !== 1 ? 's' : ''}</span>
                      {pendingRequests.length > 0 && (
                        <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                          {pendingRequests.length} pending
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}