import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Mail, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';

const EXP_LABELS = {
  half_day_fishing: 'Half Day Fishing',
  full_day_fishing: 'Full Day Fishing',
  extended_fishing: 'Extended Fishing',
  snorkeling: 'Snorkeling',
  coastal_leisure: 'Coastal Leisure',
};

export default function TripReportDialog({ open, onClose, booking, expenseRecord, commissionPct }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const exp = expenseRecord || {};
  const totalExpenses =
    (exp.fuel_cost || 0) + (exp.crew_cost || 0) + (exp.maintenance_cost || 0) +
    (exp.cleaning_cost || 0) + (exp.supplies_cost || 0) + (exp.other_cost || 0);
  const commission = ((booking.total_price || 0) * (commissionPct || 0)) / 100;
  const netProfit = (booking.total_price || 0) - totalExpenses - commission;
  const remaining = Math.max(0, (booking.total_price || 0) - (booking.deposit_paid || 0));
  const balanceCollected = booking.remaining_payment_status === 'collected_on_site';

  const generatePDF = () => {
    const doc = new jsPDF();
    const W = 210;

    // Header bar
    doc.setFillColor(5, 13, 26);
    doc.rect(0, 0, W, 42, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FILU Marine', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 197, 253);
    doc.text('TRIP REPORT', 14, 27);

    doc.setTextColor(100, 130, 170);
    doc.setFontSize(8);
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 35);

    doc.setFontSize(8);
    doc.setTextColor(100, 130, 170);
    doc.text('Confirmation', W - 14, 20, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(booking.confirmation_code || '—', W - 14, 29, { align: 'right' });

    let y = 54;

    // ── Guest Details ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 136, 229);
    doc.text('GUEST DETAILS', 14, y);
    y += 3;
    doc.setDrawColor(30, 136, 229);
    doc.line(14, y, W - 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    const guestFields = [
      ['Guest Name', booking.guest_name || '—'],
      ['Email', booking.guest_email || '—'],
      ['Phone', booking.guest_phone || '—'],
      ['Guests', String(booking.guests || '—')],
      ['Experience', EXP_LABELS[booking.experience_type] || (booking.experience_type || '—').replace(/_/g, ' ')],
      ['Date', booking.date ? format(parseISO(booking.date), 'EEE, MMM d, yyyy') : '—'],
      ['Departure', booking.time_slot || '—'],
      ['Boat', booking.boat_name || '—'],
      ['Location', booking.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'],
    ];

    const half = Math.ceil(guestFields.length / 2);
    guestFields.forEach((field, i) => {
      const col = i < half ? 0 : 1;
      const row = i < half ? i : i - half;
      const x = 14 + col * 97;
      const fy = y + row * 9;
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(field[0], x, fy);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(field[1], x, fy + 4.5);
      doc.setFont('helvetica', 'normal');
    });

    y += half * 9 + 6;

    // ── Financial Summary ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('FINANCIAL SUMMARY', 14, y);
    y += 3;
    doc.setDrawColor(16, 185, 129);
    doc.line(14, y, W - 14, y);
    y += 6;

    // Revenue
    doc.setFillColor(240, 253, 244);
    doc.rect(14, y - 4, W - 28, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Revenue', 18, y + 2);
    doc.setTextColor(16, 185, 129);
    doc.text(`$${(booking.total_price || 0).toLocaleString()} MXN`, W - 18, y + 2, { align: 'right' });
    y += 11;

    const finRows = [
      ['Deposit Paid', `$${(booking.deposit_paid || 0).toLocaleString()} MXN`, [15, 23, 42]],
      ['Balance on Arrival', balanceCollected ? '✅ Collected' : `$${remaining.toLocaleString()} MXN`, balanceCollected ? [16, 185, 129] : [245, 158, 11]],
    ];
    finRows.forEach(([label, val, color]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label, 18, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(val, W - 18, y, { align: 'right' });
      y += 8;
    });

    // Expenses breakdown
    const expRows = [
      ['Fuel', exp.fuel_cost],
      ['Crew', exp.crew_cost],
      ['Maintenance', exp.maintenance_cost],
      ['Cleaning', exp.cleaning_cost],
      ['Supplies', exp.supplies_cost],
      ['Other', exp.other_cost],
    ].filter(([, v]) => v > 0);

    if (expRows.length > 0) {
      y += 2;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('EXPENSES', 18, y);
      y += 5;
      expRows.forEach(([label, val]) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`  ${label}`, 18, y);
        doc.setTextColor(239, 68, 68);
        doc.text(`-$${Number(val).toLocaleString()} MXN`, W - 18, y, { align: 'right' });
        y += 7;
      });
    }

    if (commission > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`FILU Commission (${commissionPct}%)`, 18, y);
      doc.setTextColor(249, 115, 22);
      doc.text(`-$${commission.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN`, W - 18, y, { align: 'right' });
      y += 7;
    }

    // Net Profit bar
    y += 2;
    doc.setFillColor(224, 242, 254);
    doc.rect(14, y - 2, W - 28, 13, 'F');
    doc.setDrawColor(30, 136, 229);
    doc.line(14, y - 2, W - 14, y - 2);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Net Profit', 18, y + 6);
    if (netProfit >= 0) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(`$${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN`, W - 18, y + 6, { align: 'right' });
    y += 17;

    // Special requests / notes
    if (booking.special_requests) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('SPECIAL REQUESTS', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(booking.special_requests, W - 28);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 4;
    }

    if (exp.notes) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('EXPENSE NOTES', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(exp.notes, W - 28);
      doc.text(lines, 14, y);
    }

    // Footer
    doc.setFillColor(5, 13, 26);
    doc.rect(0, 282, W, 15, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('FILU Marine — Confidential Trip Report', 14, 291);
    doc.text(`Booking: ${booking.confirmation_code || '—'}`, W - 14, 291, { align: 'right' });

    doc.save(`FILU_Report_${booking.confirmation_code || 'trip'}.pdf`);
  };

  const handleSendEmail = async () => {
    if (!email) return;
    setSending(true);
    try {
      await base44.functions.invoke('sendTripReport', {
        booking,
        expenseRecord: exp,
        commissionPct: commissionPct || 0,
        recipientEmail: email,
        totalExpenses,
        netProfit,
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-blue-400" />
            Trip Report — <span className="font-mono text-blue-300">{booking.confirmation_code}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Summary preview */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="grid grid-cols-2 gap-y-1 text-sm">
            <div><span className="text-slate-500">Guest:</span> <strong className="text-slate-800">{booking.guest_name}</strong></div>
            <div><span className="text-slate-500">Boat:</span> <strong className="text-slate-800">{booking.boat_name}</strong></div>
            <div><span className="text-slate-500">Date:</span> <strong className="text-slate-800">{booking.date ? format(parseISO(booking.date), 'MMM d, yyyy') : '—'}</strong></div>
            <div><span className="text-slate-500">Guests:</span> <strong className="text-slate-800">{booking.guests}</strong></div>
          </div>
          <div className="border-t border-slate-200 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Revenue</span>
              <strong className="text-emerald-600">${(booking.total_price || 0).toLocaleString()} MXN</strong>
            </div>
            {totalExpenses > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expenses</span>
                <strong className="text-red-500">-${totalExpenses.toLocaleString()} MXN</strong>
              </div>
            )}
            {commission > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Commission ({commissionPct}%)</span>
                <strong className="text-orange-500">-${commission.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</strong>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-1">
              <span className="text-slate-700">Net Profit</span>
              <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                ${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
              </span>
            </div>
          </div>
        </div>

        {/* Download PDF */}
        <Button
          onClick={generatePDF}
          className="w-full gap-2 font-semibold"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e88e5)', border: 'none' }}
        >
          <Download className="h-4 w-4" />
          Download PDF Report
        </Button>

        {/* Email to owner */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-600 font-medium">Email report to boat owner</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="owner@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setSent(false); }}
              className="flex-1"
            />
            <Button
              onClick={handleSendEmail}
              disabled={!email || sending || sent}
              variant="outline"
              className="gap-2 shrink-0"
            >
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : sent
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                : <Mail className="h-4 w-4" />}
              {sent ? 'Sent!' : 'Send'}
            </Button>
          </div>
          {sent && <p className="text-xs text-emerald-600">✅ Report sent successfully to {email}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}