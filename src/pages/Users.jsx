import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Anchor, LogOut, Ship, CreditCard, Gift, User, Waves } from 'lucide-react';
import UserTripCard from '@/components/user/UserTripCard';
import UserPaymentCard from '@/components/user/UserPaymentCard';
import UserAddOnsTab from '@/components/user/UserAddOnsTab';
import UserProfileTab from '@/components/user/UserProfileTab';

const TABS = [
  { id: 'trips',    label: 'My Trips', Icon: Ship },
  { id: 'payments', label: 'Payments', Icon: CreditCard },
  { id: 'addons',   label: 'Add-Ons',  Icon: Gift },
  { id: 'profile',  label: 'Profile',  Icon: User },
];

export default function Users() {
  const [customer, setCustomer] = useState(null);
  const [tab, setTab] = useState('trips');

  useEffect(() => {
    const saved = localStorage.getItem('filuCustomerUser');
    if (!saved) {
      window.location.href = createPageUrl('UserLogin');
      return;
    }
    setCustomer(JSON.parse(saved));
  }, []);

  const { data: bookings = [] } = useQuery({
    queryKey: ['customer-bookings', customer?.email],
    queryFn: () => base44.entities.Booking.filter({ guest_email: customer.email }),
    enabled: !!customer?.email,
  });

  const { data: allBoats = [] } = useQuery({
    queryKey: ['boats-paypal'],
    queryFn: () => base44.entities.BoatInventory.list(),
    enabled: !!customer,
  });

  const today = new Date(new Date().toDateString());
  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && b.date && new Date(b.date) >= today);
  const pastBookings = bookings.filter(b => b.status !== 'cancelled' && b.date && new Date(b.date) < today);
  const totalPaid = bookings.reduce((s, b) => s + (b.deposit_paid || 0), 0);
  const formatMXN = n => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;

  function handleLogout() {
    localStorage.removeItem('filuCustomerUser');
    window.location.href = createPageUrl('UserLogin');
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #040d1a, #0a1f3d)' }}>
        <div className="text-white/30 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  const initials = (customer.full_name || customer.username || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(150deg, #040d1a 0%, #0a1f3d 55%, #071429 100%)' }}>
      {/* Decorative */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #1e88e5, transparent)', transform: 'translate(30%, -30%)' }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(4,13,26,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, rgba(30,136,229,0.35), rgba(13,95,168,0.35))', border: '1px solid rgba(30,136,229,0.3)' }}>
              {initials}
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{customer.full_name || customer.username}</p>
              <p className="text-white/30 text-xs truncate max-w-[180px]">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(30,136,229,0.1)', border: '1px solid rgba(30,136,229,0.2)' }}>
              <Anchor className="h-3.5 w-3.5 text-[#1e88e5]" />
              <span className="text-xs text-[#60b4ff] font-medium">FILU</span>
            </div>
            <Button size="icon" variant="ghost" onClick={handleLogout} className="w-8 h-8 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Upcoming', value: upcomingBookings.length, color: '#60b4ff' },
            { label: 'Completed', value: pastBookings.filter(b => b.status === 'completed').length, color: '#6ee7b7' },
            { label: 'Total Paid', value: formatMXN(totalPaid), color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-bold text-xl leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-white/25 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'trips' && (
          <div className="space-y-3">
            {upcomingBookings.length > 0 && (
              <>
                <p className="text-xs text-white/25 uppercase tracking-wider font-semibold px-1">Upcoming</p>
                {upcomingBookings.sort((a, b) => new Date(a.date) - new Date(b.date)).map(b => <UserTripCard key={b.id} booking={b} />)}
              </>
            )}
            {pastBookings.length > 0 && (
              <>
                <p className="text-xs text-white/25 uppercase tracking-wider font-semibold px-1 pt-2">Past Trips</p>
                {pastBookings.sort((a, b) => new Date(b.date) - new Date(a.date)).map(b => <UserTripCard key={b.id} booking={b} />)}
              </>
            )}
            {bookings.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <Waves className="h-14 w-14 text-white/8 mx-auto" />
                <p className="text-white/25 text-sm">No bookings found for {customer.email}</p>
                <Button size="sm" onClick={() => window.location.href = createPageUrl('Home')} className="text-xs rounded-xl px-4" style={{ background: 'rgba(30,136,229,0.2)', border: '1px solid rgba(30,136,229,0.3)', color: '#60b4ff' }}>
                  Book a Trip
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-3">
            {upcomingBookings.filter(b => b.total_price > 0).map(b => (
              <UserPaymentCard key={b.id} booking={b} allBoats={allBoats} />
            ))}
            {upcomingBookings.filter(b => b.total_price > 0).length === 0 && (
              <div className="text-center py-16 space-y-2">
                <CreditCard className="h-12 w-12 text-white/8 mx-auto" />
                <p className="text-white/25 text-sm">No pending payments</p>
              </div>
            )}
          </div>
        )}

        {tab === 'addons' && (
          <UserAddOnsTab
            upcomingBookings={upcomingBookings}
            customerEmail={customer.email}
            customerName={customer.full_name || customer.username}
          />
        )}

        {tab === 'profile' && (
          <UserProfileTab
            customer={customer}
            onUpdate={updated => {
              setCustomer(updated);
              localStorage.setItem('filuCustomerUser', JSON.stringify(updated));
            }}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 inset-x-0 z-30" style={{ background: 'rgba(4,13,26,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-lg mx-auto flex">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors">
              <Icon className={`h-5 w-5 transition-colors ${tab === id ? 'text-[#1e88e5]' : 'text-white/20'}`} />
              <span className={`text-xs font-medium transition-colors ${tab === id ? 'text-[#60b4ff]' : 'text-white/20'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}