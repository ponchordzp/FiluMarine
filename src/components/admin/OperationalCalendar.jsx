import React, { useState } from 'react';
import { differenceInDays, parseISO, format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Wrench, CreditCard, Calendar, AlertTriangle } from 'lucide-react';

// Build all events from boats data
function buildEvents(boats) {
  const events = [];
  const today = new Date();

  boats.forEach(boat => {
    // Next service date from maintenance_schedule field
    if (boat.maintenance_schedule) {
      // Try to parse as date
      const parsed = new Date(boat.maintenance_schedule);
      if (!isNaN(parsed.getTime())) {
        const daysUntil = differenceInDays(parsed, today);
        events.push({
          date: format(parsed, 'yyyy-MM-dd'),
          type: 'service',
          label: `${boat.name} — Next Service`,
          boat: boat.name,
          daysUntil,
          cost: boat.next_service_type === 'major'
            ? (boat.major_maintenance_cost || 0) * (boat.engine_quantity || 1)
            : (boat.minor_maintenance_cost || 0) * (boat.engine_quantity || 1),
          serviceType: boat.next_service_type || 'minor',
        });
      }
    }

    // Recurring cost next payment dates
    (boat.recurring_costs || []).forEach(cost => {
      if (!cost.next_payment_date) return;
      const parsed = parseISO(cost.next_payment_date);
      const daysUntil = differenceInDays(parsed, today);
      events.push({
        date: cost.next_payment_date,
        type: 'payment',
        label: `${boat.name} — ${cost.name}`,
        boat: boat.name,
        daysUntil,
        cost: cost.amount || 0,
        category: cost.category || 'other',
        frequency: cost.frequency_months,
      });
    });
  });

  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function urgencyStyle(daysUntil) {
  if (daysUntil <= 0) return { dot: 'bg-red-500', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
  if (daysUntil <= 14) return { dot: 'bg-amber-500', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  if (daysUntil <= 45) return { dot: 'bg-yellow-500', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
  return { dot: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
}

const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX')} MXN`;

export default function OperationalCalendar({ boats }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('calendar'); // 'calendar' | 'timeline'

  const events = buildEvents(boats);
  const today = new Date();

  // Group events by date string
  const eventsByDate = {};
  events.forEach(ev => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad to start on Sunday
  const startPad = getDay(monthStart);
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const selectedEvents = selectedDate ? (eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || []) : [];

  // Upcoming 90-day timeline
  const upcoming = events.filter(ev => ev.daysUntil >= -7 && ev.daysUntil <= 90);
  const overdue = events.filter(ev => ev.daysUntil < -7);

  const totalUpcomingCost = upcoming.reduce((s, ev) => s + (ev.cost || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            Operational Calendar
          </h3>
          <p className="text-xs text-white/30 mt-0.5">Service dates &amp; recurring payment deadlines across all vessels</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'calendar' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40' : 'text-white/40 hover:text-white/60'}`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView('timeline')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'timeline' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40' : 'text-white/40 hover:text-white/60'}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Upcoming Events (90d)', value: upcoming.length, color: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', text: 'text-cyan-300' },
          { label: 'Est. Cost (90d)', value: fmt(totalUpcomingCost), color: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: 'text-orange-300' },
          { label: 'Overdue / Past', value: overdue.length, color: overdue.length > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)', border: overdue.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)', text: overdue.length > 0 ? 'text-red-400' : 'text-emerald-400' },
          { label: 'Service Events', value: upcoming.filter(e => e.type === 'service').length, color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'text-amber-300' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-3 py-2.5" style={{ background: s.color, border: `1px solid ${s.border}` }}>
            <p className="text-[10px] text-white/35 uppercase tracking-wider">{s.label}</p>
            <p className={`text-base font-bold ${s.text} mt-0.5`}>{s.value}</p>
          </div>
        ))}
      </div>

      {view === 'calendar' ? (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Calendar */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Month nav */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <ChevronLeft className="h-4 w-4 text-white/60" />
              </button>
              <span className="text-sm font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</span>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <ChevronRight className="h-4 w-4 text-white/60" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-3 pt-3 pb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] text-white/25 font-semibold uppercase">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px px-3 pb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {paddedDays.map((day, idx) => {
                if (!day) return <div key={`pad-${idx}`} className="h-10" style={{ background: 'rgba(255,255,255,0.02)' }} />;
                const ds = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[ds] || [];
                const hasService = dayEvents.some(e => e.type === 'service');
                const hasPayment = dayEvents.some(e => e.type === 'payment');
                const hasOverdue = dayEvents.some(e => e.daysUntil <= 0);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const todayDay = isToday(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={ds}
                    onClick={() => setSelectedDate(isSameDay(day, selectedDate) ? null : day)}
                    className="relative h-10 rounded flex flex-col items-center justify-center gap-0.5 transition-all hover:bg-white/10"
                    style={{
                      background: isSelected
                        ? 'rgba(6,182,212,0.25)'
                        : todayDay
                        ? 'rgba(245,158,11,0.2)'
                        : hasOverdue
                        ? 'rgba(239,68,68,0.1)'
                        : dayEvents.length > 0
                        ? 'rgba(6,182,212,0.08)'
                        : 'rgba(255,255,255,0.02)',
                      border: isSelected
                        ? '1px solid rgba(6,182,212,0.5)'
                        : todayDay
                        ? '1px solid rgba(245,158,11,0.4)'
                        : 'none',
                      opacity: isCurrentMonth ? 1 : 0.3,
                    }}
                  >
                    <span className={`text-xs font-medium ${todayDay ? 'text-amber-300' : isSelected ? 'text-cyan-300' : 'text-white/70'}`}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5">
                        {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        {!hasOverdue && hasService && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        {hasPayment && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="px-4 py-3 flex flex-wrap gap-3 text-[10px] text-white/40" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Service</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />Payment</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Overdue</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400/40 border border-amber-400/60 inline-block" />Today</span>
            </div>
          </div>

          {/* Selected day panel */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-sm font-semibold text-white">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
              </p>
              {selectedDate && selectedEvents.length > 0 && (
                <p className="text-xs text-white/30 mt-0.5">{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="p-4 space-y-2 max-h-[360px] overflow-y-auto">
              {!selectedDate ? (
                <p className="text-white/20 text-xs text-center py-8">Click a date on the calendar</p>
              ) : selectedEvents.length === 0 ? (
                <p className="text-white/20 text-xs text-center py-8">No events on this day</p>
              ) : selectedEvents.map((ev, i) => {
                const u = urgencyStyle(ev.daysUntil);
                return (
                  <div key={i} className="rounded-xl p-3 space-y-1.5" style={{ background: ev.type === 'service' ? 'rgba(245,158,11,0.08)' : 'rgba(168,85,247,0.08)', border: `1px solid ${ev.type === 'service' ? 'rgba(245,158,11,0.2)' : 'rgba(168,85,247,0.2)'}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {ev.type === 'service'
                          ? <Wrench className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          : <CreditCard className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                        <span className="text-sm font-semibold text-white">{ev.label}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${u.badge}`}>
                        {ev.daysUntil <= 0 ? 'OVERDUE' : `${ev.daysUntil}d`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40 capitalize">
                        {ev.type === 'service' ? `${ev.serviceType} service` : `${ev.category} · every ${ev.frequency}mo`}
                      </span>
                      {ev.cost > 0 && <span className={ev.type === 'service' ? 'text-amber-300 font-semibold' : 'text-purple-300 font-semibold'}>{fmt(ev.cost)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Timeline view */
        <div className="space-y-3">
          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-sm font-bold text-red-400">Overdue ({overdue.length})</span>
              </div>
              <div className="divide-y" style={{ '--tw-divide-opacity': 0.1 }}>
                {overdue.map((ev, i) => <TimelineRow key={i} ev={ev} />)}
              </div>
            </div>
          )}

          {/* Group upcoming by month */}
          {(() => {
            const grouped = {};
            upcoming.forEach(ev => {
              const month = ev.date.slice(0, 7); // yyyy-MM
              if (!grouped[month]) grouped[month] = [];
              grouped[month].push(ev);
            });
            return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([month, evs]) => (
              <div key={month} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white/70">{format(parseISO(`${month}-01`), 'MMMM yyyy')}</span>
                    <span className="text-xs text-white/30">{evs.length} event{evs.length !== 1 ? 's' : ''} · {fmt(evs.reduce((s, e) => s + (e.cost || 0), 0))}</span>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {evs.map((ev, i) => <TimelineRow key={i} ev={ev} />)}
                </div>
              </div>
            ));
          })()}

          {upcoming.length === 0 && overdue.length === 0 && (
            <div className="text-center py-12 text-white/20 text-sm">No events in the next 90 days</div>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineRow({ ev }) {
  const u = urgencyStyle(ev.daysUntil);
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${u.dot}`} />
        {ev.type === 'service'
          ? <Wrench className="h-3.5 w-3.5 text-amber-400/70 shrink-0" />
          : <CreditCard className="h-3.5 w-3.5 text-purple-400/70 shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm text-white/80 font-medium truncate">{ev.label}</p>
          <p className="text-[10px] text-white/30">
            {format(parseISO(ev.date), 'EEE, MMM d, yyyy')}
            {ev.type === 'service' && ` · ${ev.serviceType} service`}
            {ev.type === 'payment' && ` · ${ev.category || 'recurring'} · every ${ev.frequency}mo`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {ev.cost > 0 && (
          <span className={`text-xs font-semibold ${ev.type === 'service' ? 'text-amber-300' : 'text-purple-300'}`}>
            {fmt(ev.cost)}
          </span>
        )}
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${u.badge}`}>
          {ev.daysUntil <= 0 ? `${Math.abs(ev.daysUntil)}d ago` : `${ev.daysUntil}d`}
        </span>
      </div>
    </div>
  );
}