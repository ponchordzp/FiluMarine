import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-xs space-y-1.5" style={{ background: 'rgba(6,13,20,0.95)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
      <p className="font-semibold text-white/80 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
          <span className="text-white font-bold">${(p.value / 1000).toFixed(1)}k</span>
        </div>
      ))}
      {payload.length >= 2 && (
        <div className="border-t border-white/10 pt-1.5 mt-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-blue-300 font-medium">Profit:</span>
          <span className={`font-bold ${(payload[0]?.value || 0) - (payload[1]?.value || 0) - (payload[2]?.value || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            ${(((payload[0]?.value || 0) - (payload[1]?.value || 0) - (payload[2]?.value || 0)) / 1000).toFixed(1)}k
          </span>
        </div>
      )}
    </div>
  );
};

export default function FinancialTrendChart({ financialFilteredBookings, financialExpenses, getOperatorCommission }) {
  const chartData = useMemo(() => {
    if (!financialFilteredBookings?.length) return [];

    // Determine month range: last 6 months or range of data, whichever makes sense
    const now = new Date();
    const sixMonthsAgo = subMonths(startOfMonth(now), 5);

    const allDates = financialFilteredBookings
      .filter(b => b.status !== 'cancelled' && b.date)
      .map(b => parseISO(b.date));

    if (!allDates.length) return [];

    const minDate = allDates.reduce((min, d) => d < min ? d : min, allDates[0]);
    const rangeStart = minDate < sixMonthsAgo ? sixMonthsAgo : startOfMonth(minDate);

    const months = eachMonthOfInterval({ start: rangeStart, end: now });

    return months.map(monthStart => {
      const monthKey = format(monthStart, 'yyyy-MM');
      const label = format(monthStart, 'MMM yy');

      const monthBookings = financialFilteredBookings.filter(b =>
        b.status !== 'cancelled' && b.date?.startsWith(monthKey)
      );

      const revenue = monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

      const monthExpenses = financialExpenses
        .filter(exp => monthBookings.some(b => b.id === exp.booking_id))
        .reduce((sum, e) => sum + ((e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0)), 0);

      const fees = monthBookings.reduce((sum, b) => sum + (b.total_price || 0) * getOperatorCommission(b.boat_name) / 100, 0);

      return { label, revenue, expenses: monthExpenses, fees };
    });
  }, [financialFilteredBookings, financialExpenses, getOperatorCommission]);

  if (!chartData.length || chartData.every(d => d.revenue === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-white/30 text-sm">
        No financial data available for the selected period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradFees" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>}
        />
        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
        <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gradExpenses)" dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
        <Area type="monotone" dataKey="fees" name="Fees" stroke="#f59e0b" strokeWidth={2} fill="url(#gradFees)" dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}