import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ChevronDown, Download, Lightbulb } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const revenue = payload.find(p => p.dataKey === 'revenue')?.value || 0;
  const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0;
  const fees = payload.find(p => p.dataKey === 'fees')?.value || 0;
  const profit = revenue - expenses - fees;
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
      <div className="border-t border-white/10 pt-1.5 mt-1 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="text-blue-300 font-medium">Profit:</span>
        <span className={`font-bold ${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
          ${(profit / 1000).toFixed(1)}k
        </span>
      </div>
    </div>
  );
};

function exportToExcel(data, filename) {
  const headers = ['Month', 'Revenue ($)', 'Expenses ($)', 'Fees ($)', 'Net Profit ($)'];
  const rows = data.map(d => [
    d.label,
    d.revenue.toFixed(0),
    d.expenses.toFixed(0),
    d.fees.toFixed(0),
    (d.revenue - d.expenses - d.fees).toFixed(0),
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function FinancialSuggestions({ chartData }) {
  const suggestions = useMemo(() => {
    if (!chartData.length) return [];
    const tips = [];
    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];

    if (last && prev && last.revenue > 0 && prev.revenue > 0) {
      const growthPct = ((last.revenue - prev.revenue) / prev.revenue) * 100;
      if (growthPct > 20) tips.push({ type: 'success', text: `Revenue grew ${growthPct.toFixed(0)}% vs last month — great momentum!` });
      else if (growthPct < -20) tips.push({ type: 'warning', text: `Revenue dropped ${Math.abs(growthPct).toFixed(0)}% vs last month. Consider promotions.` });
    }

    const highExpenseMonths = chartData.filter(d => d.revenue > 0 && d.expenses / d.revenue > 0.5);
    if (highExpenseMonths.length > 0) tips.push({ type: 'warning', text: `${highExpenseMonths.length} month(s) had expenses >50% of revenue. Review operational costs.` });

    const bestMonth = chartData.reduce((best, d) => (d.revenue - d.expenses - d.fees) > (best.revenue - best.expenses - best.fees) ? d : best, chartData[0]);
    if (bestMonth) tips.push({ type: 'info', text: `Best profit month: ${bestMonth.label} ($${((bestMonth.revenue - bestMonth.expenses - bestMonth.fees) / 1000).toFixed(1)}k)` });

    const avgFeeRatio = chartData.filter(d => d.revenue > 0).reduce((sum, d) => sum + d.fees / d.revenue, 0) / (chartData.filter(d => d.revenue > 0).length || 1);
    if (avgFeeRatio > 0.15) tips.push({ type: 'info', text: `Avg operator fees are ${(avgFeeRatio * 100).toFixed(0)}% of revenue. Renegotiate if possible.` });

    return tips;
  }, [chartData]);

  if (!suggestions.length) return <p className="text-xs text-emerald-200/40 italic">No suggestions at this time</p>;

  const typeStyle = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: 'text-emerald-200' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: 'text-amber-200' },
    info:    { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', text: 'text-blue-200' },
  };

  return (
    <div className="space-y-1.5">
      {suggestions.map((s, i) => {
        const st = typeStyle[s.type];
        return (
          <div key={i} className={`px-3 py-2 rounded-lg text-xs font-medium ${st.text}`} style={{ background: st.bg, border: `1px solid ${st.border}` }}>
            {s.text}
          </div>
        );
      })}
    </div>
  );
}

export default function FinancialTrendChart({ financialFilteredBookings, financialExpenses, getOperatorCommission, operators = [], boats = [] }) {
  const [chartOpen, setChartOpen] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);

  const chartData = useMemo(() => {
    if (!financialFilteredBookings?.length) return [];
    const now = new Date();
    const sixMonthsAgo = subMonths(startOfMonth(now), 5);
    const allDates = financialFilteredBookings.filter(b => b.status !== 'cancelled' && b.date).map(b => parseISO(b.date));
    if (!allDates.length) return [];
    const minDate = allDates.reduce((min, d) => d < min ? d : min, allDates[0]);
    const rangeStart = minDate < sixMonthsAgo ? sixMonthsAgo : startOfMonth(minDate);
    const months = eachMonthOfInterval({ start: rangeStart, end: now });
    return months.map(monthStart => {
      const monthKey = format(monthStart, 'yyyy-MM');
      const label = format(monthStart, 'MMM yy');
      const monthBookings = financialFilteredBookings.filter(b => b.status !== 'cancelled' && b.date?.startsWith(monthKey));
      const revenue = monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const monthExpenses = financialExpenses.filter(exp => monthBookings.some(b => b.id === exp.booking_id)).reduce((sum, e) => sum + ((e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0)), 0);
      const fees = monthBookings.reduce((sum, b) => sum + (b.total_price || 0) * getOperatorCommission(b.boat_name, boats, operators) / 100, 0);
      return { label, revenue, expenses: monthExpenses, fees };
    });
  }, [financialFilteredBookings, financialExpenses, getOperatorCommission, operators, boats]);

  return (
    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(16,185,129,0.15)' }}>
      {/* Chart section */}
      <div>
        <button onClick={() => setChartOpen(v => !v)} className="w-full flex items-center justify-between hover:opacity-80 transition-opacity mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs">📈</span>
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Revenue vs Expenses Trend</span>
          </div>
          <div className="flex items-center gap-2">
            {chartData.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); exportToExcel(chartData, 'financial_trend.csv'); }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-emerald-300 hover:text-emerald-100 transition-colors"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                <Download className="h-3 w-3" /> Export CSV
              </button>
            )}
            <ChevronDown className={`h-3.5 w-3.5 text-emerald-300/60 transition-transform ${chartOpen ? '' : '-rotate-90'}`} />
          </div>
        </button>
        {chartOpen && (
          chartData.length === 0 || chartData.every(d => d.revenue === 0)
            ? <div className="flex items-center justify-center h-32 text-white/30 text-sm">No financial data available for the selected period</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradFees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gradExpenses)" dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
                  <Area type="monotone" dataKey="fees" name="Fees" stroke="#f59e0b" strokeWidth={2} fill="url(#gradFees)" dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
                </AreaChart>
              </ResponsiveContainer>
            )
        )}
      </div>

      {/* Smart Suggestions */}
      <div className="pt-1" style={{ borderTop: '1px solid rgba(16,185,129,0.1)' }}>
        <button onClick={() => setSuggestionsOpen(v => !v)} className="w-full flex items-center justify-between hover:opacity-80 transition-opacity mb-2">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3 text-emerald-300" />
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Smart Suggestions</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-emerald-300/60 transition-transform ${suggestionsOpen ? '' : '-rotate-90'}`} />
        </button>
        {suggestionsOpen && <FinancialSuggestions chartData={chartData} />}
      </div>
    </div>
  );
}