import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfWeek, eachWeekOfInterval, subWeeks } from 'date-fns';
import { ChevronDown, Download, Lightbulb } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-xs space-y-1.5" style={{ background: 'rgba(6,13,20,0.95)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
      <p className="font-semibold text-white/80 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
          <span className="text-white font-bold">${p.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</span>
        </div>
      ))}
    </div>
  );
};

function exportToExcel(data, filename) {
  const headers = ['Week', 'Revenue', 'Expenses', 'Net Profit', 'Fees', 'ROI %'];
  const rows = data.map(d => [d.label, d.revenue, d.expenses, d.netProfit, d.fees, d.roi?.toFixed(1)]);
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
      if (growthPct > 20) tips.push({ type: 'success', text: `Revenue grew ${growthPct.toFixed(0)}% this week — strong performance!` });
      else if (growthPct < -20) tips.push({ type: 'warning', text: `Revenue dropped ${Math.abs(growthPct).toFixed(0)}% vs last week. Monitor bookings.` });
    }

    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
    const totalNetProfit = chartData.reduce((sum, d) => sum + d.netProfit, 0);
    if (totalRevenue > 0) {
      const profitMargin = (totalNetProfit / totalRevenue) * 100;
      if (profitMargin < 10) tips.push({ type: 'warning', text: `Net profit margin is low (${profitMargin.toFixed(0)}%). Review expense structure.` });
      else tips.push({ type: 'success', text: `Healthy profit margin (${profitMargin.toFixed(0)}%) — operational efficiency is good.` });
    }

    const bestWeek = chartData.reduce((best, d) => d.revenue > best.revenue ? d : best, chartData[0]);
    if (bestWeek) tips.push({ type: 'info', text: `Strongest week: ${bestWeek.label} ($${bestWeek.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue)` });

    const avgRoi = chartData.filter(d => d.roi !== null).reduce((sum, d) => sum + d.roi, 0) / (chartData.filter(d => d.roi !== null).length || 1);
    if (avgRoi > 0) tips.push({ type: 'info', text: `Avg ROI: ${avgRoi.toFixed(1)}%` });

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

export default function FinancialTrendChart({ bookings = [], expenses = [], allBoats = [], getOperatorCommission }) {
  const [chartOpen, setChartOpen] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);

  const chartData = useMemo(() => {
    if (!bookings?.length) return [];
    const now = new Date();
    const threeMonthsAgo = subWeeks(startOfWeek(now, { weekStartsOn: 0 }), 12);
    const allDates = bookings.filter(b => b.date).map(b => parseISO(b.date));
    if (!allDates.length) return [];
    const minDate = allDates.reduce((min, d) => d < min ? d : min, allDates[0]);
    const rangeStart = minDate < threeMonthsAgo ? threeMonthsAgo : startOfWeek(minDate, { weekStartsOn: 0 });
    const weeks = eachWeekOfInterval({ start: rangeStart, end: now }, { weekStartsOn: 0 });

    return weeks.map(weekStart => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const label = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;

      const wb = bookings.filter(b => {
        const bDate = parseISO(b.date);
        return bDate >= weekStart && bDate <= weekEnd && b.status !== 'cancelled';
      });

      const revenue = wb.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const expenseAmount = wb.reduce((sum, b) => {
        const exp = expenses.find(e => e.booking_id === b.id);
        if (!exp) return sum;
        return sum + ((exp.fuel_cost || 0) + (exp.crew_cost || 0) + (exp.maintenance_cost || 0) + (exp.cleaning_cost || 0) + (exp.supplies_cost || 0) + (exp.other_cost || 0));
      }, 0);
      const feesAmount = wb.reduce((sum, b) => sum + ((b.total_price || 0) * (getOperatorCommission(b.boat_name) || 0) / 100), 0);
      const netProfit = revenue - expenseAmount - feesAmount;
      const roi = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        label,
        revenue,
        expenses: expenseAmount,
        fees: feesAmount,
        netProfit,
        roi,
      };
    });
  }, [bookings, expenses, allBoats, getOperatorCommission]);

  return (
    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(16,185,129,0.15)' }}>
      {/* Chart section */}
      <div>
        <button onClick={() => setChartOpen(v => !v)} className="w-full flex items-center justify-between hover:opacity-80 transition-opacity mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs">💰</span>
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Financial Trends Over Time</span>
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
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
                  <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="fees" name="Fees" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
                </LineChart>
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