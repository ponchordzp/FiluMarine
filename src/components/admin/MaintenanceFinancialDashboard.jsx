import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef(null);

  const handleShow = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
    setShow(true);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onMouseEnter={handleShow}
        onMouseLeave={() => setShow(false)}
        onClick={handleShow}
        className="text-white/25 hover:text-white/60 transition-colors"
      >
        <Info className="h-3 w-3" />
      </button>
      {show && typeof window !== 'undefined' && createPortal(
        <div
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: Math.min(pos.x, window.innerWidth - 230),
            top: pos.y - 8,
            transform: 'translateY(-100%)',
            zIndex: 9999,
            width: '220px',
            background: 'rgba(15,23,42,0.98)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            lineHeight: '1.5',
            color: 'rgba(255,255,255,0.8)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {text}
        </div>,
        document.body
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
function BoatFinancialCard({ boat, bookings, expenses, personalTrips, allBoats }) {
  const [expanded, setExpanded] = useState(false);

  // Engine hours — use all non-cancelled bookings
  const boatBookings = bookings.filter(b => b.boat_name === boat.name && b.status !== 'cancelled');
  const bookingEngineHours = boatBookings.reduce((s, b) => s + (b.engine_hours_used || 0), 0);
  const personalTripHours = personalTrips.filter(t => t.boat_id === boat.id).reduce((s, t) => s + (t.engine_hours_used || 0), 0);
  const totalHours = (boat.current_hours || 0) + bookingEngineHours + personalTripHours;
  const hoursUntilService = Math.max(0, (boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100) - totalHours);
  const serviceOverdue = totalHours > (boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100);

  // Maintenance costs
  const engineQty = boat.engine_quantity || 1;
  const totalMinorCost = (boat.minor_maintenance_cost || 0) * engineQty;
  const totalMajorCost = (boat.major_maintenance_cost || 0) * engineQty;
  const nextServiceCost = boat.next_service_type === 'major' ? totalMajorCost : totalMinorCost;

  // Recurring costs
  const recurringCosts = boat.recurring_costs || [];
  const monthlyRecurring = recurringCosts.reduce((s, c) => s + (c.amount || 0) / (c.frequency_months || 1), 0);
  const annualRecurring = monthlyRecurring * 12;

  // ── Revenue & Expenses ────────────────────────────────────────────────────
  const boatIds = boatBookings.map(b => b.id);
  const boatExpenses = expenses.filter(e => boatIds.includes(e.booking_id));

  // Revenue = sum of all non-cancelled booking prices
  const totalRevenue = boatBookings.reduce((s, b) => s + (b.total_price || 0), 0);

  // Expenses (ex-fees)
  const totalFuelCost      = boatExpenses.reduce((s, e) => s + (e.fuel_cost || 0), 0);
  const totalCrewCost      = boatExpenses.reduce((s, e) => s + (e.crew_cost || 0), 0);
  const totalMaintenanceCost = boatExpenses.reduce((s, e) => s + (e.maintenance_cost || 0), 0);
  const totalCleaningCost  = boatExpenses.reduce((s, e) => s + (e.cleaning_cost || 0), 0);
  const totalSuppliesCost  = boatExpenses.reduce((s, e) => s + (e.supplies_cost || 0), 0);
  const totalOtherCost     = boatExpenses.reduce((s, e) => s + (e.other_cost || 0), 0);
  const totalExpenses      = totalFuelCost + totalCrewCost + totalMaintenanceCost + totalCleaningCost + totalSuppliesCost + totalOtherCost;

  // Fees = commission % of each booking's revenue (matches global KPI exactly)
  const totalFeesAmt = boatBookings.reduce((s, b) => s + (b.total_price || 0) * getOperatorCommission(b.boat_name, allBoats) / 100, 0);

  // ── P&L ──────────────────────────────────────────────────────────────────
  // Gross Profit = Revenue − Expenses
  const grossProfit = totalRevenue - totalExpenses;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '—';

  // Net Profit = Revenue − Expenses − Fees
  const netProfit = grossProfit - totalFeesAmt;
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '—';

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
      <div className="grid grid-cols-3 md:grid-cols-6 gap-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <KpiCell
          label="Revenue"
          value={fmtK(totalRevenue)}
          color="rgba(16,185,129,0.1)"
          info="Sum of total_price from all completed bookings for this boat."
        />
        <KpiCell
          label="Expenses"
          value={fmtK(totalExpenses)}
          color="rgba(239,68,68,0.1)"
          info="fuel + crew + maintenance + cleaning + supplies + other. Fees shown separately."
        />
        <KpiCell
          label="Gross Profit"
          value={fmtK(grossProfit)}
          color={grossProfit >= 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.15)'}
          info={`Revenue − Expenses = ${fmtK(grossProfit)}. Gross Margin: ${grossMargin}%.`}
        />
        <KpiCell
          label="Net Profit"
          value={fmtK(netProfit)}
          color={netProfit >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.15)'}
          info={`Gross Profit − Fees (${fmtK(totalFeesAmt)}) = ${fmtK(netProfit)}. Net Margin: ${netMargin}%.`}
        />
        <KpiCell
          label={`Net ${netMargin === '—' ? '—' : netMargin + '%'}`}
          value={grossMargin === '—' ? '—' : `Gross ${grossMargin}%`}
          color="rgba(168,85,247,0.1)"
          info={`Net Margin = Net Profit ÷ Revenue. Gross Margin = Gross Profit ÷ Revenue.`}
        />
        <KpiCell
          label="Engine Hours"
          value={totalHours.toFixed(1)}
          color="rgba(99,102,241,0.1)"
          info={`Total hours = Base (${boat.current_hours || 0}) + Bookings (${bookingEngineHours.toFixed(1)}) + Personal trips (${personalTripHours.toFixed(1)}).`}
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

            {/* P&L Waterfall */}
            <div className="space-y-1 text-xs">

              {/* Revenue */}
              <div className="flex justify-between items-center rounded px-2 py-1.5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex items-center gap-1">
                  <span className="text-emerald-300 font-semibold">Revenue</span>
                  <InfoTip text="Sum of total_price on all completed bookings for this boat." />
                </div>
                <span className="font-bold text-emerald-400">{fmt(totalRevenue)}</span>
              </div>

              {/* Expenses */}
              <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex justify-between items-center px-2 py-1.5" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <div className="flex items-center gap-1">
                    <span className="text-red-300 font-medium">Expenses</span>
                    <InfoTip text="fuel + crew + maintenance + cleaning + supplies + other. Fees shown separately below." />
                  </div>
                  <span className="font-bold text-red-400">−{fmt(totalExpenses)}</span>
                </div>
                {[
                  { label: '↳ Fuel', value: totalFuelCost },
                  { label: '↳ Crew', value: totalCrewCost },
                  { label: '↳ Maintenance', value: totalMaintenanceCost },
                  { label: '↳ Cleaning', value: totalCleaningCost },
                  { label: '↳ Supplies', value: totalSuppliesCost },
                  { label: '↳ Other', value: totalOtherCost },
                ].filter(r => r.value > 0).map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-3 py-1" style={{ background: 'rgba(239,68,68,0.04)', borderTop: '1px solid rgba(239,68,68,0.08)' }}>
                    <span className="text-white/30">{label}</span>
                    <span className="text-white/40">{fmt(value)}</span>
                  </div>
                ))}
              </div>

              {/* GROSS PROFIT = Revenue − Expenses */}
              <div className="flex justify-between items-center rounded px-2 py-2" style={{ background: grossProfit >= 0 ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${grossProfit >= 0 ? 'rgba(59,130,246,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white/80">Gross Profit</span>
                  <InfoTip text="Revenue − Expenses. Fees not yet deducted." />
                </div>
                <div className="text-right">
                  <span className={`font-bold text-sm ${grossProfit >= 0 ? 'text-blue-300' : 'text-red-400'}`}>{fmt(grossProfit)}</span>
                  <span className="ml-2 text-[10px] text-white/40">{grossMargin}%</span>
                </div>
              </div>

              {/* Fees deduction */}
              {totalFeesAmt > 0 && (
                <div className="flex justify-between items-center rounded px-2 py-1.5" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)' }}>
                  <div className="flex items-center gap-1">
                    <span className="text-pink-400/90">Fees</span>
                    <InfoTip text="Platform or operator fees logged per trip." />
                  </div>
                  <span className="text-pink-400 font-semibold">−{fmt(totalFeesAmt)}</span>
                </div>
              )}

              {/* NET PROFIT = Revenue − Trip Expenses − Fees */}
              <div className="flex justify-between items-center rounded px-2 py-2" style={{ background: netProfit >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${netProfit >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white/80">Net Profit</span>
                  <InfoTip text="Revenue − Trip Expenses − Fees. Matches global KPI calculation." />
                </div>
                <div className="text-right">
                  <span className={`font-bold text-sm ${netProfit >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>{fmt(netProfit)}</span>
                  <span className="ml-2 text-[10px] text-white/40">Margin: {netMargin === '—' ? '—' : `${netMargin}%`}</span>
                </div>
              </div>

              {/* Annual Recurring — shown as context, not deducted from net profit */}
              {annualRecurring > 0 && (
                <div className="flex justify-between items-center rounded px-2 py-1.5" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400/60 text-[10px] italic">Annual Recurring (context)</span>
                    <InfoTip text="Fixed overhead (docking, insurance, etc.) shown for reference only. Not deducted from Net Profit shown above." />
                  </div>
                  <span className="text-amber-400/60 text-[10px]">{fmt(Math.round(annualRecurring))} / yr</span>
                </div>
              )}

              {/* Supplies */}
              {suppliesCost > 0 && (
                <div className="flex justify-between items-center rounded px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-1">
                    <span className="text-white/40">Supplies Inventory Value</span>
                    <InfoTip text="Total value of supplies in inventory: quantity × price_per_unit." />
                  </div>
                  <span className="text-cyan-400 font-semibold">{fmt(suppliesCost)}</span>
                </div>
              )}
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

// ─── Commission helper (mirrors global KPI logic exactly) ────────────────────
function getOperatorCommission(boatName, allBoats) {
  try {
    const raw = localStorage.getItem('filu_operators');
    if (!raw) return 0;
    const ops = JSON.parse(raw);
    const boat = allBoats.find(b => b.name === boatName);
    const boatOpName = (boat?.operator || '').toLowerCase().trim();
    let op = null;
    if (boatOpName && boatOpName !== 'filu') {
      op = ops.find(o => (o.name || '').toLowerCase().trim() === boatOpName);
    }
    if (!op) op = ops.find(o => (o.name || '').toLowerCase().trim() === 'filu') || ops[0];
    return parseFloat(op?.commission_pct || 0);
  } catch {
    return 0;
  }
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

  // Fleet-wide totals — fees computed as commission % of revenue, matching global KPIs exactly
  const fleetStats = filteredBoats.map(boat => {
    const boatBookings = bookings.filter(b => b.boat_name === boat.name && b.status !== 'cancelled');
    const boatIds = boatBookings.map(b => b.id);
    const boatExpenses = expenses.filter(e => boatIds.includes(e.booking_id));
    const revenue = boatBookings.reduce((s, b) => s + (b.total_price || 0), 0);
    // Expenses (ex-fees)
    const expAmt = boatExpenses.reduce((s, e) => s + (e.fuel_cost||0)+(e.crew_cost||0)+(e.maintenance_cost||0)+(e.cleaning_cost||0)+(e.supplies_cost||0)+(e.other_cost||0), 0);
    // Fees = commission % of each booking's revenue (same as global KPI)
    const feesAmt = boatBookings.reduce((s, b) => s + (b.total_price || 0) * getOperatorCommission(b.boat_name, boats) / 100, 0);
    const maintenanceSpent = (boat.maintenance_records || []).reduce((s, r) => s + (r.cost || 0), 0);
    const recurringCosts = boat.recurring_costs || [];
    const annualRecurring = recurringCosts.reduce((s, c) => s + (c.amount || 0) / (c.frequency_months || 1), 0) * 12;
    // Gross = Revenue − Expenses; Net = Gross − Fees
    const grossProfit = revenue - expAmt;
    const netProfit = grossProfit - feesAmt;
    return { revenue, expAmt, feesAmt, maintenanceSpent, grossProfit, netProfit, annualRecurring };
  });

  const totals = fleetStats.reduce((acc, s) => ({
    revenue: acc.revenue + s.revenue,
    expAmt: acc.expAmt + s.expAmt,
    feesAmt: acc.feesAmt + s.feesAmt,
    maintenanceSpent: acc.maintenanceSpent + s.maintenanceSpent,
    grossProfit: acc.grossProfit + s.grossProfit,
    netProfit: acc.netProfit + s.netProfit,
    annualRecurring: acc.annualRecurring + s.annualRecurring,
  }), { revenue: 0, expAmt: 0, feesAmt: 0, maintenanceSpent: 0, grossProfit: 0, netProfit: 0, annualRecurring: 0 });

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

      {/* Fleet KPIs */}
      {(() => {
        const fleetGrossMargin = totals.revenue > 0 ? ((totals.grossProfit / totals.revenue) * 100).toFixed(1) : '—';
        const fleetNetMargin = totals.revenue > 0 ? ((totals.netProfit / totals.revenue) * 100).toFixed(1) : '—';

        // ── Row 2 derived stats ──────────────────────────────────────────────
        const totalActiveBookings = filteredBoats.reduce((s, boat) =>
          s + bookings.filter(b => b.boat_name === boat.name && b.status !== 'cancelled').length, 0);
        const avgCostPerBooking = totalActiveBookings > 0 ? totals.expAmt / totalActiveBookings : 0;

        const totalFuelFleet = filteredBoats.reduce((s, boat) => {
          const bIds = bookings.filter(b => b.boat_name === boat.name && b.status !== 'cancelled').map(b => b.id);
          return s + expenses.filter(e => bIds.includes(e.booking_id)).reduce((x, e) => x + (e.fuel_cost || 0), 0);
        }, 0);
        const fuelRatio = totals.expAmt > 0 ? ((totalFuelFleet / totals.expAmt) * 100).toFixed(1) : '—';

        const totalNextServiceBudget = filteredBoats.reduce((s, boat) => {
          const qty = boat.engine_quantity || 1;
          const cost = boat.next_service_type === 'major'
            ? (boat.major_maintenance_cost || 0) * qty
            : (boat.minor_maintenance_cost || 0) * qty;
          return s + cost;
        }, 0);

        const expenseRatio = totals.revenue > 0 ? ((totals.expAmt / totals.revenue) * 100).toFixed(1) : '—';

        const overdueCount = filteredBoats.filter(boat => {
          const bHrs = bookings.filter(b => b.boat_name === boat.name && b.status !== 'cancelled').reduce((s, b) => s + (b.engine_hours_used || 0), 0);
          const pHrs = personalTrips.filter(t => t.boat_id === boat.id).reduce((s, t) => s + (t.engine_hours_used || 0), 0);
          const tot = (boat.current_hours || 0) + bHrs + pHrs;
          return tot > (boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100);
        }).length;

        // ── Smart suggestions ────────────────────────────────────────────────
        const suggestions = [];
        const netMarginNum = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : null;
        if (netMarginNum !== null && netMarginNum < 20) suggestions.push({ type: 'warning', text: `Net margin is ${netMarginNum.toFixed(1)}% — below the 20% healthy threshold. Review operating costs or pricing.` });
        if (netMarginNum !== null && netMarginNum >= 40) suggestions.push({ type: 'success', text: `Strong net margin of ${netMarginNum.toFixed(1)}%! Consider reinvesting in fleet upgrades.` });
        if (parseFloat(fuelRatio) > 40) suggestions.push({ type: 'warning', text: `Fuel is ${fuelRatio}% of total expenses — unusually high. Check for inefficient routes or engine issues.` });
        if (overdueCount > 0) suggestions.push({ type: 'danger', text: `${overdueCount} boat${overdueCount > 1 ? 's are' : ' is'} overdue for service. Unserviced engines increase long-term repair costs significantly.` });
        if (totals.annualRecurring > totals.netProfit && totals.netProfit > 0) suggestions.push({ type: 'warning', text: `Annual recurring overhead (${fmtK(Math.round(totals.annualRecurring))}) exceeds net profit. Fleet is not covering fixed costs.` });
        if (avgCostPerBooking > 0 && totals.revenue > 0) {
          const avgRevPerBooking = totalActiveBookings > 0 ? totals.revenue / totalActiveBookings : 0;
          if (avgCostPerBooking / avgRevPerBooking > 0.6) suggestions.push({ type: 'warning', text: `Average cost per booking is ${((avgCostPerBooking / avgRevPerBooking) * 100).toFixed(0)}% of average booking revenue. Margins are thin per trip.` });
        }
        if (totals.maintenanceSpent === 0 && filteredBoats.length > 0) suggestions.push({ type: 'info', text: 'No maintenance costs logged yet. Start logging service records to track real maintenance spend.' });
        if (suggestions.length === 0) suggestions.push({ type: 'success', text: 'Fleet financials look healthy. Keep logging expenses to maintain accurate reporting.' });

        return (
          <div className="space-y-3">
            {/* Row 1 — P&L */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <KpiCard
                label="Fleet Revenue"
                value={fmtK(totals.revenue)}
                sub="completed bookings"
                color="rgba(16,185,129,0.12)" border="rgba(16,185,129,0.3)" textColor="#6ee7b7" icon="💰"
                info="Sum of total_price across all completed bookings for every boat in view."
              />
              <KpiCard
                label="Expenses"
                value={fmtK(totals.expAmt)}
                sub="ex-fees"
                color="rgba(239,68,68,0.12)" border="rgba(239,68,68,0.3)" textColor="#fca5a5" icon="📉"
                info={`fuel + crew + maintenance + cleaning + supplies + other. Fees (${fmtK(totals.feesAmt)}) shown separately.`}
              />
              <KpiCard
                label="Gross Profit"
                value={fmtK(totals.grossProfit)}
                sub={`${fleetGrossMargin}% margin`}
                color="rgba(59,130,246,0.12)" border="rgba(59,130,246,0.3)" textColor="#93c5fd" icon="📊"
                info="Gross Profit = Revenue − Expenses. Fees not yet deducted."
              />
              <KpiCard
                label="Fees"
                value={fmtK(totals.feesAmt)}
                sub="operator commission"
                color="rgba(236,72,153,0.12)" border="rgba(236,72,153,0.3)" textColor="#f9a8d4" icon="💳"
                info={`Operator commission calculated as a % of each booking's revenue. Deducted from Gross Profit to arrive at Net Profit.`}
              />
              <KpiCard
                label="Net Profit"
                value={fmtK(totals.netProfit)}
                sub={`${fleetNetMargin}% net margin`}
                color={totals.netProfit >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}
                border={totals.netProfit >= 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}
                textColor={totals.netProfit >= 0 ? "#6ee7b7" : "#fca5a5"} icon="💵"
                info={`Gross Profit − Fees (${fmtK(totals.feesAmt)}). This is the final bottom-line after all trip costs and commissions.`}
              />
              <KpiCard
                label="Maint. Logged"
                value={fmtK(totals.maintenanceSpent)}
                sub="actual records"
                color="rgba(249,115,22,0.12)" border="rgba(249,115,22,0.3)" textColor="#fdba74" icon="🔧"
                info="Sum of cost entries in each boat's Maintenance History log — real recorded service events, not estimates."
              />
            </div>

            {/* Row 2 — Operational Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiCard
                label="Avg Cost / Booking"
                value={fmtK(avgCostPerBooking)}
                sub={`${totalActiveBookings} bookings`}
                color="rgba(99,102,241,0.12)" border="rgba(99,102,241,0.3)" textColor="#a5b4fc" icon="🧾"
                info="Total trip expenses ÷ number of active (non-cancelled) bookings. Helps identify if per-trip costs are rising."
              />
              <KpiCard
                label="Fuel Share"
                value={fuelRatio === '—' ? '—' : `${fuelRatio}%`}
                sub={`of expenses · ${fmtK(totalFuelFleet)}`}
                color="rgba(234,179,8,0.12)" border="rgba(234,179,8,0.3)" textColor="#fde047" icon="⛽"
                info={`Fuel cost as % of total expenses. Above 40% may signal inefficiency. Fleet fuel total: ${fmtK(totalFuelFleet)}.`}
              />
              <KpiCard
                label="Expense Ratio"
                value={expenseRatio === '—' ? '—' : `${expenseRatio}%`}
                sub="expenses ÷ revenue"
                color="rgba(239,68,68,0.10)" border="rgba(239,68,68,0.25)" textColor="#fca5a5" icon="📐"
                info="Total trip expenses ÷ revenue. Lower is better. Above 80% means very little is left after expenses before fees."
              />
              <KpiCard
                label="Recurring / yr"
                value={fmtK(Math.round(totals.annualRecurring))}
                sub="fixed overhead"
                color="rgba(168,85,247,0.12)" border="rgba(168,85,247,0.3)" textColor="#d8b4fe" icon="🔁"
                info="Annual fixed overhead across all boats: docking, insurance, permits, etc. Not deducted from Net Profit — shown for context."
              />
              <KpiCard
                label="Next Service Budget"
                value={fmtK(totalNextServiceBudget)}
                sub={overdueCount > 0 ? `⚠ ${overdueCount} overdue` : 'estimated cost'}
                color={overdueCount > 0 ? "rgba(239,68,68,0.12)" : "rgba(249,115,22,0.12)"}
                border={overdueCount > 0 ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.3)"}
                textColor={overdueCount > 0 ? "#fca5a5" : "#fdba74"} icon="⚙️"
                info="Sum of next scheduled service cost estimates across all boats (minor or major × engine count). Plan cash flow accordingly."
              />
            </div>

            {/* Smart Suggestions — collapsible */}
            <SmartSuggestions suggestions={suggestions} />
          </div>
        );
      })()}

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
              allBoats={boats}
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
                  {[
                    { label: 'Boat' },
                    { label: 'Revenue' },
                    { label: 'Expenses', tip: 'fuel + crew + maintenance + cleaning + supplies + other' },
                    { label: 'Fees', tip: 'Platform/operator fees — deducted from Gross Profit to get Net Profit' },
                    { label: 'Gross Profit', tip: 'Revenue − Expenses' },
                    { label: 'Gross Margin %', tip: 'Gross Profit ÷ Revenue' },
                    { label: 'Recurring /yr', tip: 'Annual fixed overhead (docking, insurance, etc.)' },
                    { label: 'Net Profit', tip: 'Gross Profit − Fees − Annual Recurring' },
                    { label: 'Net Margin %', tip: 'Net Profit ÷ Revenue (0–100%)' },
                    { label: 'ROI %', tip: 'Net Profit ÷ Total Costs (trip + fees + recurring), always 0–100%' },
                    { label: 'Maint. Logged' },
                  ].map(({ label, tip }) => (
                    <th key={label} className="text-left pb-3 pr-4 font-semibold uppercase tracking-wider text-white/30 whitespace-nowrap" style={{ fontSize: '10px' }}>
                      <span className="flex items-center gap-1">{label}{tip && <InfoTip text={tip} />}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBoats.map((boat) => {
                  const s = fleetStats[filteredBoats.indexOf(boat)];
                  const gm = s.revenue > 0 ? ((s.grossProfit / s.revenue) * 100).toFixed(1) : '—';
                  const nm = s.revenue > 0 ? ((s.netProfit / s.revenue) * 100).toFixed(1) : '—';
                  const roiPct = nm;
                  return (
                    <tr key={boat.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {boat.image && <img src={boat.image} alt="" className="w-6 h-6 rounded object-cover" />}
                          <span className="font-semibold text-white">{boat.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-emerald-400 font-semibold">{fmtK(s.revenue)}</td>
                      <td className="py-3 pr-4 text-red-400">{fmtK(s.expAmt)}</td>
                      <td className="py-3 pr-4 text-pink-400">{s.feesAmt > 0 ? fmtK(s.feesAmt) : <span className="text-white/20">—</span>}</td>
                      <td className={`py-3 pr-4 font-bold ${s.grossProfit >= 0 ? 'text-blue-300' : 'text-red-400'}`}>{fmtK(s.grossProfit)}</td>
                      <td className={`py-3 pr-4 font-semibold ${s.grossProfit >= 0 ? 'text-blue-300/70' : 'text-red-400'}`}>{gm === '—' ? '—' : `${gm}%`}</td>
                      <td className="py-3 pr-4 text-amber-400/70">{s.annualRecurring > 0 ? fmtK(Math.round(s.annualRecurring)) : <span className="text-white/20">—</span>}</td>
                      <td className={`py-3 pr-4 font-bold ${s.netProfit >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>{fmtK(s.netProfit)}</td>
                      <td className={`py-3 pr-4 font-semibold ${s.netProfit >= 0 ? 'text-emerald-300/70' : 'text-red-400'}`}>{nm === '—' ? '—' : `${nm}%`}</td>
                      <td className="py-3 pr-4 text-purple-300">{roiPct === '—' ? '—' : `${roiPct}%`}</td>
                      <td className="py-3 text-white/60">{fmtK(s.maintenanceSpent)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const fgm = totals.revenue > 0 ? ((totals.grossProfit / totals.revenue) * 100).toFixed(1) : '—';
                  const fnm = totals.revenue > 0 ? ((totals.netProfit / totals.revenue) * 100).toFixed(1) : '—';
                  const froi = fnm; // ROI = Net Margin (matches global KPI)
                  return (
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                      <td className="pt-3 pr-4 text-white/50 font-bold text-xs uppercase">Fleet Total</td>
                      <td className="pt-3 pr-4 text-emerald-400 font-bold">{fmtK(totals.revenue)}</td>
                      <td className="pt-3 pr-4 text-red-400 font-bold">{fmtK(totals.expAmt)}</td>
                      <td className="pt-3 pr-4 text-pink-400 font-bold">{totals.feesAmt > 0 ? fmtK(totals.feesAmt) : '—'}</td>
                      <td className={`pt-3 pr-4 font-bold ${totals.grossProfit >= 0 ? 'text-blue-300' : 'text-red-400'}`}>{fmtK(totals.grossProfit)}</td>
                      <td className={`pt-3 pr-4 font-bold ${totals.grossProfit >= 0 ? 'text-blue-300' : 'text-red-400'}`}>{fgm === '—' ? '—' : `${fgm}%`}</td>
                      <td className="pt-3 pr-4 text-amber-400/70 font-bold">{totals.annualRecurring > 0 ? fmtK(Math.round(totals.annualRecurring)) : '—'}</td>
                      <td className={`pt-3 pr-4 font-bold ${totals.netProfit >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>{fmtK(totals.netProfit)}</td>
                      <td className={`pt-3 pr-4 font-bold ${totals.netProfit >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>{fnm === '—' ? '—' : `${fnm}%`}</td>
                      <td className="pt-3 pr-4 text-purple-300 font-bold">{froi === '—' ? '—' : `${froi}%`}</td>
                      <td className="pt-3 text-white/60 font-bold">{fmtK(totals.maintenanceSpent)}</td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </SectionRow>
      )}
    </div>
  );
}