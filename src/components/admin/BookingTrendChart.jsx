import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
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
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function exportToExcel(data, filename) {
  const headers = ['Week', 'Total', 'Confirmed', 'Completed', 'Pending', 'Cancelled'];
  const rows = data.map(d => [d.label, d.total, d.confirmed, d.completed, d.pending, d.cancelled]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function BookingSuggestions({ chartData }) {
  const suggestions = useMemo(() => {
    if (!chartData.length) return [];
    const tips = [];
    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];

    if (last && prev && last.total > 0 && prev.total > 0) {
      const growthPct = ((last.total - prev.total) / prev.total) * 100;
      if (growthPct > 20) tips.push({ type: 'success', text: `Bookings grew ${growthPct.toFixed(0)}% in the latest period — strong demand!` });
      else if (growthPct < -20) tips.push({ type: 'warning', text: `Bookings dropped ${Math.abs(growthPct).toFixed(0)}% vs previous period. Boost marketing.` });
    }

    const totalBookings = chartData.reduce((sum, d) => sum + d.total, 0);
    const totalCancelled = chartData.reduce((sum, d) => sum + d.cancelled, 0);
    if (totalBookings > 0) {
      const cancelRate = (totalCancelled / totalBookings) * 100;
      if (cancelRate > 15) tips.push({ type: 'warning', text: `Cancellation rate is ${cancelRate.toFixed(0)}%. Consider a stricter deposit policy.` });
      else tips.push({ type: 'success', text: `Low cancellation rate (${cancelRate.toFixed(0)}%) — solid booking quality.` });
    }

    const bestPeriod = chartData.reduce((best, d) => d.total > best.total ? d : best, chartData[0]);
    if (bestPeriod) tips.push({ type: 'info', text: `Busiest period: ${bestPeriod.label} (${bestPeriod.total} bookings)` });

    const avgCompletion = chartData.filter(d => d.total > 0).reduce((sum, d) => sum + (d.total > 0 ? d.completed / d.total : 0), 0) / (chartData.filter(d => d.total > 0).length || 1);
    if (avgCompletion > 0) tips.push({ type: 'info', text: `Avg trip completion rate: ${(avgCompletion * 100).toFixed(0)}%` });

    return tips;
  }, [chartData]);

  if (!suggestions.length) return <p className="text-xs text-blue-200/40 italic">No suggestions at this time</p>;

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

export default function BookingTrendChart({ bookingFilteredBookings, dateRange }) {
  const [chartOpen, setChartOpen] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [timeRange, setTimeRange] = useState('3M');

  const chartData = useMemo(() => {
    if (!bookingFilteredBookings?.length) return [];
    const now = new Date();

    let rangeStart;
    let futureEnd;
    let intervalType = 'week';

    if (dateRange) {
      rangeStart = dateRange.start;
      futureEnd = dateRange.end;
      const days = Math.floor((futureEnd - rangeStart) / (1000 * 60 * 60 * 24));
      if (days <= 31) intervalType = 'day';
      else if (days <= 180) intervalType = 'week';
      else intervalType = 'month';
    } else {
      futureEnd = addMonths(now, 1);
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

      const wb = bookingFilteredBookings.filter(b => {
        if (!b.date) return false;
        const bDate = parseISO(b.date);
        return bDate >= start && bDate <= end;
      });

      return {
        label,
        isCurrent: now >= start && now <= end,
        total: wb.length,
        confirmed: wb.filter(b => b.status === 'confirmed').length,
        completed: wb.filter(b => b.status === 'completed').length,
        pending: wb.filter(b => b.status === 'pending').length,
        cancelled: wb.filter(b => b.status === 'cancelled').length,
      };
    });
  }, [bookingFilteredBookings, timeRange, dateRange]);

  const ranges = [
    { label: '7D', value: '7D' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
  ];

  return (
    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(59,130,246,0.15)' }}>
      {/* Chart section */}
      <div>
        <div className="w-full flex items-center justify-between mb-2">
          <button onClick={() => setChartOpen(v => !v)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xs">📊</span>
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Booking Trends Over Time</span>
            <ChevronDown className={`h-3.5 w-3.5 text-blue-300/60 transition-transform ${chartOpen ? '' : '-rotate-90'}`} />
          </button>
          
          <div className="flex items-center gap-2">
            {!dateRange && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                {ranges.map(r => (
                  <button
                    key={r.value}
                    onClick={(e) => { e.stopPropagation(); setTimeRange(r.value); setChartOpen(true); }}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${timeRange === r.value ? 'bg-blue-500/20 text-blue-300' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            {chartData.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); exportToExcel(chartData, 'booking_trend.csv'); }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-blue-300 hover:text-blue-100 transition-colors"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                <Download className="h-3 w-3" /> Export CSV
              </button>
            )}
          </div>
        </div>
        {chartOpen && (
          chartData.length === 0 || chartData.every(d => d.total === 0)
            ? <div className="flex items-center justify-center h-32 text-white/30 text-sm">No booking data available for the selected period</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 48, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradConfirmed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradCancelled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>} />
                  {chartData.find(d => d.isCurrent) && (
                    <ReferenceLine x={chartData.find(d => d.isCurrent).label} stroke="rgba(255,255,255,0.5)" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  )}
                  <Area type="monotone" dataKey="confirmed" name="Confirmed" stroke="#10b981" strokeWidth={2} fill="url(#gradConfirmed)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#3b82f6" strokeWidth={2} fill="url(#gradCompleted)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
                  <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} fill="url(#gradPending)" dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
                  <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ef4444" strokeWidth={2} fill="url(#gradCancelled)" dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
                </AreaChart>
              </ResponsiveContainer>
            )
        )}
      </div>

      {/* Smart Suggestions */}
      <div className="pt-1" style={{ borderTop: '1px solid rgba(59,130,246,0.1)' }}>
        <button onClick={() => setSuggestionsOpen(v => !v)} className="w-full flex items-center justify-between hover:opacity-80 transition-opacity mb-2">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3 text-blue-300" />
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Smart Suggestions</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-blue-300/60 transition-transform ${suggestionsOpen ? '' : '-rotate-90'}`} />
        </button>
        {suggestionsOpen && <BookingSuggestions chartData={chartData} />}
      </div>
    </div>
  );
}