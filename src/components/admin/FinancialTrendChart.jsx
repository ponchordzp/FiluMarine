import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfWeek, eachWeekOfInterval, subWeeks, subDays, subMonths, subYears, addMonths, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
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
          <span className="text-white font-bold">${p.value.toLocaleString('es-MX')}</span>
        </div>
      ))}
    </div>
  );
};

function exportToExcel(data, filename) {
  const headers = ['Week', 'Revenue', 'Expenses', 'Net Profit'];
  const rows = data.map(d => [d.label, d.revenue, d.expenses, d.netProfit]);
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
      const revGrowth = ((last.revenue - prev.revenue) / prev.revenue) * 100;
      if (revGrowth > 20) tips.push({ type: 'success', text: `Revenue grew ${revGrowth.toFixed(0)}% in the latest period — excellent performance!` });
      else if (revGrowth < -20) tips.push({ type: 'warning', text: `Revenue dropped ${Math.abs(revGrowth).toFixed(0)}% vs previous period. Review pricing.` });
    }

    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
    const totalNetProfit = chartData.reduce((sum, d) => sum + d.netProfit, 0);
    
    if (totalRevenue > 0) {
      const profitMargin = (totalNetProfit / totalRevenue) * 100;
      if (profitMargin > 40) tips.push({ type: 'success', text: `Strong profit margin of ${profitMargin.toFixed(0)}% — efficient operations!` });
      else if (profitMargin < 10) tips.push({ type: 'warning', text: `Profit margin is ${profitMargin.toFixed(0)}%. Review expense control.` });
    }

    const bestPeriod = chartData.reduce((best, d) => d.netProfit > best.netProfit ? d : best, chartData[0]);
    if (bestPeriod) tips.push({ type: 'info', text: `Most profitable period: ${bestPeriod.label} ($${bestPeriod.netProfit.toLocaleString('es-MX')} MXN)` });

    return tips;
  }, [chartData]);

  if (!suggestions.length) return <p className="text-xs text-amber-200/40 italic">No suggestions at this time</p>;

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

export default function FinancialTrendChart({ financialFilteredBookings, expenses, getOperatorCommission, allBoats }) {
  const [chartOpen, setChartOpen] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [timeRange, setTimeRange] = useState('3M');

  const chartData = useMemo(() => {
    if (!financialFilteredBookings?.length) return [];
    const now = new Date();
    // X-axis displays one month into the future
    const futureEnd = addMonths(now, 1);

    let rangeStart;
    let intervalType = 'week';

    switch (timeRange) {
      case '7D':
        rangeStart = subDays(now, 7);
        intervalType = 'day';
        break;
      case '1M':
        rangeStart = subMonths(now, 1);
        intervalType = 'day';
        break;
      case '3M':
        rangeStart = subMonths(now, 3);
        intervalType = 'week';
        break;
      case '1Y':
        rangeStart = subYears(now, 1);
        intervalType = 'month';
        break;
      case '5Y':
        rangeStart = subYears(now, 5);
        intervalType = 'month';
        break;
      default:
        rangeStart = subMonths(now, 3);
        intervalType = 'week';
    }

    let intervals = [];
    try {
      if (intervalType === 'day') {
        intervals = eachDayOfInterval({ start: rangeStart, end: futureEnd });
      } else if (intervalType === 'week') {
        intervals = eachWeekOfInterval({ start: startOfWeek(rangeStart, { weekStartsOn: 0 }), end: futureEnd }, { weekStartsOn: 0 });
      } else if (intervalType === 'month') {
        intervals = eachMonthOfInterval({ start: rangeStart, end: futureEnd });
      }
    } catch (e) {
      return [];
    }
    
    return intervals.map(start => {
      let end = new Date(start);
      let label = '';
      if (intervalType === 'day') {
        end.setDate(start.getDate() + 1);
        end.setMilliseconds(end.getMilliseconds() - 1);
        label = format(start, 'MMM d');
      } else if (intervalType === 'week') {
        end.setDate(start.getDate() + 7);
        end.setMilliseconds(end.getMilliseconds() - 1);
        label = `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
      } else if (intervalType === 'month') {
        end.setMonth(start.getMonth() + 1);
        end.setMilliseconds(end.getMilliseconds() - 1);
        label = format(start, 'MMM yyyy');
      }
      
      const wb = financialFilteredBookings.filter(b => {
        if (!b.date) return false;
        const bDate = parseISO(b.date);
        return bDate >= start && bDate <= end && b.status !== 'cancelled';
      });
      
      const revenue = wb.reduce((s, b) => s + (b.total_price || 0), 0);
      const expenseMap = new Map();
      wb.forEach(b => {
        const exp = expenses.find(e => e && e.booking_id === b.id);
        if (exp) expenseMap.set(b.id, exp);
      });
      const validExpenses = Array.from(expenseMap.values());
      const expAmt = validExpenses.reduce((s, e) => s + ((e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0)), 0);
      const feesAmt = wb.reduce((s, b) => s + (b.total_price || 0) * getOperatorCommission(b.boat_name, allBoats) / 100, 0);
      const netProfit = revenue - expAmt - feesAmt;

      return {
        label,
        revenue,
        expenses: expAmt,
        netProfit,
      };
    });
  }, [financialFilteredBookings, expenses, getOperatorCommission, allBoats, timeRange]);

  const ranges = [
    { label: '7D', value: '7D' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
  ];

  return (
    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(245,158,11,0.15)' }}>
      {/* Chart section */}
      <div>
        <div className="w-full flex items-center justify-between mb-2">
          <button onClick={() => setChartOpen(v => !v)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xs">📈</span>
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Financial Trends Over Time</span>
            <ChevronDown className={`h-3.5 w-3.5 text-amber-300/60 transition-transform ${chartOpen ? '' : '-rotate-90'}`} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              {ranges.map(r => (
                <button
                  key={r.value}
                  onClick={(e) => { e.stopPropagation(); setTimeRange(r.value); setChartOpen(true); }}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${timeRange === r.value ? 'bg-amber-500/20 text-amber-300' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {chartData.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); exportToExcel(chartData, 'financial_trend.csv'); }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-amber-300 hover:text-amber-100 transition-colors"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <Download className="h-3 w-3" /> Export CSV
              </button>
            )}
          </div>
        </div>
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
                    <linearGradient id="gradNetProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gradExpenses)" dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
                  <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke="#3b82f6" strokeWidth={2} fill="url(#gradNetProfit)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
                </AreaChart>
              </ResponsiveContainer>
            )
        )}
      </div>

      {/* Smart Suggestions */}
      <div className="pt-1" style={{ borderTop: '1px solid rgba(245,158,11,0.1)' }}>
        <button onClick={() => setSuggestionsOpen(v => !v)} className="w-full flex items-center justify-between hover:opacity-80 transition-opacity mb-2">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3 text-amber-300" />
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Smart Suggestions</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-amber-300/60 transition-transform ${suggestionsOpen ? '' : '-rotate-90'}`} />
        </button>
        {suggestionsOpen && <FinancialSuggestions chartData={chartData} />}
      </div>
    </div>
  );
}