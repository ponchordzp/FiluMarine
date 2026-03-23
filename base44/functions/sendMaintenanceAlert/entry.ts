import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { boatName, ownerPhone, ownerEmail, alerts, engineHours, hoursUntilService } = await req.json();

    if (!ownerEmail && !ownerPhone) {
      return Response.json({ error: 'No contact info on file for this boat owner.' }, { status: 400 });
    }

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount  = alerts.filter(a => a.severity === 'warning').length;

    const alertRows = alerts.map(a => {
      const icon = a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟡' : '🔵';
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${icon} <strong>${a.title}</strong></td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">${a.description}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-style:italic">${a.action}</td>
      </tr>`;
    }).join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:640px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0c2340,#1e88e5);padding:28px 32px">
      <h1 style="color:white;margin:0;font-size:22px">🔧 Maintenance Alert — ${boatName}</h1>
      <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px">FILU Marine · Automated Maintenance Notification</p>
    </div>
    <div style="padding:28px 32px">
      <div style="display:flex;gap:12px;margin-bottom:24px">
        ${criticalCount > 0 ? `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:bold">${criticalCount} Critical</span>` : ''}
        ${warningCount > 0 ? `<span style="background:#fffbeb;color:#d97706;border:1px solid #fde68a;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:bold">${warningCount} Warning</span>` : ''}
      </div>
      <p style="color:#475569;margin:0 0 8px">Current engine hours: <strong style="color:#0f172a">${engineHours} hrs</strong></p>
      <p style="color:#475569;margin:0 0 24px">Hours until next service: <strong style="color:${hoursUntilService <= 0 ? '#dc2626' : hoursUntilService <= 10 ? '#d97706' : '#16a34a'}">${hoursUntilService <= 0 ? 'OVERDUE' : hoursUntilService + ' hrs'}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="text-align:left;padding:8px 10px;color:#475569;font-size:11px;text-transform:uppercase">Alert</th>
            <th style="text-align:left;padding:8px 10px;color:#475569;font-size:11px;text-transform:uppercase">Details</th>
            <th style="text-align:left;padding:8px 10px;color:#475569;font-size:11px;text-transform:uppercase">Action</th>
          </tr>
        </thead>
        <tbody>${alertRows}</tbody>
      </table>
      <p style="color:#94a3b8;font-size:11px;margin-top:24px">This alert was triggered automatically by the FILU Marine Maintenance System. Please review and schedule service at your earliest convenience.</p>
    </div>
  </div>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: ownerEmail,
      subject: `[FILU Marine] Maintenance Alert — ${boatName} (${criticalCount} critical, ${warningCount} warning)`,
      body: html,
    });

    return Response.json({ success: true, message: `Alert sent to ${ownerEmail}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});