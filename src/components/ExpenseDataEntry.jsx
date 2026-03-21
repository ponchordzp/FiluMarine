import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Save, Gauge } from 'lucide-react';

export default function ExpenseDataEntry({ booking, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [expenseData, setExpenseData] = useState({
    fuel_cost: 0,
    crew_cost: 0,
    maintenance_cost: 0,
    cleaning_cost: 0,
    supplies_cost: 0,
    fees_cost: 0,
    other_cost: 0,
    notes: ''
  });
  const [engineHours, setEngineHours] = useState(booking.engine_hours_used || 0);
  const [maintenanceChecklist, setMaintenanceChecklist] = useState({
    // Outboard
    freshwater_flush: false,
    visual_inspection: false,
    battery_check: false,
    bilge_pump_test: false,
    navigation_lights_test: false,
    propeller_inspection: false,
    // Inboard
    engine_room_inspection: false,
    fluid_level_check: false,
    bilge_inspection: false,
    generator_test: false,
    seawater_strainer_check: false,
    shore_power_inspection: false
  });

  const { data: boat } = useQuery({
    queryKey: ['boat', booking?.boat_name],
    queryFn: async () => {
      if (!booking?.boat_name) return null;
      const boats = await base44.entities.BoatInventory.filter({ name: booking.boat_name });
      return boats[0] || null;
    },
    enabled: !!booking?.boat_name && isOpen,
  });

  const { data: existingExpense } = useQuery({
    queryKey: ['booking-expense', booking?.id],
    queryFn: async () => {
      if (!booking?.id) return null;
      const expenses = await base44.entities.BookingExpense.filter({ booking_id: booking.id });
      return expenses[0] || null;
    },
    enabled: !!booking?.id && isOpen,
  });

  useEffect(() => {
    if (existingExpense) {
      setExpenseData({
        fuel_cost: existingExpense.fuel_cost || 0,
        crew_cost: existingExpense.crew_cost || 0,
        maintenance_cost: existingExpense.maintenance_cost || 0,
        cleaning_cost: existingExpense.cleaning_cost || 0,
        supplies_cost: existingExpense.supplies_cost || 0,
        other_cost: existingExpense.other_cost || 0,
        notes: existingExpense.notes || ''
      });
    }
  }, [existingExpense]);

  const saveExpenseMutation = useMutation({
    mutationFn: async (data) => {
      if (!booking?.id) throw new Error('No booking ID');
      
      // Update booking with engine hours
      await base44.entities.Booking.update(booking.id, {
        engine_hours_used: engineHours
      });
      
      if (existingExpense?.id) {
        return base44.entities.BookingExpense.update(existingExpense.id, data);
      } else {
        return base44.entities.BookingExpense.create({ ...data, booking_id: booking.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-expense', booking?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
      onClose();
    },
  });

  const handleSave = () => {
    if (!booking?.id) {
      console.error('No booking ID available');
      return;
    }
    saveExpenseMutation.mutate(expenseData);
  };

  const totalExpenses = Object.values(expenseData)
    .filter((v, i) => i < 6)
    .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  const revenue = booking?.total_price || 0;
  const profit = revenue - totalExpenses;
  const roi = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expense & ROI Tracking - {booking?.confirmation_code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Revenue Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Revenue</h3>
            <p className="text-2xl font-bold text-blue-700">${revenue.toLocaleString()} MXN</p>
          </div>

          {/* Expense Inputs */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Fuel Cost (MXN)</Label>
              <Input
                type="number"
                value={expenseData.fuel_cost}
                onChange={(e) => setExpenseData({...expenseData, fuel_cost: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Crew Wages (MXN)</Label>
              <Input
                type="number"
                value={expenseData.crew_cost}
                onChange={(e) => setExpenseData({...expenseData, crew_cost: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Maintenance & Repairs (MXN)</Label>
              <Input
                type="number"
                value={expenseData.maintenance_cost}
                onChange={(e) => setExpenseData({...expenseData, maintenance_cost: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Cleaning (MXN)</Label>
              <Input
                type="number"
                value={expenseData.cleaning_cost}
                onChange={(e) => setExpenseData({...expenseData, cleaning_cost: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Supplies & Provisions (MXN)</Label>
              <Input
                type="number"
                value={expenseData.supplies_cost}
                onChange={(e) => setExpenseData({...expenseData, supplies_cost: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Other Costs (MXN)</Label>
              <Input
                type="number"
                value={expenseData.other_cost}
                onChange={(e) => setExpenseData({...expenseData, other_cost: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={expenseData.notes}
              onChange={(e) => setExpenseData({...expenseData, notes: e.target.value})}
              placeholder="Additional notes about expenses, maintenance needed, etc."
              rows={3}
            />
          </div>

          {/* Engine Hours */}
          <div className="border-t pt-4">
            <Label className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Engine Hours Used
            </Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={engineHours}
              onChange={(e) => setEngineHours(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 4.5"
            />
            <p className="text-xs text-slate-500 mt-1">Hours the engine ran during this trip (auto-updates boat maintenance tracking)</p>
          </div>

          {/* Maintenance Checklist - Outboard Engines */}
          {boat?.engine_config === 'outboard' && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Routine / Per-Use Maintenance (per trip)</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border">
                {[
                  { key: 'freshwater_flush', label: 'Engine freshwater flush', note: 'Every Outing (saltwater mandatory)' },
                  { key: 'visual_inspection', label: 'Visual inspection (fuel lines, clamps, leaks, corrosion)', note: 'Every outing' },
                  { key: 'battery_check', label: 'Battery voltage check', note: 'Weekly or before departure' },
                  { key: 'bilge_pump_test', label: 'Bilge pump test', note: 'Weekly' },
                  { key: 'navigation_lights_test', label: 'Navigation lights test', note: 'Before night operation, Every Outing' },
                  { key: 'propeller_inspection', label: 'Propeller visual inspection', note: 'After each trip' }
                ].map((item) => (
                  <label key={item.key} className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={maintenanceChecklist[item.key]}
                      onChange={(e) => setMaintenanceChecklist({ ...maintenanceChecklist, [item.key]: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-600">{item.note}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance Checklist - Inboard Engines */}
          {boat?.engine_config === 'inboard' && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Routine / Per-Use Maintenance</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border">
                {[
                  { key: 'engine_room_inspection', label: 'Engine room visual inspection' },
                  { key: 'fluid_level_check', label: 'Fluid level check (oil, coolant, transmission)' },
                  { key: 'bilge_inspection', label: 'Bilge inspection' },
                  { key: 'generator_test', label: 'Generator test run' },
                  { key: 'seawater_strainer_check', label: 'Seawater strainer check' },
                  { key: 'shore_power_inspection', label: 'Shore power connection inspection' }
                ].map((item) => (
                  <label key={item.key} className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={maintenanceChecklist[item.key]}
                      onChange={(e) => setMaintenanceChecklist({ ...maintenanceChecklist, [item.key]: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total Expenses:</span>
              <span className="text-red-600 font-bold">${totalExpenses.toLocaleString()} MXN</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Net Profit:</span>
              <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${profit.toLocaleString()} MXN
              </span>
            </div>
            <div className="flex justify-between text-xl">
              <span className="font-semibold">ROI:</span>
              <span className={`font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveExpenseMutation.isPending}
              className="bg-[#1e88e5] hover:bg-[#1976d2]"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveExpenseMutation.isPending ? 'Saving...' : 'Save Expenses'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}