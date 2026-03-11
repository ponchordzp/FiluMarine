import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking, expenseRecord, commissionPct, recipientEmail, totalExpenses, netProfit } = await req.json();

    const exp = expenseRecord || {};
    const commission = ((booking.total_price || 0) * (commissionPct || 0) / 100);
    const balanceCollected = booking.remaining_payment_status === 'collected_on_site';
    const remaining = Math.max(0, (booking.total_price || 0) - (booking.deposit_paid || 0));

    const expRows = [
      ['Fuel', exp.fuel_cost],
      ['Crew', exp.crew_cost],
      ['Maintenance', exp.maintenance_cost],
      ['Cleaning', exp.cleaning_cost],
      ['Supplies', exp.supplies_cost],
      ['Other', exp.other_cost],
    ]
      .filter(([, v]) => v > 0)
      .map(([k, v]) =>
        `<tr><td style="padding:5px 12px;color:#64748b">&nbsp;&nbsp;${k}</td><td style="padding:5px 12px;text-align:right;color:#ef4444">-$${Number(v).toLocaleString()} MXN</td></tr>`
      )
      .join('');

    const body = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;margin:0;background:#f1f5f9;">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
  
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#050d1a 0%,#0d2444 100%);padding:32px 28px;">
    <h1 style="margin:0;color:white;font-size:26px;font-weight:bold;letter-spacing:-0.5px">FILU Marine</h1>
    <p style="margin:6px 0 0;color:rgba(148,197,253,0.85);font-size:13px;letter-spacing:0.5px">TRIP REPORT</p>
    <p style="margin:12px 0 0;color:rgba(255,255,255,0.4);font-size:11px;">Confirmation: <strong style="color:rgba(255,255,255,0.75);font-family:monospace">${booking.confirmation_code || '—'}</strong></p>
  </div>

  <div style="padding:28px;">
    <!-- Guest Details -->
    <h2 style="color:#0f172a;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Guest Details</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:5px 0;color:#64748b;width:38%;font-size:13px">Guest Name</td><td style="font-weight:600;color:#0f172a;font-size:13px">${booking.guest_name || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Email</td><td style="color:#0f172a;font-size:13px">${booking.guest_email || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Phone</td><td style="color:#0f172a;font-size:13px">${booking.guest_phone || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Guests</td><td style="color:#0f172a;font-size:13px">${booking.guests || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Experience</td><td style="color:#0f172a;font-size:13px;text-transform:capitalize">${(booking.experience_type || '').replace(/_/g, ' ')}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Trip Date</td><td style="font-weight:600;color:#0f172a;font-size:13px">${booking.date || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Departure</td><td style="color:#0f172a;font-size:13px">${booking.time_slot || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Boat</td><td style="font-weight:600;color:#1e88e5;font-size:13px">${booking.boat_name || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Location</td><td style="color:#0f172a;font-size:13px">${booking.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}</td></tr>
    </table>

    <!-- Financial Summary -->
    <h2 style="color:#0f172a;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Financial Summary</h2>
    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#f0fdf4"><td style="padding:10px 12px;color:#374151;font-weight:600;font-size:13px">Revenue</td><td style="padding:10px 12px;text-align:right;color:#10b981;font-weight:700;font-size:15px">$${(booking.total_price || 0).toLocaleString()} MXN</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-size:13px">Deposit Paid</td><td style="padding:8px 12px;text-align:right;color:#374151;font-size:13px">$${(booking.deposit_paid || 0).toLocaleString()} MXN</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-size:13px">Balance on Arrival</td><td style="padding:8px 12px;text-align:right;font-weight:600;font-size:13px;color:${balanceCollected ? '#10b981' : '#f59e0b'}">${balanceCollected ? '✅ Collected' : '$' + remaining.toLocaleString() + ' MXN'}</td></tr>
      ${expRows ? `<tr style="background:#fef2f2"><td colspan="2" style="padding:8px 12px;color:#64748b;font-weight:600;font-size:12px;letter-spacing:0.5px">EXPENSES BREAKDOWN</td></tr>${expRows}` : ''}
      ${(commissionPct || 0) > 0 ? `<tr style="background:#fff7ed"><td style="padding:8px 12px;color:#64748b;font-size:13px">FILU Commission (${commissionPct}%)</td><td style="padding:8px 12px;text-align:right;color:#f97316;font-size:13px">-$${commission.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</td></tr>` : ''}
      <tr style="background:#e0f2fe;border-top:2px solid #1e88e5"><td style="padding:14px 12px;font-weight:800;color:#0f172a;font-size:15px">Net Profit</td><td style="padding:14px 12px;text-align:right;font-weight:800;font-size:16px;color:${(netProfit || 0) >= 0 ? '#10b981' : '#ef4444'}">$${Number(netProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</td></tr>
    </table>

    ${booking.special_requests ? `<div style="padding:14px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;margin-bottom:12px"><p style="margin:0 0 4px;font-weight:600;color:#92400e;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Special Requests</p><p style="margin:0;color:#374151;font-size:13px">${booking.special_requests}</p></div>` : ''}
    ${exp.notes ? `<div style="padding:14px;background:#f0f9ff;border-left:4px solid #1e88e5;border-radius:4px"><p style="margin:0 0 4px;font-weight:600;color:#1e3a5f;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Expense Notes</p><p style="margin:0;color:#374151;font-size:13px">${exp.notes}</p></div>` : ''}
  </div>

  <!-- Footer -->
  <div style="background:#050d1a;padding:16px 28px;text-align:center;">
    <p style="margin:0;color:rgba(255,255,255,0.35);font-size:11px;">FILU Marine — Confidential Trip Report &nbsp;•&nbsp; Booking ${booking.confirmation_code || '—'}</p>
  </div>
</div>
</body>
</html>`;

    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `FILU Marine Trip Report — ${booking.guest_name || ''} (${booking.date || ''})`,
      body,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});