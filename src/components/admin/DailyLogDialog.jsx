import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, CheckCircle, Fuel, Package, ClipboardList, BarChart2,
  Calendar, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp,
  Sparkles, ChevronDown, ChevronUp, Check, X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, subMonths, addMonths, isSameMonth
} from 'date-fns';

// ── Daily check templates ────────────────────────────────────────────────────
const OUTBOARD_CHECKS = [
  'Engine oil level OK', 'Fuel level checked', 'Battery terminals clean',
  'Bilge dry / pumped', 'Navigation lights working', 'Propeller no damage',
  'Safety gear present (life jackets, flares)', 'Engine flush after saltwater use',
  'Fuel lines / connections no leaks', 'Hull visual inspection'
];
const INBOARD_CHECKS = [
  'Engine room dry, no leaks', 'Oil & coolant levels OK', 'Transmission fluid OK',
  'Bilge inspection', 'Seawater strainer clean', 'Generator test run',
  'Shore power / battery charge OK', 'Navigation lights working',
  'Safety gear present (life jackets, flares)', 'Hull & rudder visual inspection'
];

const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX')}`;

export default function DailyLogDialog({ boat, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('log'); // 'log' | 'history' | 'analytics'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  // Form state
  const today = format(new Date(), 'yyyy-MM-dd');
  const EMPTY = {
    log_date: today,
    fuel_quantity: '',
    fuel_unit: 'gallons',
    fuel_price_per_unit: '',
    cleaning_done: false,
    notes: '',
    logged_by: ''
  };
  const [form, setForm] = useState({ ...EMPTY });
  const [checksCompleted, setChecksCompleted] = useState([]);
  const [checksFailed, setChecksFailed] = useState([]);
  const [supplyDeductions, setSupplyDeductions] = useState([]);
  const [saved, setSaved] = useState(false);

  // Fetch fresh boat data for supplies
  const { data: boatData } = useQuery({
    queryKey: ['boat-detail', boat.id],
    queryFn: async () => {
      const boats = await base44.entities.BoatInventory.list();
      return boats.find(b => b.id === boat.id) || boat;
    },
    enabled: open,
    initialData: boat
  });

  const supplies = (boatData?.supplies_inventory || []).filter(s => s.status !== 'needed' && (s.quantity || 0) > 0);
  const checkList = boat.engine_config === 'inboard' ? INBOARD_CHECKS : OUTBOARD_CHECKS;

  // Fetch all daily logs for this boat
  const { data: logs = [] } = useQuery({
    queryKey: ['daily-logs', boat.id],
    queryFn: async () => {
      const all = await base44.entities.DailyLog.list('-log_date');
      return all.filter(l => l.boat_id === boat.id);
    },
    enabled: open
  });

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY });
      setChecksCompleted([]);
      setChecksFailed([]);
      setSupplyDeductions([]);
      setSaved(false);
    }
  }, [open]);

  const updateBoatMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BoatInventory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      queryClient.invalidateQueries({ queryKey: ['boat-detail', boat.id] });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (logData) => {
      const log = await base44.entities.DailyLog.create(logData);

      // Deduct from boat supplies inventory
      if (supplyDeductions.some(d => parseFloat(d.amountUsed) > 0)) {
        const allSupplies = boatData?.supplies_inventory || [];
        const updatedSupplies = allSupplies.map((supply, idx) => {
          const ded = supplyDeductions.find(d => d.supplyIndex === idx);
          if (!ded || !parseFloat(ded.amountUsed)) return supply;
          const used = parseFloat(ded.amountUsed);
          const newQty = Math.max(0, (supply.quantity || 0) - used);
          return {
            ...supply,
            original_quantity: supply.original_quantity ?? supply.quantity,
            quantity: newQty,
            status: newQty <= 0 ? 'needed' : supply.status,
            usage_log: [
              ...(supply.usage_log || []),
              {
                date: new Date().toISOString().split('T')[0],
                amount_used: used,
                trip_date: logData.log_date,
                destination: 'Daily Log',
                note: `Daily log — ${logData.log_date}`
              }
            ]
          };
        });
        await updateBoatMutation.mutateAsync({ id: boat.id, data: { ...boatData, supplies_inventory: updatedSupplies } });
      }

      return log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs', boat.id] });
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      setSaved(true);
      setForm({ ...EMPTY });
      setChecksCompleted([]);
      setChecksFailed([]);
      setSupplyDeductions([]);
      setTimeout(() => setSaved(false), 3500);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DailyLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-logs', boat.id] })
  });

  const handleSave = () => {
    const fuelCost = (parseFloat(form.fuel_quantity) || 0) * (parseFloat(form.fuel_price_per_unit) || 0);
    const suppliesSnap = supplyDeductions
      .filter(d => parseFloat(d.amountUsed) > 0)
      .map(d => {
        const s = (boatData?.supplies_inventory || [])[d.supplyIndex];
        const qty = parseFloat(d.amountUsed);
        return { name: s?.name || '', quantity: qty, unit: s?.unit || '', price: (s?.price_per_unit || 0) * qty };
      });
    const suppliesCost = suppliesSnap.reduce((s, x) => s + (x.price || 0), 0);
    const totalCost = fuelCost + suppliesCost;

    createMutation.mutate({
      ...form,
      boat_id: boat.id,
      boat_name: boat.name,
      fuel_quantity: parseFloat(form.fuel_quantity) || 0,
      fuel_price_per_unit: parseFloat(form.fuel_price_per_unit) || 0,
      supplies_used: suppliesSnap,
      checks_completed: checksCompleted,
      checks_failed: checksFailed,
      total_cost: totalCost
    });
  };

  const toggleCheck = (item) => {
    setChecksCompleted(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]);
    setChecksFailed(prev => prev.filter(c => c !== item));
  };
  const toggleFail = (item) => {
    setChecksFailed(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]);
    setChecksCompleted(prev => prev.filter(c => c !== item));
  };

  const setDeduction = (supplyIndex, amountUsed) => {
    setSupplyDeductions(prev => {
      const existing = prev.find(d => d.supplyIndex === supplyIndex);
      if (existing) return prev.map(d => d.supplyIndex === supplyIndex ? { ...d, amountUsed } : d);
      return [...prev, { supplyIndex, amountUsed }];
    });
  };

  const fuelCostPreview = (parseFloat(form.fuel_quantity) || 0) * (parseFloat(form.fuel_price_per_unit) || 0);

  // Analytics
  const totalFuelCost = logs.reduce((s, l) => s + (l.fuel_quantity || 0) * (l.fuel_price_per_unit || 0), 0);
  const totalSuppliesCost = logs.reduce((s, l) => s + ((l.supplies_used || []).reduce((ss, x) => ss + (x.price || 0), 0)), 0);
  const totalCostAll = logs.reduce((s, l) => s + (l.total_cost || 0), 0);
  const avgChecksRate = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + ((l.checks_completed || []).length / (checkList.length || 1) * 100), 0) / logs.length)
    : 0;

  // Group by month for analytics bar chart
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return format(d, 'yyyy-MM');
  });
  const monthlyCosts = last6Months.map(m => ({
    month: m,
    label: format(parseISO(`${m}-01`), 'MMM'),
    cost: logs.filter(l => l.log_date?.startsWith(m)).reduce((s, l) => s + (l.total_cost || 0), 0)
  }));
  const maxMonthlyCost = Math.max(...monthlyCosts.map(m => m.cost), 1);

  // Calendar for history
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const paddedDays = [...Array(startPad).fill(null), ...calDays];
  const logsByDate = {};
  logs.forEach(l => {
    if (!logsByDate[l.log_date]) logsByDate[l.log_date] = [];
    logsByDate[l.log_date].push(l);
  });
  const selectedLogs = selectedHistoryDate ? (logsByDate[format(selectedHistoryDate, 'yyyy-MM-dd')] || []) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            Daily Log — {boat.name}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[
            { key: 'log', label: 'Log Today', icon: Plus },
            { key: 'history', label: 'History', icon: Calendar },
            { key: 'analytics', label: 'Analytics', icon: BarChart2 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-md transition-all ${tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* ── LOG TAB ── */}
        {tab === 'log' && (
          <div className="space-y-4">
            {saved && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700">
                <CheckCircle className="h-4 w-4" /> Daily log saved! Inventory updated.
              </div>
            )}

            {/* Date + logged by */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date *</Label>
                <Input type="date" value={form.log_date} onChange={e => setForm({ ...form, log_date: e.target.value })} className="text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">Logged by</Label>
                <Input value={form.logged_by} onChange={e => setForm({ ...form, logged_by: e.target.value })} placeholder="Crew member name" className="text-sm mt-1" />
              </div>
            </div>

            {/* Fuel */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
              <h4 className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                <Fuel className="h-3.5 w-3.5" /> Fuel Consumed Today
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input type="number" min="0" step="0.1" value={form.fuel_quantity} onChange={e => setForm({ ...form, fuel_quantity: e.target.value })} className="text-sm mt-1" placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Select value={form.fuel_unit} onValueChange={v => setForm({ ...form, fuel_unit: v })}>
                    <SelectTrigger className="text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gallons">Gallons</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Price / unit ($)</Label>
                  <Input type="number" min="0" step="0.1" value={form.fuel_price_per_unit} onChange={e => setForm({ ...form, fuel_price_per_unit: e.target.value })} className="text-sm mt-1" placeholder="0" />
                </div>
              </div>
              {fuelCostPreview > 0 && (
                <p className="text-xs font-semibold text-orange-700">Fuel cost today: {fmt(fuelCostPreview)}</p>
              )}
            </div>

            {/* Supplies */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Supplies & Cleaning Used
                <span className="font-normal text-emerald-600">(auto-deducted from inventory)</span>
              </h4>
              {/* Cleaning checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-xs py-1 px-2 rounded bg-white border border-emerald-200">
                <input
                  type="checkbox"
                  checked={form.cleaning_done}
                  onChange={e => setForm({ ...form, cleaning_done: e.target.checked })}
                  className="h-3.5 w-3.5 accent-emerald-600"
                />
                <span className="text-slate-700 font-medium">Boat cleaned today</span>
              </label>
              {supplies.length === 0 ? (
                <p className="text-xs text-emerald-700 italic">No inventory items on file. Add supplies in Vessel Manager first.</p>
              ) : (
                <div className="space-y-1.5">
                  {supplies.map((supply) => {
                    const originalIndex = (boatData?.supplies_inventory || []).indexOf(supply);
                    const ded = supplyDeductions.find(d => d.supplyIndex === originalIndex);
                    const used = parseFloat(ded?.amountUsed) || 0;
                    const remaining = Math.max(0, (supply.quantity || 0) - used);
                    return (
                      <div key={originalIndex} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${ded?.amountUsed ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-slate-800">{supply.name}</span>
                          <span className="text-slate-400 ml-1">({supply.quantity} {supply.unit || 'units'} avail.)</span>
                          {used > 0 && (
                            <span className={`ml-2 font-medium ${remaining < supply.quantity * 0.15 ? 'text-red-600' : 'text-amber-700'}`}>
                              → {remaining} left
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Input
                            type="number" min="0" max={supply.quantity} step="0.1"
                            placeholder="Used" value={ded?.amountUsed || ''}
                            onChange={e => {
                              const v = e.target.value;
                              if (!v || parseFloat(v) <= 0) {
                                setSupplyDeductions(prev => prev.filter(d => d.supplyIndex !== originalIndex));
                              } else {
                                setDeduction(originalIndex, v);
                              }
                            }}
                            className="w-20 h-7 text-xs text-center"
                          />
                          <span className="text-slate-400 text-xs">{supply.unit || 'units'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily Checks */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" /> Daily Checks
                <span className="ml-auto font-normal text-blue-600">{checksCompleted.length}/{checkList.length} ✓</span>
              </h4>
              <div className="space-y-1">
                {checkList.map(item => {
                  const isOk = checksCompleted.includes(item);
                  const isFail = checksFailed.includes(item);
                  return (
                    <div key={item} className={`flex items-center gap-2 p-1.5 rounded text-xs ${isOk ? 'bg-emerald-50' : isFail ? 'bg-red-50' : 'bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => toggleCheck(item)}
                        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all border ${isOk ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}
                      >
                        {isOk && <Check className="h-3 w-3" />}
                      </button>
                      <span className={`flex-1 ${isOk ? 'text-emerald-800 line-through opacity-70' : isFail ? 'text-red-700 font-medium' : 'text-slate-700'}`}>{item}</span>
                      <button
                        type="button"
                        onClick={() => toggleFail(item)}
                        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all border ${isFail ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 hover:border-red-400'}`}
                      >
                        {isFail && <X className="h-3 w-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
              {checksFailed.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  {checksFailed.length} item{checksFailed.length > 1 ? 's' : ''} need attention!
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs">Notes / Observations</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Weather, incidents, equipment issues…" rows={2} className="text-sm mt-1" />
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.log_date || createMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Saving…' : 'Save Daily Log'}
            </Button>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Calendar */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1 rounded hover:bg-slate-200">
                    <ChevronLeft className="h-4 w-4 text-slate-500" />
                  </button>
                  <span className="text-sm font-semibold text-slate-700">{format(currentMonth, 'MMMM yyyy')}</span>
                  <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 rounded hover:bg-slate-200">
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-[10px] text-slate-400 font-semibold py-1.5">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-slate-100 p-1">
                  {paddedDays.map((day, idx) => {
                    if (!day) return <div key={`p${idx}`} className="h-9 bg-white rounded" />;
                    const ds = format(day, 'yyyy-MM-dd');
                    const dayLogs = logsByDate[ds] || [];
                    const hasFail = dayLogs.some(l => (l.checks_failed || []).length > 0);
                    const isSelected = selectedHistoryDate && isSameDay(day, selectedHistoryDate);
                    const isCurrentM = isSameMonth(day, currentMonth);
                    return (
                      <button
                        key={ds}
                        onClick={() => setSelectedHistoryDate(isSameDay(day, selectedHistoryDate) ? null : day)}
                        className={`h-9 rounded flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all ${isSelected ? 'bg-emerald-600 text-white' : isToday(day) ? 'bg-amber-100 text-amber-800' : 'bg-white hover:bg-slate-50'} ${!isCurrentM ? 'opacity-30' : ''}`}
                      >
                        <span>{format(day, 'd')}</span>
                        {dayLogs.length > 0 && (
                          <span className={`w-1.5 h-1.5 rounded-full ${hasFail ? 'bg-red-500' : isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 py-2 flex gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Logged</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Issues</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Today</span>
                </div>
              </div>

              {/* Selected day logs */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">
                    {selectedHistoryDate ? format(selectedHistoryDate, 'EEEE, MMM d, yyyy') : 'Select a date'}
                  </p>
                </div>
                <div className="p-3 max-h-72 overflow-y-auto space-y-2">
                  {!selectedHistoryDate ? (
                    <p className="text-xs text-slate-400 text-center py-6">Pick a date on the calendar</p>
                  ) : selectedLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No logs for this date</p>
                  ) : selectedLogs.map(log => (
                    <LogCard key={log.id} log={log} onDelete={(id) => { if (window.confirm('Delete this log?')) deleteMutation.mutate(id); }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Recent logs list */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">All Logs ({logs.length})</p>
              {logs.slice(0, 50).map(log => (
                <LogCard key={log.id} log={log} compact onDelete={(id) => { if (window.confirm('Delete this log?')) deleteMutation.mutate(id); }} />
              ))}
              {logs.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No daily logs yet.</p>}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div className="space-y-4">
            {/* KPI grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Logs', value: logs.length, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                { label: 'Total Cost', value: fmt(totalCostAll), color: 'bg-red-50 border-red-200 text-red-700' },
                { label: 'Fuel Cost', value: fmt(totalFuelCost), color: 'bg-orange-50 border-orange-200 text-orange-700' },
                { label: 'Avg Check Rate', value: `${avgChecksRate}%`, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{s.label}</p>
                  <p className="text-lg font-bold mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Monthly cost bar chart */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-semibold text-slate-700">Monthly Operational Costs (Last 6 Months)</p>
              </div>
              <div className="flex items-end gap-2 h-28">
                {monthlyCosts.map(m => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">{m.cost > 0 ? fmt(m.cost) : ''}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-indigo-400 transition-all"
                      style={{ height: `${(m.cost / maxMonthlyCost) * 80}px`, minHeight: m.cost > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-slate-500">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Check completion summary */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-4 w-4 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-700">Check Completion Rates</p>
              </div>
              <div className="space-y-2">
                {checkList.map(item => {
                  const completed = logs.filter(l => (l.checks_completed || []).includes(item)).length;
                  const failed = logs.filter(l => (l.checks_failed || []).includes(item)).length;
                  const rate = logs.length > 0 ? Math.round(completed / logs.length * 100) : 0;
                  return (
                    <div key={item} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 truncate flex-1">{item}</span>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {failed > 0 && <span className="text-red-600 font-medium">{failed}x fail</span>}
                          <span className="text-emerald-700 font-semibold">{rate}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supplies consumption summary */}
            {logs.some(l => (l.supplies_used || []).length > 0) && (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-purple-500" />
                  <p className="text-sm font-semibold text-slate-700">Supply Consumption Summary</p>
                </div>
                <div className="space-y-1.5">
                  {(() => {
                    const supplySummary = {};
                    logs.forEach(l => {
                      (l.supplies_used || []).forEach(s => {
                        if (!supplySummary[s.name]) supplySummary[s.name] = { qty: 0, cost: 0, unit: s.unit };
                        supplySummary[s.name].qty += s.quantity || 0;
                        supplySummary[s.name].cost += s.price || 0;
                      });
                    });
                    return Object.entries(supplySummary).sort((a, b) => b[1].cost - a[1].cost).map(([name, data]) => (
                      <div key={name} className="flex items-center justify-between text-xs bg-slate-50 rounded px-3 py-2">
                        <span className="font-medium text-slate-700">{name}</span>
                        <div className="flex items-center gap-3 text-slate-500">
                          <span>{data.qty.toFixed(1)} {data.unit}</span>
                          <span className="font-semibold text-purple-700">{fmt(data.cost)}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                <div className="mt-2 flex justify-between text-xs font-bold bg-purple-50 rounded px-3 py-2 text-purple-800">
                  <span>Total Supplies Cost</span>
                  <span>{fmt(totalSuppliesCost)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Log card sub-component ───────────────────────────────────────────────────
function LogCard({ log, compact = false, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const fuelCost = (log.fuel_quantity || 0) * (log.fuel_price_per_unit || 0);
  const suppliesCost = (log.supplies_used || []).reduce((s, x) => s + (x.price || 0), 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white text-xs overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-semibold text-slate-800 flex-shrink-0">
            {format(parseISO(log.log_date), compact ? 'MMM d' : 'MMM d, yyyy')}
          </span>
          {log.logged_by && <span className="text-slate-400 truncate">by {log.logged_by}</span>}
          {(log.checks_failed || []).length > 0 && (
            <span className="flex items-center gap-0.5 text-red-600 font-medium flex-shrink-0">
              <AlertTriangle className="h-2.5 w-2.5" />{log.checks_failed.length} issue{log.checks_failed.length > 1 ? 's' : ''}
            </span>
          )}
          {log.cleaning_done && <Badge className="text-[9px] h-4 px-1 bg-emerald-100 text-emerald-700 border-0">Cleaned</Badge>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {log.total_cost > 0 && <span className="font-bold text-red-600">${log.total_cost.toFixed(0)}</span>}
          {!compact && (
            <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
          <button onClick={() => onDelete(log.id)} className="text-red-400 hover:text-red-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {!compact && expanded && (
        <div className="border-t border-slate-100 px-3 py-2 space-y-1.5 bg-slate-50">
          {log.fuel_quantity > 0 && (
            <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 rounded px-2 py-1">
              <Fuel className="h-3 w-3" />
              <span>{log.fuel_quantity} {log.fuel_unit} @ ${log.fuel_price_per_unit}/{log.fuel_unit?.slice(0, -1)} = <strong>${fuelCost.toFixed(2)}</strong></span>
            </div>
          )}
          {(log.supplies_used || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {log.supplies_used.map((s, i) => (
                <span key={i} className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded">
                  {s.name}: {s.quantity} {s.unit}
                </span>
              ))}
            </div>
          )}
          {(log.checks_failed || []).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded px-2 py-1 text-red-700">
              <span className="font-semibold">Issues: </span>{log.checks_failed.join(', ')}
            </div>
          )}
          {(log.checks_completed || []).length > 0 && (
            <p className="text-slate-400">{log.checks_completed.length} checks completed</p>
          )}
          {log.notes && <p className="text-slate-500 italic">{log.notes}</p>}
        </div>
      )}
    </div>
  );
}