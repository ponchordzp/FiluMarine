import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, addMonths, differenceInDays } from 'date-fns';
import { TrendingUp, TrendingDown, Wrench, DollarSign, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp, Ship } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX')} MXN`;
const fmtK = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);

function urgencyColor(daysUntil) {
  if (daysUntil === null || daysUntil === undefined) return 'rgba(255,255,255,0.06)';
  if (daysUntil <= 0) return 'rgba(239,68,68,0.18)';
  if (daysUntil <= 14) return 'rgba(245,158,11,0.18)';
  if (daysUntil <= 45) return 'rgba(234,179,8,0.12)';
  return 'rgba(16,185,129,0.08)';
}

function urgencyBorder(daysUntil) {
  if (daysUntil === null || daysUntil === undefined) return 'rgba(255,255,255,0.1)';
  if (daysUntil <= 0) return 'rgba(239,68,68,0.45)';
  if (daysUntil <= 14) return 'rgba(245,158,11,0.45)';
  if (daysUntil <= 45) return 'rgba(234,179,8,0.3)';
  return 'rgba(16,185,129,0.25)';
}

function urgencyText(daysUntil) {
  if (daysUntil === null || daysUntil === undefined) return { label: '—', color: 'text-white/30' };
  if (daysUntil <= 0) return { label: 'OVERDUE', color: 'text-red-400' };
  if (daysUntil <= 14) return { label: `${daysUntil}d`, color: 'text-amber-400' };
  if (daysUntil <= 45) return { label: `${daysUntil}d`, color: 'text-yellow-400' };
  return { label: `${daysUntil}d`, color: 'text-emerald-400' };
}

function KpiCard({ label, value, sub, color, border, textColor, icon }) {
  return (
    <div className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: color, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: textColor }}>{label}</p>
      </div>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}

function SectionRow({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <span className="text-sm font-semibold text-white">{label}</span>
        {open ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
      </button>
      {open && <div className="p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>{children}</div>}
    </div>
  );
}

// ─── Per-boat card ────────────────────────────────────────────────────────────
function BoatFinancialCard({ boat, bookings, expenses, personalTrips }) {
  const [expanded, setExpanded] = useState(false);

  // Engine hours
  const boatBookings = bookings.filter(b => b.boat_name === boat.name && b.status !== 'cancelled');
  const completedBookings = boatBookings.filter(b => b.status === 'completed');
  const bookingEngineHours = boatBookings.reduce((s, b) => s + (b.engine_hours_used || 0), 0);
  const personalTripHours = personalTrips.filter(t => t.boat_id === boat.id).reduce((s, t) => s + (t.engine_hours_used || 0), 0);
  const totalHours = (boat.current_hours || 0) + bookingEngineHours + personalTripHours;
  const hoursUntilService = Math.max(0, (boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100) - totalHours);
  const serviceOverdue = totalHours > (boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100);

  // Revenue & expenses
  const completedIds = completedBookings.map(b => b.id);
  const boatExpenses = expenses.filter(e => completedIds.includes(e.booking_id));
  const totalExpenseAmt = boatExpenses.reduce((s, e) =>
    s + (e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0), 0);
  const totalRevenue = completedBookings.reduce((s, b) => s + (b.total_price || 0), 0);
  const grossProfit = totalRevenue - totalExpenseAmt;
  const roi = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '—';

  // Maintenance costs (from boat data)
  const minorCostPerEngine = boat.minor_maintenance_cost || 0;
  const majorCostPerEngine = boat.major_maintenance_cost || 0;
  const engineQty = boat.engine_quantity || 1;
  const totalMinorCost = minorCostPerEngine * engineQty;
  const totalMajorCost = majorCostPerEngine * engineQty;
  const nextServiceCost = boat.next_service_type === 'major' ? totalMajorCost : totalMinorCost;

  // Recurring costs
  const recurringCosts = boat.recurring_costs || [];
  const monthlyRecurring = recurringCosts.reduce((s, c) => s + (c.amount || 0) / (c.frequency_months || 1), 0);
  const annualRecurring = monthlyRecurring * 12;

  // Supplies inventory cost
  const suppliesCost = (boat.supplies_inventory || []).reduce((s, item) =>
    s + (item.quantity || 0) * (item.price_per_unit || 0), 0);

  // Upcoming recurring payments (next 60 days)
  const today = new Date();
  const upcomingPayments = recurringCosts
    .filter(c => c.next_payment_date)
    .map(c => ({ ...c, daysUntil: differenceInDays(parseISO(c.next_payment_date), today) }))
    .filter(c => c.daysUntil <= 60)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Maintenance records total spent
  const maintenanceRecordsTotal = (boat.maintenance_records || []).reduce((s, r) => s + (r.cost || 0), 0);

  const statusColor = boat.status === 'active'
    ? 'rgba(16,185,129,0.2)' : boat.status === 'maintenance'
    ? 'rgba(245,158,11,0.2)' : 'rgba(107,114,128,0.2)';

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          {boat.image && <img src={boat.image} alt={boat.name} className="w-10 h-10 rounded-lg object-cover" />}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{boat.name}</h3>
              {boat.operator && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)' }}>{boat.operator}</span>}
            </div>
            <p className="text-xs text-white/40">{boat.type} · {boat.size} · {boat.engine_name || 'No engine info'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full font-medium capitalize" style={{ background: statusColor, color: 'white' }}>{boat.status}</span>
          {serviceOverdue && <span className="text-xs px-2 py-1 rounded-full font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">⚠ Service Overdue</span>}
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4 text-white/50" /> : <ChevronDown className="h-4 w-4 text-white/50" />}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Revenue', value: fmtK(totalRevenue), color: 'rgba(16,185,129,0.1)' },
          { label: 'Trip Expenses', value: fmtK(totalExpenseAmt), color: 'rgba(239,68,68,0.1)' },
          { label: 'Gross Profit', value: fmtK(grossProfit), color: grossProfit >= 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.15)' },
          { label: 'ROI', value: roi === '—' ? '—' : `${roi}%`, color: 'rgba(168,85,247,0.1)' },
          { label: 'Annual Recurring', value: fmtK(annualRecurring), color: 'rgba(245,158,11,0.1)' },
          { label: 'Next Service', value: fmtK(nextServiceCost), color: 'rgba(249,115,22,0.1)' },
          { label: 'Engine Hours', value: totalHours.toFixed(1), color: 'rgba(99,102,241,0.1)' },
        ].map(k => (
          <div key={k.label} className="flex flex-col gap-0.5 px-3 py-2.5 text-center" style={{ background: k.color }}>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">{k.label}</p>
            <p className="text-sm font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="p-5 grid md:grid-cols-2 gap-5">

          {/* Engine & Service Status */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" />Engine & Service</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Base Hours', value: boat.current_hours || 0 },
                { label: '+ Booking Hours', value: bookingEngineHours.toFixed(1) },
                { label: '+ Personal Hours', value: personalTripHours.toFixed(1) },
                { label: 'Total Hours', value: <span className="text-indigo-300 font-bold">{totalHours.toFixed(1)}</span> },
                { label: 'Since Last Service', value: (totalHours - (boat.last_maintenance_hours || 0)).toFixed(1) },
                { label: 'Until Next Service', value: <span className={serviceOverdue ? 'text-red-400 font-bold' : 'text-emerald-400'}>{serviceOverdue ? 'OVERDUE' : hoursUntilService.toFixed(1)}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between rounded px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-white/40">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* Service cost breakdown */}
            <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <p className="text-xs font-semibold text-orange-300 uppercase tracking-wider">Service Cost Estimates</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between"><span className="text-white/40">Minor × {engineQty} engine(s)</span><span className="text-white font-medium">{fmt(totalMinorCost)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Major × {engineQty} engine(s)</span><span className="text-white font-medium">{fmt(totalMajorCost)}</span></div>
              </div>
              <div className="flex items-center justify-between rounded px-3 py-2" style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
                <span className="text-xs text-orange-200 font-semibold">Next Service ({boat.next_service_type || 'minor'})</span>
                <span className="text-base font-bold text-orange-300">{fmt(nextServiceCost)}</span>
              </div>
              {maintenanceRecordsTotal > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Total Spent (logged records)</span>
                  <span className="text-white">{fmt(maintenanceRecordsTotal)}</span>
                </div>
              )}
            </div>

            {/* Last service date */}
            {boat.last_service_date && (
              <div className="flex items-center justify-between text-xs rounded px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-white/40">Last Service</span>
                <span className="text-white">{format(parseISO(boat.last_service_date), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>

          {/* Financial Detail */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Financial Breakdown</p>

            {/* Revenue vs Expenses */}
            <div className="space-y-2 text-xs">
              {[
                { label: 'Total Revenue (completed)', value: fmt(totalRevenue), color: 'text-emerald-400' },
                { label: 'Total Trip Expenses', value: `−${fmt(totalExpenseAmt)}`, color: 'text-red-400' },
                { label: 'Gross Profit', value: fmt(grossProfit), color: grossProfit >= 0 ? 'text-blue-300' : 'text-red-400' },
                { label: 'Annual Recurring Costs', value: `−${fmt(Math.round(annualRecurring))} / yr`, color: 'text-amber-400' },
                { label: 'Supplies Inventory Value', value: fmt(suppliesCost), color: 'text-cyan-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between rounded px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-white/40">{label}</span>
                  <span className={`font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Recurring Costs breakdown */}
            {recurringCosts.length > 0 && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Recurring Costs</p>
                <div className="space-y-1">
                  {recurringCosts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-white/50 capitalize">{c.name} <span className="text-white/25">(every {c.frequency_months}mo)</span></span>
                      <span className="text-purple-300 font-medium">{fmt(c.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 border-t border-purple-500/20 text-xs font-bold">
                    <span className="text-white/60">Monthly avg.</span>
                    <span className="text-purple-300">{fmt(Math.round(monthlyRecurring))} / mo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming payments */}
            {upcomingPayments.length > 0 && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Upcoming Payments (60d)</p>
                {upcomingPayments.map((c, i) => {
                  const u = urgencyText(c.daysUntil);
                  return (
                    <div key={i} className="flex items-center justify-between text-xs rounded px-2 py-1.5" style={{ background: urgencyColor(c.daysUntil), border: `1px solid ${urgencyBorder(c.daysUntil)}` }}>
                      <span className="text-white/70 capitalize">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${u.color}`}>{u.label}</span>
                        <span className="text-white font-medium">{fmt(c.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Maintenance Records (if any) */}
          {(boat.maintenance_records || []).length > 0 && (
            <div className="md:col-span-2 space-y-2">
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Maintenance History</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Date', 'Type', 'Engine hrs', 'Cost', 'Mechanic', 'Work'].map(h => (
                        <th key={h} className="text-left pb-2 pr-4 text-white/30 font-semibold uppercase tracking-wider" style={{ fontSize: '10px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(boat.maintenance_records || []).sort((a, b) => new Date(b.date) - new Date(a.date)).map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 text-white/60">{format(parseISO(r.date), 'MMM d, yyyy')}</td>
                        <td className="py-2 pr-4"><span className="capitalize px-1.5 py-0.5 rounded text-[10px]" style={{ background: r.service_type === 'major' ? 'rgba(168,85,247,0.2)' : r.service_type === 'minor' ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)', color: r.service_type === 'major' ? '#d8b4fe' : r.service_type === 'minor' ? '#93c5fd' : '#fca5a5' }}>{r.service_type}</span></td>
                        <td className="py-2 pr-4 text-white/70">{r.engine_hours} hrs</td>
                        <td className="py-2 pr-4 text-emerald-400 font-semibold">{fmt(r.cost)}</td>
                        <td className="py-2 pr-4 text-white/50">{r.mechanic_name || '—'}</td>
                        <td className="py-2 text-white/50 max-w-[200px] truncate">{r.work_performed || r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <td colSpan={3} className="pt-2 text-white/30 text-xs font-semibold uppercase">Total spent</td>
                      <td colSpan={3} className="pt-2 text-emerald-400 font-bold text-sm">{fmt(maintenanceRecordsTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function MaintenanceFinancialDashboard({ operatorFilter = 'all' }) {
  const { data: boats = [], isLoading: loadingBoats } = useQuery({
    queryKey: ['boats'],
    queryFn: () => base44.entities.BoatInventory.list('-created_date'),
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ['booking-expenses'],
    queryFn: () => base44.entities.BookingExpense.list(),
  });
  const { data: personalTrips = [] } = useQuery({
    queryKey: ['personal-trips'],
    queryFn: () => base44.entities.PersonalTrip.list('-trip_date'),
  });

  const filteredBoats = boats.filter(boat => {
    if (operatorFilter === 'all') return true;
    const bOp = (boat.operator || '').toLowerCase();
    const fOp = operatorFilter.toLowerCase();
    return fOp === 'filu' ? (!bOp || bOp === 'filu') : bOp === fOp;
  });

  if (loadingBoats) return <div className="text-white/40 text-center py-20">Loading financial data...</div>;

  // Fleet-wide totals
  const fleetStats = filteredBoats.map(boat => {
    const boatBookings = bookings.filter(b => b.boat_name === boat.name && b.status === 'completed');
    const completedIds = boatBookings.map(b => b.id);
    const boatExpenses = expenses.filter(e => completedIds.includes(e.booking_id));
    const revenue = boatBookings.reduce((s, b) => s + (b.total_price || 0), 0);
    const expAmt = boatExpenses.reduce((s, e) => s + (e.fuel_cost||0)+(e.crew_cost||0)+(e.maintenance_cost||0)+(e.cleaning_cost||0)+(e.supplies_cost||0)+(e.other_cost||0), 0);
    const recurringAnnual = (boat.recurring_costs || []).reduce((s, c) => s + (c.amount || 0) / (c.frequency_months || 1), 0) * 12;
    const maintenanceSpent = (boat.maintenance_records || []).reduce((s, r) => s + (r.cost || 0), 0);
    const engineQty = boat.engine_quantity || 1;
    const nextServiceCost = (boat.next_service_type === 'major' ? boat.major_maintenance_cost : boat.minor_maintenance_cost) * engineQty || 0;
    return { revenue, expAmt, recurringAnnual, maintenanceSpent, nextServiceCost, profit: revenue - expAmt };
  });

  const totals = fleetStats.reduce((acc, s) => ({
    revenue: acc.revenue + s.revenue,
    expAmt: acc.expAmt + s.expAmt,
    recurringAnnual: acc.recurringAnnual + s.recurringAnnual,
    maintenanceSpent: acc.maintenanceSpent + s.maintenanceSpent,
    nextServiceCost: acc.nextServiceCost + s.nextServiceCost,
    profit: acc.profit + s.profit,
  }), { revenue: 0, expAmt: 0, recurringAnnual: 0, maintenanceSpent: 0, nextServiceCost: 0, profit: 0 });

  // Boats needing attention
  const today = new Date();
  const alertBoats = filteredBoats.filter(boat => {
    const boatBookings = bookings.filter(b => b.boat_name === boat.name && b.status !== 'cancelled');
    const bookingHrs = boatBookings.reduce((s, b) => s + (b.engine_hours_used || 0), 0);
    const personalHrs = personalTrips.filter(t => t.boat_id === boat.id).reduce((s, t) => s + (t.engine_hours_used || 0), 0);
    const totalHrs = (boat.current_hours || 0) + bookingHrs + personalHrs;
    const overdue = totalHrs > (boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100);
    const upcomingRecurring = (boat.recurring_costs || []).some(c => {
      if (!c.next_payment_date) return false;
      return differenceInDays(parseISO(c.next_payment_date), today) <= 14;
    });
    return overdue || upcomingRecurring;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">💰 Maintenance Financial Dashboard</h2>
          <p className="text-sm text-white/40 mt-0.5">Full financial transparency across your fleet — maintenance, recurring costs, revenue & projections</p>
        </div>
        <span className="text-xs text-white/30">{filteredBoats.length} boat{filteredBoats.length !== 1 ? 's' : ''} in view</span>
      </div>

      {/* Fleet KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Fleet Revenue" value={fmtK(totals.revenue)} sub="completed bookings" color="rgba(16,185,129,0.12)" border="rgba(16,185,129,0.3)" textColor="#6ee7b7" icon="💰" />
        <KpiCard label="Trip Expenses" value={fmtK(totals.expAmt)} sub="all logged trips" color="rgba(239,68,68,0.12)" border="rgba(239,68,68,0.3)" textColor="#fca5a5" icon="📉" />
        <KpiCard label="Gross Profit" value={fmtK(totals.profit)} sub="revenue − expenses" color="rgba(59,130,246,0.12)" border="rgba(59,130,246,0.3)" textColor="#93c5fd" icon="📊" />
        <KpiCard label="Annual Recurring" value={fmtK(Math.round(totals.recurringAnnual))} sub="docking, insurance, crew…" color="rgba(245,158,11,0.12)" border="rgba(245,158,11,0.3)" textColor="#fcd34d" icon="🔁" />
        <KpiCard label="Maintenance Spent" value={fmtK(totals.maintenanceSpent)} sub="logged records" color="rgba(249,115,22,0.12)" border="rgba(249,115,22,0.3)" textColor="#fdba74" icon="🔧" />
        <KpiCard label="Upcoming Services" value={fmtK(totals.nextServiceCost)} sub="next service across fleet" color="rgba(168,85,247,0.12)" border="rgba(168,85,247,0.3)" textColor="#d8b4fe" icon="⚙️" />
      </div>

      {/* Alerts */}
      {alertBoats.length > 0 && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> {alertBoats.length} Boat{alertBoats.length > 1 ? 's' : ''} Need Attention
          </p>
          <div className="flex flex-wrap gap-2">
            {alertBoats.map(b => (
              <span key={b.id} className="text-xs px-2.5 py-1 rounded-full text-red-300 font-medium" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                ⚠ {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-Boat Cards */}
      <SectionRow label="📋 Per-Boat Financial Detail" defaultOpen={true}>
        <div className="space-y-4">
          {filteredBoats.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Ship className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No boats found</p>
            </div>
          ) : filteredBoats.map(boat => (
            <BoatFinancialCard
              key={boat.id}
              boat={boat}
              bookings={bookings}
              expenses={expenses}
              personalTrips={personalTrips}
            />
          ))}
        </div>
      </SectionRow>

      {/* Cost Comparison Table */}
      {filteredBoats.length > 1 && (
        <SectionRow label="📊 Fleet Cost Comparison">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['Boat', 'Revenue', 'Trip Exp.', 'Gross Profit', 'ROI', 'Annual Recurring', 'Next Service', 'Maint. Logged'].map(h => (
                    <th key={h} className="text-left pb-3 pr-5 font-semibold uppercase tracking-wider text-white/30" style={{ fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBoats.map((boat) => {
                  const s = fleetStats[filteredBoats.indexOf(boat)];
                  const roi = s.revenue > 0 ? ((s.profit / s.revenue) * 100).toFixed(1) : '—';
                  return (
                    <tr key={boat.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-5">
                        <div className="flex items-center gap-2">
                          {boat.image && <img src={boat.image} alt="" className="w-6 h-6 rounded object-cover" />}
                          <span className="font-semibold text-white">{boat.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-5 text-emerald-400 font-semibold">{fmtK(s.revenue)}</td>
                      <td className="py-3 pr-5 text-red-400">{fmtK(s.expAmt)}</td>
                      <td className={`py-3 pr-5 font-bold ${s.profit >= 0 ? 'text-blue-300' : 'text-red-400'}`}>{fmtK(s.profit)}</td>
                      <td className="py-3 pr-5 text-purple-300">{roi === '—' ? '—' : `${roi}%`}</td>
                      <td className="py-3 pr-5 text-amber-400">{fmtK(Math.round(s.recurringAnnual))}/yr</td>
                      <td className="py-3 pr-5 text-orange-400">{fmtK(s.nextServiceCost)}</td>
                      <td className="py-3 text-white/60">{fmtK(s.maintenanceSpent)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <td className="pt-3 pr-5 text-white/50 font-bold text-xs uppercase">Fleet Total</td>
                  <td className="pt-3 pr-5 text-emerald-400 font-bold">{fmtK(totals.revenue)}</td>
                  <td className="pt-3 pr-5 text-red-400 font-bold">{fmtK(totals.expAmt)}</td>
                  <td className={`pt-3 pr-5 font-bold ${totals.profit >= 0 ? 'text-blue-300' : 'text-red-400'}`}>{fmtK(totals.profit)}</td>
                  <td className="pt-3 pr-5 text-purple-300 font-bold">{totals.revenue > 0 ? `${((totals.profit / totals.revenue) * 100).toFixed(1)}%` : '—'}</td>
                  <td className="pt-3 pr-5 text-amber-400 font-bold">{fmtK(Math.round(totals.recurringAnnual))}/yr</td>
                  <td className="pt-3 pr-5 text-orange-400 font-bold">{fmtK(totals.nextServiceCost)}</td>
                  <td className="pt-3 text-white/60 font-bold">{fmtK(totals.maintenanceSpent)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </SectionRow>
      )}
    </div>
  );
}