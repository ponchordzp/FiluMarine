import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Gift, Clock, CheckCircle, XCircle, Waves } from 'lucide-react';

const ADD_ONS = [
  { id: 'cocktails',    label: 'Cocktail Package',     icon: '🍹', desc: 'Premium drinks on board' },
  { id: 'photos',       label: 'Photo & Video',        icon: '📸', desc: 'Professional shots' },
  { id: 'snorkel_gear', label: 'Snorkeling Gear',      icon: '🤿', desc: 'Full snorkel set' },
  { id: 'catering',     label: 'Catering Package',     icon: '🍱', desc: 'Local food & snacks' },
  { id: 'fishing_gear', label: 'Premium Fishing Gear', icon: '🎣', desc: 'High-end rods & tackle' },
  { id: 'cooler',       label: 'Fish Cooler + Ice',    icon: '🧊', desc: 'Keep your catch fresh' },
  { id: 'transfer',     label: 'Private Transfer',     icon: '🚗', desc: 'Hotel to marina' },
  { id: 'music',        label: 'Sound System',         icon: '🎵', desc: 'Waterproof speakers' },
];

const EXP_LABELS = {
  half_day_fishing: 'Half Day Fishing',
  full_day_fishing: 'Full Day Fishing',
  extended_fishing: 'Extended Fishing',
  snorkeling: 'Snorkeling',
  coastal_leisure: 'Coastal Leisure',
};

const STATUS_CFG = {
  pending:  { Icon: Clock,         cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',   label: 'Pending' },
  approved: { Icon: CheckCircle,   cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Approved' },
  rejected: { Icon: XCircle,       cls: 'bg-red-500/20 text-red-300 border-red-500/30',            label: 'Rejected' },
};

export default function UserAddOnsTab({ upcomingBookings, customerEmail, customerName }) {
  const [selectedId, setSelectedId] = useState(upcomingBookings[0]?.id || '');
  const [selected, setSelected] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const qc = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['addon-requests', customerEmail],
    queryFn: () => base44.entities.CustomerAddOnRequest.filter({ customer_email: customerEmail }),
  });

  const submitMutation = useMutation({
    mutationFn: data => base44.entities.CustomerAddOnRequest.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['addon-requests', customerEmail]);
      setSelected([]);
      setNotes('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    },
  });

  const booking = upcomingBookings.find(b => b.id === selectedId);

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleSubmit() {
    if (!selectedId || selected.length === 0) return;
    submitMutation.mutate({
      booking_id: selectedId,
      customer_email: customerEmail,
      customer_name: customerName,
      boat_name: booking?.boat_name,
      trip_date: booking?.date,
      requested_items: selected,
      notes,
      status: 'pending',
    });
  }

  if (upcomingBookings.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <Waves className="h-12 w-12 text-white/10 mx-auto" />
        <p className="text-white/30 text-sm">No upcoming trips to add extras to</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trip selector */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold text-white/60">Select Trip</p>
        {upcomingBookings.map(b => (
          <button key={b.id} onClick={() => setSelectedId(b.id)} className="w-full p-3 rounded-xl text-left transition-all" style={{
            background: selectedId === b.id ? 'rgba(30,136,229,0.15)' : 'rgba(255,255,255,0.03)',
            border: selectedId === b.id ? '1px solid rgba(30,136,229,0.4)' : '1px solid rgba(255,255,255,0.06)',
          }}>
            <p className="text-sm text-white font-medium">{EXP_LABELS[b.experience_type] || b.experience_type}</p>
            <p className="text-xs text-white/35 mt-0.5">
              {b.date ? format(parseISO(b.date), 'MMM d, yyyy') : ''} · {b.boat_name}
            </p>
          </button>
        ))}
      </div>

      {/* Add-ons grid */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold text-white/60">Available Extras</p>
        <div className="grid grid-cols-2 gap-2">
          {ADD_ONS.map(ao => {
            const on = selected.includes(ao.id);
            return (
              <button key={ao.id} onClick={() => toggle(ao.id)} className="p-3 rounded-xl text-left transition-all active:scale-95" style={{
                background: on ? 'rgba(30,136,229,0.15)' : 'rgba(255,255,255,0.03)',
                border: on ? '1px solid rgba(30,136,229,0.4)' : '1px solid rgba(255,255,255,0.06)',
              }}>
                <div className="text-2xl mb-1.5">{ao.icon}</div>
                <p className={`text-xs font-semibold leading-tight ${on ? 'text-white' : 'text-white/55'}`}>{ao.label}</p>
                <p className="text-xs text-white/25 mt-0.5">{ao.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <Textarea
        placeholder="Any special requests or notes for the crew…"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={3}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl resize-none"
      />

      <Button
        onClick={handleSubmit}
        disabled={selected.length === 0 || !selectedId || submitMutation.isPending}
        className="w-full h-11 rounded-xl font-semibold text-sm"
        style={{ background: submitted ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #1e88e5, #0d5fa8)', border: submitted ? '1px solid rgba(16,185,129,0.4)' : 'none', color: submitted ? '#6ee7b7' : 'white' }}
      >
        {submitted ? '✓ Request Sent!' : submitMutation.isPending ? 'Sending…' : `Request ${selected.length > 0 ? selected.length + ' ' : ''}Extra${selected.length !== 1 ? 's' : ''}`}
      </Button>

      {/* Request history */}
      {requests.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-white/25 uppercase tracking-wider font-medium px-1">My Requests</p>
          {requests.map(req => {
            const sc = STATUS_CFG[req.status] || STATUS_CFG.pending;
            return (
              <div key={req.id} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">{req.trip_date ? format(parseISO(req.trip_date), 'MMM d') : ''} · {req.boat_name}</p>
                  <Badge className={`${sc.cls} border text-xs`}><sc.Icon className="h-3 w-3 mr-1" />{sc.label}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(req.requested_items || []).map(item => {
                    const ao = ADD_ONS.find(a => a.id === item);
                    return (
                      <span key={item} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(30,136,229,0.12)', color: '#60b4ff', border: '1px solid rgba(30,136,229,0.2)' }}>
                        {ao?.icon} {ao?.label || item}
                      </span>
                    );
                  })}
                </div>
                {req.notes && <p className="text-xs text-white/25 italic">"{req.notes}"</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}