import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Wrench, DollarSign, AlertTriangle, Clock, ChevronDown, ChevronUp, Ship, Info } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX')} MXN`;
const fmtK = (n) => Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);

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

// ─── Info tooltip ─────────────────────────────────────────────────────────────
function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        className="text-white/25 hover:text-white/60 transition-colors"
      >
        <Info className="h-3 w-3" />
      </button>
      {show && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg px-3 py-2 text-xs text-white/80 leading-relaxed shadow-xl"
          style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: 'rgba(255,255,255,0.15)' }} />
        </div>
      )}
    </div>
  );
}

// ─── Fleet KPI card with info tip ────────────────────────────────────────────
function KpiCard({ label, value, sub, color, border, textColor, icon, info }) {
  return (
    <div className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: color, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{icon}</span>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: textColor }}>{label}</p>
        </div>
        {info && <InfoTip text={info} />}
      </div>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}

// ─── Boat KPI strip cell with info tip ───────────────────────────────────────
function KpiCell({ label, value, color, info }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5 text-center" style={{ background: color }}>
      <div className="flex items-center justify-center gap-1">
        <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
        {info && <InfoTip text={info} />}
      </div>
      <p className="text-sm font-bold text-white">{value}</p>
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

  // Maintenance costs
  const engineQty = boat.engine_quantity || 1;
  const totalMinorCost = (boat.minor_maintenance_cost || 0) * engineQty;
  const totalMajorCost = (boat.major_maintenance_cost || 0) * engineQty;
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

      {/* KPI Strip — boat-focused, no fleet-level aggregations */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <KpiCell
          label="Revenue"
          value={fmtK(totalRevenue)}
          color="rgba(16,185,129,0.1)"
          info="Sum of total_price from all completed bookings for this boat. Only 'completed' status bookings are counted — pending, confirmed, or cancelled are excluded."
        />
        <KpiCell
          label="Trip Expenses"
          value={fmtK(totalExpenseAmt)}
          color="rgba(239,68,68,0.1)"
          info="Total of all expense entries (fuel, crew, maintenance, cleaning, supplies, other) linked to this boat's completed bookings via the BookingExpense records."
        />
        <KpiCell
          label="Gross Profit"
          value={fmtK(grossProfit)}
          color={grossProfit >= 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.15)'}
          info="Revenue minus Trip Expenses. This does not deduct recurring fixed costs (docking, insurance, etc.) — those appear separately in the expanded detail."
        />
        <KpiCell
          label="ROI"
          value={roi === '—' ? '—' : `${roi}%`}
          color="rgba(168,85,247,0.1)"
          info="Return on investment: (Gross Profit ÷ Revenue) × 100. Tells you what percentage of each peso earned is kept as profit after trip expenses. '—' means no completed revenue yet."
        />
        <KpiCell
          label="Engine Hours"
          value={totalHours.toFixed(1)}
          color="rgba(99,102,241,0.1)"
          info={`Total engine hours = Base hours entered in boat profile (${boat.current_hours || 0}) + hours logged across all bookings (${bookingEngineHours.toFixed(1)}) + hours from personal trips (${personalTripHours.toFixed(1)}).`}
        />
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="p-5 grid md:grid-cols-2 gap-5">

          {/* Engine & Service Status */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" />Engine & Service</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Base Hours', value: boat.current_hours || 0, info: 'The fixed engine hour reading entered manually in the boat profile. Starting point for total hour calculations.' },
                { label: '+ Booking Hours', value: bookingEngineHours.toFixed(1), info: 'Sum of engine_hours_used logged per booking for this boat, across all non-cancelled bookings.' },
                { label: '+ Personal Hours', value: personalTripHours.toFixed(1), info: 'Sum of engine_hours_used from personal/owner trips logged under this boat.' },
                { label: 'Total Hours', value: <span className="text-indigo-300 font-bold">{totalHours.toFixed(1)}</span>, info: 'Base + Booking + Personal hours combined. This is the true running total used for service scheduling.' },
                { label: 'Since Last Service', value: (totalHours - (boat.last_maintenance_hours || 0)).toFixed(1), info: `Total hours minus the engine hour count at last maintenance (${boat.last_maintenance_hours || 0} hrs). Shows how hard the engine has worked since the last service.` },
                { label: 'Until Next Service', value: <span className={serviceOverdue ? 'text-red-400 font-bold' : 'text-emerald-400'}>{serviceOverdue ? 'OVERDUE' : hoursUntilService.toFixed(1)}</span>, info: `Service interval set at ${boat.maintenance_interval_hours || 100} hrs. Next service due at ${(boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100)} hrs total.` },
              ].map(({ label, value, info }) => (
                <div key={label} className="flex justify-between items-center rounded px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-1">
                    <span className="text-white/40">{label}</span>
                    {info && <InfoTip text={info} />}
                  </div>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* Service cost breakdown */}
            <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-orange-300 uppercase tracking-wider">Service Cost Estimates</p>
                <InfoTip text="Costs entered per engine in the boat's Maintenance section, multiplied by the number of engines. These are estimates set by the owner/operator — not actual logged expenses." />
              </div>
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

            <div className="space-y-2 text-xs">
              {[
                { label: 'Total Revenue (completed)', value: fmt(totalRevenue), color: 'text-emerald-400', info: 'Sum of total_price on all bookings with status = completed for this boat.' },
                { label: 'Total Trip Expenses', value: `−${fmt(totalExpenseAmt)}`, color: 'text-red-400', info: 'All BookingExpense entries linked to this boat's completed bookings: fuel + crew + maintenance + cleaning + supplies + other.' },
                { label: 'Gross Profit', value: fmt(grossProfit), color: grossProfit >= 0 ? 'text-blue-300' : 'text-red-400', info: 'Revenue minus Trip Expenses. Fixed/recurring costs are not deducted here.' },
                { label: 'Annual Recurring Costs', value: `−${fmt(Math.round(annualRecurring))} / yr`, color: 'text-amber-400', info: `Sum of all recurring cost entries annualized: each cost amount ÷ frequency_months × 12. Covers docking, insurance, crew, permits, and other fixed expenses.` },
                { label: 'Supplies Inventory Value', value: fmt(suppliesCost), color: 'text-cyan-400', info: 'Total value of supplies in the inventory: quantity × price_per_unit for each supply item regardless of in_stock/needed status.' },
              ].map(({ label, value, color, info }) => (
                <div key={label} className="flex justify-between items-center rounded px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-1">
                    <span className="text-white/40">{label}</span>
                    {info && <InfoTip text={info} />}
                  </div>
                  <span className={`font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {recurringCosts.length > 0 && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Recurring Costs</p>
                  <InfoTip text="Fixed periodic costs set in the boat's Recurring Costs section. Each entry has a name, amount, and payment frequency. Monthly average = sum of (amount ÷ frequency_months)." />
                </div>
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

            {upcomingPayments.length > 0 && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Upcoming Payments (60d)</p>
                  <InfoTip text="Recurring cost entries with a next_payment_date within the next 60 days. Color intensity reflects urgency: red = overdue, amber = within 14 days, yellow = within 45 days." />
                </div>
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

          {/* Maintenance Records */}
          {(boat.maintenance_records || []).length > 0 && (
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Maintenance History</p>
                <InfoTip text="Actual maintenance events logged in the boat's Maintenance Log. Each record includes date, service type, engine hours at time of service, cost, mechanic, and work performed." />
              </div>
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
    const maintenanceSpent = (boat.maintenance_records || []).reduce((s, r) => s + (r.cost || 0), 0);
    return { revenue, expAmt, maintenanceSpent, profit: revenue - expAmt };
  });

  const totals = fleetStats.reduce((acc, s) => ({
    revenue: acc.revenue + s.revenue,
    expAmt: acc.expAmt + s.expAmt,
    maintenanceSpent: acc.maintenanceSpent + s.maintenanceSpent,
    profit: acc.profit + s.profit,
  }), { revenue: 0, expAmt: 0, maintenanceSpent: 0, profit: 0 });

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
          <p className="text-sm text-white/40 mt-0.5">Full financial transparency per boat — maintenance, costs, revenue & engine data. Hover <Info className="inline h-3 w-3" /> icons for how each number is calculated.</p>
        </div>
        <span className="text-xs text-white/30">{filteredBoats.length} boat{filteredBoats.length !== 1 ? 's' : ''} in view</span>
      </div>

      {/* Fleet KPIs — 4 cards, no "Annual Recurring" or "Upcoming Services" */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Fleet Revenue"
          value={fmtK(totals.revenue)}
          sub="completed bookings"
          color="rgba(16,185,129,0.12)" border="rgba(16,185,129,0.3)" textColor="#6ee7b7" icon="💰"
          info="Sum of total_price across all bookings with status = 'completed', for every boat in view. Cancelled, pending, and confirmed bookings are excluded."
        />
        <KpiCard
          label="Trip Expenses"
          value={fmtK(totals.expAmt)}
          sub="logged per trip"
          color="rgba(239,68,68,0.12)" border="rgba(239,68,68,0.3)" textColor="#fca5a5" icon="📉"
          info="Total of all BookingExpense records linked to completed bookings: fuel + crew + maintenance + cleaning + supplies + other costs summed across all boats."
        />
        <KpiCard
          label="Gross Profit"
          value={fmtK(totals.profit)}
          sub="revenue − trip expenses"
          color="rgba(59,130,246,0.12)" border="rgba(59,130,246,0.3)" textColor="#93c5fd" icon="📊"
          info="Fleet Revenue minus Trip Expenses. Fixed recurring costs (docking, insurance, etc.) are not deducted here — they appear per-boat in the detail view."
        />
        <KpiCard
          label="Maint. Logged"
          value={fmtK(totals.maintenanceSpent)}
          sub="actual records"
          color="rgba(249,115,22,0.12)" border="rgba(249,115,22,0.3)" textColor="#fdba74" icon="🔧"
          info="Sum of cost entries in each boat's Maintenance History log. These are real, recorded service events — not estimates. Expand a boat card to see the full breakdown."
        />
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

      {/* Fleet Comparison Table */}
      {filteredBoats.length > 1 && (
        <SectionRow label="📊 Fleet Cost Comparison">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['Boat', 'Revenue', 'Trip Exp.', 'Gross Profit', 'ROI', 'Maint. Logged'].map(h => (
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