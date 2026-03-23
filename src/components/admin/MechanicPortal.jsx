import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wrench, AlertTriangle, CheckCircle, Clock, PlusCircle, Upload,
  ChevronDown, ChevronUp, Gauge, Calendar, FileText, Package, User, Download,
  Bell, BellRing, Send, TrendingUp
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { jsPDF } from 'jspdf';

// ── PDF Generator ─────────────────────────────────────────────────────────────

function generateServiceReportPDF(boat, record) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const colW = pageW - margin * 2;
  let y = 0;

  // Header bar
  doc.setFillColor(12, 35, 64); // #0c2340
  doc.rect(0, 0, pageW, 38, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE REPORT', margin, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FILU Marine — Boat Maintenance Portal', margin, 28);

  // Report number & date
  const reportNo = `SR-${Date.now().toString().slice(-6)}`;
  doc.setFontSize(9);
  doc.text(`Report #${reportNo}`, pageW - margin, 14, { align: 'right' });
  doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, pageW - margin, 22, { align: 'right' });

  y = 48;

  // ── Section helper ──
  const sectionHeader = (title, fillColor = [30, 136, 229]) => {
    doc.setFillColor(...fillColor);
    doc.rect(margin, y, colW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin + 3, y + 5.5);
    y += 12;
    doc.setTextColor(30, 30, 30);
  };

  const field = (label, value, indent = 0) => {
    if (!value && value !== 0) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}:`, margin + indent, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(String(value), colW - 60 - indent);
    doc.text(lines, margin + 55 + indent, y);
    y += Math.max(lines.length * 5.5, 6);
  };

  const divider = () => {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  };

  // ── BOAT DETAILS ──
  sectionHeader('Boat Information');
  field('Boat Name', boat.name);
  field('Type', boat.type);
  field('Size', boat.size);
  field('Location', boat.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo');
  if (boat.dock_location) field('Dock Location', boat.dock_location);
  field('Engine Config', boat.engine_config ? (boat.engine_config.charAt(0).toUpperCase() + boat.engine_config.slice(1)) : undefined);
  if (boat.engine_name) field('Engine Details', boat.engine_name);
  if (boat.engine_quantity) field('Number of Engines', boat.engine_quantity);
  y += 4;

  // ── SERVICE DETAILS ──
  sectionHeader('Service Details', [46, 125, 50]);
  field('Service Date', record.date ? format(parseISO(record.date), 'EEEE, MMMM d, yyyy') : '');
  field('Service Type', record.service_type ? record.service_type.charAt(0).toUpperCase() + record.service_type.slice(1) : '');
  field('Engine Hours at Service', record.engine_hours ? `${record.engine_hours} hrs` : '0 hrs');
  field('Total Cost', record.cost ? `$${Number(record.cost).toLocaleString()} MXN` : '$0 MXN');
  y += 4;

  // ── MECHANIC INFO ──
  sectionHeader('Mechanic Information', [103, 58, 183]);
  field('Mechanic Name', record.mechanic_name || boat.mechanic_name || 'N/A');
  field('Phone', record.mechanic_phone || boat.mechanic_phone || 'N/A');
  if (boat.mechanic_email) field('Email', boat.mechanic_email);
  y += 4;

  // ── WORK PERFORMED ──
  sectionHeader('Work Performed', [183, 28, 28]);
  if (record.work_performed) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(record.work_performed, colW);
    doc.text(lines, margin, y);
    y += lines.length * 5.5 + 4;
  }

  // ── PARSE NOTES for parts & labor ──
  const notesText = record.notes || '';
  const partsMatch = notesText.match(/Parts used:\s*([\s\S]*?)(?:\nLabor hours:|$)/i);
  const laborMatch = notesText.match(/Labor hours:\s*([^\n]+)/i);
  const cleanNotes = notesText
    .replace(/Parts used:[\s\S]*?(?=\nLabor hours:|\nReport:|$)/i, '')
    .replace(/Labor hours:[^\n]*/i, '')
    .replace(/Report:[^\n]*/i, '')
    .trim();

  // ── PARTS USED ──
  if (partsMatch?.[1]?.trim()) {
    sectionHeader('Parts & Materials Used', [255, 143, 0]);
    const parts = partsMatch[1].trim().split(/[,\n]/).map(p => p.trim()).filter(Boolean);
    parts.forEach(part => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 20);
      doc.text(`• ${part}`, margin + 3, y);
      y += 5.5;
    });
    y += 4;
  }

  // ── LABOR HOURS ──
  if (laborMatch?.[1]) {
    field('Labor Hours', `${laborMatch[1].trim()} hours`);
    y += 2;
  }

  // ── NOTES ──
  if (cleanNotes) {
    sectionHeader('Additional Notes & Observations', [96, 125, 139]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(cleanNotes, colW);
    doc.text(lines, margin, y);
    y += lines.length * 5.5 + 4;
  }

  // ── ENGINE HOURS SUMMARY ──
  y += 2;
  sectionHeader('Engine Hours Summary', [55, 71, 79]);
  field('Hours at Last Service', `${boat.last_maintenance_hours || 0} hrs`);
  field('Current Recorded Hours', `${boat.current_hours || 0} hrs`);
  field('Service Interval', `Every ${boat.maintenance_interval_hours || 100} hrs`);
  const nextAt = (boat.last_maintenance_hours || 0) + (boat.maintenance_interval_hours || 100);
  field('Next Service Due At', `${nextAt} hrs`);
  y += 6;

  // ── Footer ──
  divider();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text('This report was automatically generated by the FILU Marine Mechanic Portal.', margin, y);
  y += 5;
  doc.text(`Document ID: ${reportNo} · ${format(new Date(), 'MMM d, yyyy HH:mm')}`, margin, y);

  // Save
  const fileName = `Service_Report_${boat.name.replace(/\s+/g, '_')}_${record.date || 'unknown'}.pdf`;
  doc.save(fileName);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function buildAlerts(boat) {
  const alerts = [];
  const now = new Date();

  const interval = boat.maintenance_interval_hours || 100;
  const lastMaint = boat.last_maintenance_hours || 0;
  const currentHrs = boat.current_hours || 0;
  const hoursUntil = Math.max(0, lastMaint + interval - currentHrs);

  const approachWarn = Math.round(interval * 0.15);
  if (currentHrs > lastMaint + interval) {
    alerts.push({ id: 'engine_overdue', severity: 'critical', title: 'Engine Service OVERDUE', description: `Overdue by ${(currentHrs - lastMaint - interval).toFixed(1)} hrs.`, action: 'Schedule service immediately' });
  } else if (hoursUntil <= approachWarn) {
    alerts.push({ id: 'engine_soon', severity: 'warning', title: `Engine Service in ${hoursUntil.toFixed(1)} hrs`, description: `Next service at ${lastMaint + interval} hrs. You are within the ${approachWarn}-hr warning window.`, action: 'Schedule service soon' });
  }

  const checks = [
    { key: 'last_service_date', label: 'Annual Service', days: 365, severity: 'critical' },
    { key: 'impeller_last_replaced_date', label: 'Impeller Replacement', days: 730, severity: 'critical' },
    { key: 'fuel_filter_last_replaced_date', label: 'Fuel Filter', days: 365, severity: 'warning' },
    { key: 'oil_filter_last_replaced_date', label: 'Oil Filter', days: 365, severity: 'warning' },
    { key: 'zinc_anodes_last_replaced_date', label: 'Zinc Anodes', days: 365, severity: 'warning' },
    { key: 'battery_inspection_date', label: 'Battery Inspection', days: 365, severity: 'info' },
    { key: 'antifouling_last_applied_date', label: 'Anti-Fouling Paint', days: 365, severity: 'info' },
    { key: 'safety_equipment_inspection_date', label: 'Safety Equipment', days: 365, severity: 'warning' },
  ];

  checks.forEach(({ key, label, days, severity }) => {
    if (boat[key]) {
      const d = differenceInDays(now, parseISO(boat[key]));
      if (d > days) {
        alerts.push({ id: key, severity, title: `${label} Overdue`, description: `Last done ${Math.floor(d / 30)} months ago.`, action: `Perform ${label}` });
      }
    } else {
      alerts.push({ id: `${key}_missing`, severity: 'info', title: `${label} Date Not Recorded`, description: 'No date on file.', action: 'Record date after next service' });
    }
  });

  return alerts;
}

const severityStyles = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-600 text-white', icon: AlertTriangle, iconColor: 'text-red-600' },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-500 text-white', icon: Clock, iconColor: 'text-amber-500' },
  info:     { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500 text-white', icon: CheckCircle, iconColor: 'text-blue-500' },
};

// ── Work Order Log Form ───────────────────────────────────────────────────────

function WorkOrderForm({ boat, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    service_type: 'minor',
    engine_hours: boat.current_hours || 0,
    cost: 0,
    mechanic_name: boat.mechanic_name || '',
    mechanic_phone: boat.mechanic_phone || '',
    work_performed: '',
    notes: '',
    parts_used: '',
    labor_hours: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [reportUrl, setReportUrl] = useState('');
  const [savedRecord, setSavedRecord] = useState(null);

  const updateBoatMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BoatInventory.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      // keep dialog open briefly to show PDF button
      const rec = vars.data.maintenance_records[vars.data.maintenance_records.length - 1];
      setSavedRecord(rec);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setReportUrl(file_url);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      date: form.date,
      service_type: form.service_type,
      engine_hours: Number(form.engine_hours),
      cost: Number(form.cost),
      mechanic_name: form.mechanic_name,
      mechanic_phone: form.mechanic_phone,
      work_performed: form.work_performed,
      notes: `${form.notes}${form.parts_used ? `\n\nParts used: ${form.parts_used}` : ''}${form.labor_hours ? `\nLabor hours: ${form.labor_hours}` : ''}${reportUrl ? `\nReport: ${reportUrl}` : ''}`,
    };

    const existingRecords = boat.maintenance_records || [];
    const updatedData = {
      maintenance_records: [...existingRecords, newRecord],
      last_service_date: form.date,
      last_service_mechanic_phone: form.mechanic_phone,
      last_maintenance_hours: Number(form.engine_hours),
    };

    updateBoatMutation.mutate({ id: boat.id, data: updatedData });
    setSavedRecord(newRecord); // optimistic: show PDF button immediately after submit attempt
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Service Date *</Label>
          <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
        </div>
        <div>
          <Label className="text-xs">Service Type *</Label>
          <Select value={form.service_type} onValueChange={v => setForm(p => ({ ...p, service_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="minor">Minor Service</SelectItem>
              <SelectItem value="major">Major Service</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Engine Hours at Service *</Label>
          <Input type="number" min="0" value={form.engine_hours} onChange={e => setForm(p => ({ ...p, engine_hours: e.target.value }))} required />
        </div>
        <div>
          <Label className="text-xs">Labor Hours</Label>
          <Input type="number" min="0" step="0.5" value={form.labor_hours} onChange={e => setForm(p => ({ ...p, labor_hours: e.target.value }))} />
        </div>
        <div>
          <Label className="text-xs">Total Cost (MXN)</Label>
          <Input type="number" min="0" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} />
        </div>
        <div>
          <Label className="text-xs">Mechanic Name</Label>
          <Input value={form.mechanic_name} onChange={e => setForm(p => ({ ...p, mechanic_name: e.target.value }))} placeholder="Your name" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Mechanic Phone</Label>
          <Input type="tel" value={form.mechanic_phone} onChange={e => setForm(p => ({ ...p, mechanic_phone: e.target.value }))} placeholder="+52 755 123 4567" />
        </div>
      </div>

      <div>
        <Label className="text-xs">Work Performed *</Label>
        <Textarea
          rows={3}
          required
          value={form.work_performed}
          onChange={e => setForm(p => ({ ...p, work_performed: e.target.value }))}
          placeholder="Describe the work completed in detail..."
        />
      </div>

      <div>
        <Label className="text-xs">Parts Used</Label>
        <Textarea
          rows={2}
          value={form.parts_used}
          onChange={e => setForm(p => ({ ...p, parts_used: e.target.value }))}
          placeholder="e.g., Oil filter x1, Impeller kit x1, Engine oil 4L..."
        />
      </div>

      <div>
        <Label className="text-xs">Additional Notes</Label>
        <Textarea
          rows={2}
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          placeholder="Observations, recommendations, next service notes..."
        />
      </div>

      <div>
        <Label className="text-xs flex items-center gap-1"><Upload className="h-3 w-3" /> Upload Service Report (PDF/Image)</Label>
        <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="mt-1 cursor-pointer" disabled={uploading} />
        {uploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
        {reportUrl && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Report uploaded successfully</p>}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={updateBoatMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          {updateBoatMutation.isPending ? 'Saving...' : 'Log Service & Update Records'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      </div>

      {savedRecord && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Service logged successfully!</p>
            <p className="text-xs text-emerald-600">Download the auto-generated PDF report.</p>
          </div>
          <Button
            type="button"
            size="sm"
            className="bg-[#1e88e5] hover:bg-[#1976d2] flex-shrink-0"
            onClick={() => generateServiceReportPDF(boat, savedRecord)}
          >
            <Download className="h-4 w-4 mr-1" /> Download PDF
          </Button>
        </div>
      )}
    </form>
  );
}

// ── Boat Card for Mechanic ────────────────────────────────────────────────────

function BoatMechanicCard({ boat, currentUser, allBookings, personalTrips }) {
  const [expanded, setExpanded] = useState(false);
  const [workOrderOpen, setWorkOrderOpen] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [alertError, setAlertError] = useState('');

  // Compute real engine hours: base + booking hours + personal trip hours
  const bookingHrs = (allBookings || [])
    .filter(b => b.boat_name === boat.name && b.status !== 'cancelled')
    .reduce((s, b) => s + (b.engine_hours_used || 0), 0);
  const personalHrs = (personalTrips || [])
    .filter(t => t.boat_id === boat.id)
    .reduce((s, t) => s + (t.engine_hours_used || 0), 0);
  const totalEngineHours = (boat.current_hours || 0) + bookingHrs + personalHrs;

  // Build a synthetic boat object with computed hours for alerts
  const boatWithComputedHours = { ...boat, current_hours: totalEngineHours };

  const alerts = buildAlerts(boatWithComputedHours);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  const sortedAlerts = [...criticalAlerts, ...warningAlerts, ...infoAlerts];
  const recentRecords = (boat.maintenance_records || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const interval = boat.maintenance_interval_hours || 100;
  const hoursUntilService = Math.max(0, (boat.last_maintenance_hours || 0) + interval - totalEngineHours);
  const serviceOverdue = totalEngineHours > (boat.last_maintenance_hours || 0) + interval;
  const approachingThreshold = interval * 0.15; // flag when within 15% of interval
  const isApproaching = !serviceOverdue && hoursUntilService <= approachingThreshold;

  const handleSendAlert = async () => {
    const ownerEmail = boat.owner_phone?.includes('@') ? boat.owner_phone : null;
    // Try mechanic email or boat contact
    const emailTarget = boat.mechanic_email || ownerEmail;
    if (!emailTarget) {
      setAlertError('No email address on file. Add a mechanic email in the boat profile.');
      return;
    }
    setSendingAlert(true);
    setAlertError('');
    try {
      await base44.functions.invoke('sendMaintenanceAlert', {
        boatName: boat.name,
        ownerEmail: emailTarget,
        ownerPhone: boat.owner_phone || '',
        alerts: sortedAlerts.filter(a => a.severity !== 'info'),
        engineHours: totalEngineHours,
        hoursUntilService,
      });
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 4000);
    } catch (err) {
      setAlertError(err.message || 'Failed to send alert.');
    }
    setSendingAlert(false);
  };

  return (
    <Card className="overflow-hidden border-2 border-slate-200 hover:border-slate-300 transition-all">
      {/* Boat Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {boat.image && <img src={boat.image} alt={boat.name} className="w-12 h-12 rounded-lg object-cover border-2 border-white/20" />}
          <div>
            <h3 className="text-white font-bold text-lg">{boat.name}</h3>
            <p className="text-white/70 text-xs">{boat.type} · {boat.size} · {boat.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalAlerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              {criticalAlerts.length} Critical
            </span>
          )}
          <Badge className={boat.status === 'active' ? 'bg-emerald-500 text-white' : boat.status === 'maintenance' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'}>
            {boat.status}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Engine Hours Summary — uses computed total hours */}
        <div className="space-y-2">
          {(isApproaching || serviceOverdue) && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${serviceOverdue ? 'bg-red-50 border border-red-300 text-red-700' : 'bg-amber-50 border border-amber-300 text-amber-700'}`}>
              <BellRing className="h-4 w-4 flex-shrink-0 animate-pulse" />
              {serviceOverdue
                ? `Service OVERDUE by ${(totalEngineHours - (boat.last_maintenance_hours || 0) - interval).toFixed(1)} hrs — Schedule immediately!`
                : `Service approaching — only ${hoursUntilService.toFixed(1)} hrs remaining (within ${Math.round(approachingThreshold)} hr warning threshold)`}
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-50 rounded-lg p-2.5 text-center border">
              <p className="text-[10px] text-slate-500 mb-1">Base Hours</p>
              <p className="text-lg font-bold text-slate-800">{boat.current_hours || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2.5 text-center border border-blue-200">
              <p className="text-[10px] text-blue-600 mb-1">Booking Hrs</p>
              <p className="text-lg font-bold text-blue-700">+{bookingHrs.toFixed(1)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2.5 text-center border border-amber-200">
              <p className="text-[10px] text-amber-700 mb-1">Total Hours</p>
              <p className="text-lg font-bold text-amber-700">{totalEngineHours.toFixed(1)}</p>
            </div>
            <div className={`rounded-lg p-2.5 text-center border ${serviceOverdue ? 'bg-red-50 border-red-300' : isApproaching ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-200'}`}>
              <p className="text-[10px] text-slate-500 mb-1">Until Service</p>
              <p className={`text-lg font-bold ${serviceOverdue ? 'text-red-600' : isApproaching ? 'text-amber-600' : 'text-green-600'}`}>
                {serviceOverdue ? 'OVERDUE' : hoursUntilService.toFixed(1)}
              </p>
            </div>
          </div>
          {/* Hours breakdown note */}
          <p className="text-[10px] text-slate-400 text-right">
            Total = base {boat.current_hours || 0} + bookings {bookingHrs.toFixed(1)} + personal {personalHrs.toFixed(1)} hrs
          </p>
        </div>

        {/* Mechanic Contact Info */}
        {(boat.mechanic_name || boat.mechanic_phone) && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <p className="font-semibold text-blue-800 mb-1 flex items-center gap-1"><User className="h-3 w-3" /> Assigned Mechanic</p>
            {boat.mechanic_name && <p className="text-blue-700">{boat.mechanic_name}</p>}
            {boat.mechanic_phone && <p className="text-blue-600">{boat.mechanic_phone}</p>}
            {boat.mechanic_email && <p className="text-blue-600">{boat.mechanic_email}</p>}
          </div>
        )}

        {/* Alerts */}
        <div>
          <button
            type="button"
            onClick={() => setAlertsExpanded(p => !p)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 mb-2"
          >
            <span className="flex items-center gap-1">
              <AlertTriangle className={`h-3.5 w-3.5 ${criticalAlerts.length > 0 ? 'text-red-500' : 'text-amber-500'}`} />
              Maintenance Alerts ({sortedAlerts.length})
            </span>
            {alertsExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
          </button>
          {alertsExpanded && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {sortedAlerts.length === 0 ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> All systems nominal — no alerts.
                </div>
              ) : sortedAlerts.map(alert => {
                const cfg = severityStyles[alert.severity];
                const Icon = cfg.icon;
                return (
                  <div key={alert.id} className={`rounded-lg border ${cfg.bg} ${cfg.border} px-3 py-2 flex items-start gap-2`}>
                    <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{alert.title}</p>
                      <p className="text-xs text-slate-600">{alert.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5 italic">→ {alert.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Last Service Date */}
        {boat.last_service_date && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Last service: <strong>{format(parseISO(boat.last_service_date), 'MMM d, yyyy')}</strong></span>
          </div>
        )}

        {/* Send Maintenance Alert */}
        <div className="space-y-1.5">
          <Button
            variant="outline"
            className={`w-full gap-2 text-sm ${criticalAlerts.length > 0 ? 'border-red-300 text-red-700 hover:bg-red-50' : warningAlerts.length > 0 ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-slate-300 text-slate-600'}`}
            onClick={handleSendAlert}
            disabled={sendingAlert || sortedAlerts.filter(a => a.severity !== 'info').length === 0}
          >
            {sendingAlert ? <><Send className="h-4 w-4 animate-pulse" />Sending...</> :
             alertSent ? <><CheckCircle className="h-4 w-4 text-emerald-600" />Alert Sent!</> :
             <><Bell className="h-4 w-4" />Send Alert to Owner / Mechanic</>}
          </Button>
          {alertError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{alertError}</p>}
          {alertSent && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">Maintenance alert emailed successfully.</p>}
          <p className="text-[10px] text-slate-400 text-center">Email sent to mechanic_email from boat profile. Add it in Boat Inventory to enable.</p>
        </div>

        {/* Log Work Order Button */}
        <Button
          className="w-full bg-[#1e88e5] hover:bg-[#1976d2]"
          onClick={() => setWorkOrderOpen(true)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Log Completed Service / Work Order
        </Button>

        {/* Recent Maintenance Records Toggle */}
        <button
          type="button"
          onClick={() => setExpanded(p => !p)}
          className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Service History ({boat.maintenance_records?.length || 0} records)</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <div className="space-y-2 max-h-72 overflow-y-auto border-t pt-2">
            {recentRecords.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No service records yet.</p>
            ) : recentRecords.map((rec, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{format(parseISO(rec.date), 'MMM d, yyyy')}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className={rec.service_type === 'major' ? 'bg-purple-100 text-purple-800' : rec.service_type === 'repair' ? 'bg-red-100 text-red-800' : rec.service_type === 'inspection' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}>
                      {rec.service_type}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => generateServiceReportPDF(boat, rec)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-[#1e88e5] text-white rounded text-xs hover:bg-[#1976d2] transition-colors"
                      title="Download PDF Report"
                    >
                      <Download className="h-3 w-3" /> PDF
                    </button>
                  </div>
                </div>
                {rec.engine_hours && <p className="text-slate-600"><Gauge className="h-3 w-3 inline mr-1" />{rec.engine_hours} hrs</p>}
                {rec.work_performed && <p className="text-slate-600">{rec.work_performed}</p>}
                {rec.cost > 0 && <p className="text-green-700 font-semibold">${rec.cost?.toLocaleString()} MXN</p>}
                {rec.mechanic_name && <p className="text-slate-500">Mechanic: {rec.mechanic_name}</p>}
                {rec.notes && (
                  <div className="mt-1 p-2 bg-white rounded border border-slate-200 whitespace-pre-line text-slate-500">{rec.notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Work Order Dialog */}
      <Dialog open={workOrderOpen} onOpenChange={setWorkOrderOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#1e88e5]" />
              Log Service — {boat.name}
            </DialogTitle>
          </DialogHeader>
          <WorkOrderForm boat={boat} onClose={() => setWorkOrderOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MechanicPortal({ currentUser, operatorFilter = 'all' }) {
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  const isOperatorAdmin = currentUser?.role === 'operator_admin';
  const assignedBoat = currentUser?.assigned_boat || '';

  const { data: boats = [], isLoading } = useQuery({
    queryKey: ['boats'],
    queryFn: () => base44.entities.BoatInventory.list('-created_date'),
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const { data: personalTrips = [] } = useQuery({
    queryKey: ['personal-trips'],
    queryFn: () => base44.entities.PersonalTrip.list('-trip_date'),
  });

  const visibleBoats = boats.filter(boat => {
    if (isAdmin || currentUser?.role === 'crew') return assignedBoat ? boat.name === assignedBoat : true;
    // Apply operator filter for superadmin/operator_admin
    if (operatorFilter && operatorFilter !== 'all') {
      const bOp = (boat.operator || '').toLowerCase();
      const fOp = operatorFilter.toLowerCase();
      if (!(fOp === 'filu' ? (!bOp || bOp === 'filu') : bOp === fOp)) return false;
    }
    return true;
  });

  const totalAlerts = visibleBoats.reduce((sum, b) => sum + buildAlerts(b).filter(a => a.severity === 'critical').length, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-[#1e88e5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="h-6 w-6 text-[#1e88e5]" />
              Mechanic Portal
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Logged in as <strong>{currentUser?.full_name || currentUser?.username}</strong>
              {assignedBoat && ` · Assigned to: ${assignedBoat}`}
            </p>
          </div>
          <div className="text-right">
            {totalAlerts > 0 && (
              <div className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> {totalAlerts} Critical Alert{totalAlerts > 1 ? 's' : ''}
              </div>
            )}
            <p className="text-white/50 text-xs mt-2">{visibleBoats.length} boat{visibleBoats.length !== 1 ? 's' : ''} in view</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{visibleBoats.reduce((s, b) => s + buildAlerts(b).filter(a => a.severity === 'critical').length, 0)}</p>
            <p className="text-xs text-white/70">Critical Alerts</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{visibleBoats.reduce((s, b) => s + buildAlerts(b).filter(a => a.severity === 'warning').length, 0)}</p>
            <p className="text-xs text-white/70">Warnings</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{visibleBoats.reduce((s, b) => s + (b.maintenance_records?.length || 0), 0)}</p>
            <p className="text-xs text-white/70">Total Service Records</p>
          </div>
        </div>
      </div>

      {visibleBoats.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p>No boats assigned to your account.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {visibleBoats.map(boat => (
            <BoatMechanicCard key={boat.id} boat={boat} currentUser={currentUser} allBookings={allBookings} personalTrips={personalTrips} />
          ))}
        </div>
      )}
    </div>
  );
}