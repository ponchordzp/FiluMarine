import React from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, Phone, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';

function generateAlerts(boat, actualCurrentHours) {
  const alerts = [];
  const now = new Date();
  const createdDate = format(now, 'MMM d, yyyy');

  const interval = boat.maintenance_interval_hours || 100;
  const lastMaintHrs = boat.last_maintenance_hours || 0;
  const hoursUntil = Math.max(0, lastMaintHrs + interval - actualCurrentHours);
  const hoursSince = actualCurrentHours - lastMaintHrs;

  if (hoursUntil === 0) {
    alerts.push({ id: 'engine_overdue', severity: 'critical', safety: true, createdDate, title: 'Engine Service OVERDUE', description: `Overdue by ${Math.abs(hoursSince - interval).toFixed(0)} hrs. Operating without service is a safety risk — engine failure possible.`, action: 'Schedule service immediately' });
  } else if (hoursUntil <= 10) {
    alerts.push({ id: 'engine_due_soon', severity: 'warning', safety: false, createdDate, title: `Engine Service Due in ${hoursUntil.toFixed(0)} hrs`, description: `Schedule before reaching ${lastMaintHrs + interval} total engine hours.`, action: 'Schedule service now' });
  }

  if (boat.last_service_date) {
    const daysSinceService = differenceInDays(now, parseISO(boat.last_service_date));
    if (daysSinceService > 365) {
      alerts.push({ id: 'service_over_year', severity: 'critical', safety: true, createdDate, title: 'No Service in Over 12 Months', description: `Last service was ${daysSinceService} days ago. Coolant, belts, and seals degrade over time regardless of hours.`, action: 'Schedule annual inspection' });
    } else if (daysSinceService > 270) {
      alerts.push({ id: 'service_9months', severity: 'warning', safety: false, createdDate, title: 'Service Approaching 9 Months Ago', description: `Last service was ${daysSinceService} days ago. Plan your annual service soon.`, action: 'Plan annual service' });
    }
  } else {
    alerts.push({ id: 'no_service_date', severity: 'warning', safety: false, createdDate, title: 'No Service Date Recorded', description: 'No last service date on file. Update maintenance records.', action: 'Update records' });
  }

  if (boat.engine_config === 'outboard') {
    if (boat.impeller_last_replaced_date) {
      const d = differenceInDays(now, parseISO(boat.impeller_last_replaced_date));
      if (d > 730) alerts.push({ id: 'impeller_overdue', severity: 'critical', safety: true, createdDate, title: `Water Pump Impeller Overdue (${Math.floor(d / 365)}y ago)`, description: 'Replace every 2 years. A failed impeller causes engine overheating and seizure.', action: 'Replace impeller immediately' });
      else if (d > 548) alerts.push({ id: 'impeller_due_soon', severity: 'warning', safety: false, createdDate, title: 'Water Pump Impeller Due Soon', description: `Last replaced ${Math.floor(d / 30)} months ago. Replacement recommended every 2 years.`, action: 'Schedule impeller replacement' });
    } else {
      alerts.push({ id: 'impeller_no_date', severity: 'info', safety: false, createdDate, title: 'Impeller Replacement Date Not Recorded', description: 'Log when the water pump impeller was last replaced to track its cycle.', action: 'Record impeller replacement date' });
    }
    if (boat.spark_plugs_last_replaced_date) {
      const d = differenceInDays(now, parseISO(boat.spark_plugs_last_replaced_date));
      if (d > 730) alerts.push({ id: 'spark_plugs_overdue', severity: 'warning', safety: false, createdDate, title: 'Spark Plugs Due for Replacement', description: `Last replaced ${Math.floor(d / 365)} years ago. Worn plugs affect performance and fuel efficiency.`, action: 'Replace spark plugs' });
    }
    if (boat.last_service_date && differenceInDays(now, parseISO(boat.last_service_date)) > 90) {
      alerts.push({ id: 'flush_reminder', severity: 'info', safety: false, createdDate, title: 'Saltwater Flush Recommended', description: 'Flush outboard engines regularly to prevent internal corrosion.', action: 'Flush engines' });
    }
  }

  if (boat.engine_config === 'inboard') {
    if (actualCurrentHours > 500 && hoursSince > 200) {
      alerts.push({ id: 'coolant_check', severity: 'warning', safety: true, createdDate, title: 'Coolant System Inspection Due', description: 'High engine hours: check heat exchanger, impeller, and zincs. Overheating can cause engine failure.', action: 'Inspect cooling system' });
    }
    if (boat.impeller_last_replaced_date) {
      const d = differenceInDays(now, parseISO(boat.impeller_last_replaced_date));
      if (d > 365) alerts.push({ id: 'impeller_overdue', severity: 'critical', safety: true, createdDate, title: `Raw Water Impeller Overdue (${Math.floor(d / 365)}y ago)`, description: 'Inboard raw water impellers should be inspected annually.', action: 'Inspect & replace impeller' });
    } else {
      alerts.push({ id: 'impeller_no_date', severity: 'info', safety: false, createdDate, title: 'Impeller Replacement Date Not Recorded', description: 'Log when the raw water pump impeller was last replaced.', action: 'Record impeller replacement date' });
    }
  }

  if (boat.fuel_filter_last_replaced_date) {
    const d = differenceInDays(now, parseISO(boat.fuel_filter_last_replaced_date));
    if (d > 365) alerts.push({ id: 'fuel_filter_overdue', severity: 'warning', safety: false, createdDate, title: 'Fuel Filter Replacement Due', description: `Last replaced ${Math.floor(d / 30)} months ago. Replace annually to prevent fuel starvation.`, action: 'Replace fuel filter' });
  }

  if (boat.oil_filter_last_replaced_date) {
    const d = differenceInDays(now, parseISO(boat.oil_filter_last_replaced_date));
    if (d > 365) alerts.push({ id: 'oil_filter_overdue', severity: 'warning', safety: false, createdDate, title: 'Oil Filter Replacement Due', description: `Last replaced ${Math.floor(d / 30)} months ago.`, action: 'Replace oil filter' });
  }

  if (boat.battery_inspection_date) {
    const d = differenceInDays(now, parseISO(boat.battery_inspection_date));
    if (d > 365) alerts.push({ id: 'battery_inspection_due', severity: 'info', safety: false, createdDate, title: 'Battery Inspection Due', description: `Last inspected ${Math.floor(d / 30)} months ago. Check charge, terminals, and electrolyte levels.`, action: 'Inspect batteries' });
  }

  if (boat.zinc_anodes_last_replaced_date) {
    const d = differenceInDays(now, parseISO(boat.zinc_anodes_last_replaced_date));
    if (d > 365) alerts.push({ id: 'zinc_anodes_overdue', severity: 'warning', safety: false, createdDate, title: 'Zinc Anodes Replacement Due', description: `Last replaced ${Math.floor(d / 30)} months ago. Depleted zincs expose metal to saltwater corrosion.`, action: 'Replace zinc anodes' });
  }

  if (boat.antifouling_last_applied_date) {
    const d = differenceInDays(now, parseISO(boat.antifouling_last_applied_date));
    if (d > 365) alerts.push({ id: 'antifouling_due', severity: 'info', safety: false, createdDate, title: 'Anti-Fouling Paint Due', description: `Last applied ${Math.floor(d / 30)} months ago. Reapply annually to prevent hull fouling.`, action: 'Apply anti-fouling paint' });
  }

  if (boat.safety_equipment_inspection_date) {
    const d = differenceInDays(now, parseISO(boat.safety_equipment_inspection_date));
    if (d > 365) alerts.push({ id: 'safety_equipment_due', severity: 'warning', safety: true, createdDate, title: 'Safety Equipment Inspection Due', description: `Last inspected ${Math.floor(d / 30)} months ago. Check life jackets, flares, fire extinguishers.`, action: 'Inspect safety equipment' });
  } else {
    alerts.push({ id: 'safety_equipment_no_date', severity: 'warning', safety: true, createdDate, title: 'Safety Equipment Inspection Not Recorded', description: 'No safety equipment inspection on file. Life jackets, flares, and extinguishers must be checked regularly.', action: 'Inspect & record safety equipment' });
  }

  if (boat.supplies_inventory) {
    const needed = boat.supplies_inventory.filter(s => s.status === 'needed');
    if (needed.length > 0) alerts.push({ id: 'supplies_needed', severity: 'info', safety: false, createdDate, title: `${needed.length} Supply Item${needed.length > 1 ? 's' : ''} Needed`, description: needed.map(s => s.name).join(', '), action: 'Order supplies' });
    const expired = boat.supplies_inventory.filter(s => {
      if (!s.purchased_date || !s.duration_months) return false;
      const exp = new Date(s.purchased_date);
      exp.setMonth(exp.getMonth() + s.duration_months);
      return now > exp;
    });
    if (expired.length > 0) alerts.push({ id: 'supplies_expired', severity: 'warning', safety: false, createdDate, title: `${expired.length} Supply Item${expired.length > 1 ? 's' : ''} Expired`, description: expired.map(s => s.name).join(', '), action: 'Replace expired supplies' });
  }

  if (boat.recurring_costs) {
    const overdue = boat.recurring_costs.filter(c => c.next_payment_date && differenceInDays(now, parseISO(c.next_payment_date)) > 0);
    if (overdue.length > 0) alerts.push({ id: 'recurring_overdue', severity: 'warning', safety: false, createdDate, title: `${overdue.length} Overdue Payment${overdue.length > 1 ? 's' : ''}`, description: overdue.map(c => c.name).join(', '), action: 'Review payments' });
  }

  return alerts;
}

const severityConfig = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', icon: XCircle, iconColor: 'text-red-600' },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-300', icon: AlertTriangle, iconColor: 'text-amber-500' },
  info:     { bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock, iconColor: 'text-blue-500' },
};

const alertSectionMap = {
  engine_overdue: 'section-engine', engine_due_soon: 'section-engine',
  service_over_year: 'section-maintenance', service_9months: 'section-maintenance',
  no_service_date: 'section-maintenance', flush_reminder: 'section-maintenance',
  coolant_check: 'section-engine', impeller_overdue: 'section-maintenance',
  impeller_due_soon: 'section-maintenance', impeller_no_date: 'section-maintenance',
  spark_plugs_overdue: 'section-maintenance', fuel_filter_overdue: 'section-maintenance',
  oil_filter_overdue: 'section-maintenance', battery_inspection_due: 'section-maintenance',
  zinc_anodes_overdue: 'section-maintenance', antifouling_due: 'section-maintenance',
  safety_equipment_due: 'section-maintenance', safety_equipment_no_date: 'section-maintenance',
  supplies_needed: 'section-supplies', supplies_expired: 'section-supplies',
  recurring_overdue: 'section-recurring',
};

function getCheckedKey(boatId) {
  return `alert_checks_${boatId}`;
}

function loadChecked(boatId) {
  try { return JSON.parse(localStorage.getItem(getCheckedKey(boatId)) || '{}'); } catch { return {}; }
}

function saveChecked(boatId, data) {
  localStorage.setItem(getCheckedKey(boatId), JSON.stringify(data));
}

export default function MaintenanceAlerts({ boat, actualCurrentHours, onEditSection }) {
  const [expanded, setExpanded] = React.useState(false);
  const [collapsedAlerts, setCollapsedAlerts] = React.useState({});
  const [checked, setChecked] = React.useState(() => loadChecked(boat.id));

  const alerts = generateAlerts(boat, actualCurrentHours);

  const toggleCheck = (alertId, sectionId) => {
    const newChecked = { ...checked };
    if (newChecked[alertId]) {
      delete newChecked[alertId];
    } else {
      newChecked[alertId] = { checkedAt: format(new Date(), 'MMM d, yyyy HH:mm'), sectionId };
      // Also open the editor for the relevant section
      if (sectionId && onEditSection) onEditSection(sectionId);
    }
    setChecked(newChecked);
    saveChecked(boat.id, newChecked);
  };

  const toggleAlertCollapse = (alertId) => {
    setCollapsedAlerts(prev => ({ ...prev, [alertId]: !prev[alertId] }));
  };

  const uncheckedAlerts = alerts.filter(a => !checked[a.id]);
  const checkedAlerts = alerts.filter(a => !!checked[a.id]);

  if (alerts.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">No maintenance alerts — all systems nominal.</p>
        </div>
      </div>
    );
  }

  const critical = uncheckedAlerts.filter(a => a.severity === 'critical');
  const hasCritical = critical.length > 0;

  return (
    <div className="mt-3 pt-3 border-t">
      <button
        type="button"
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between gap-2 mb-2"
      >
        <h4 className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
          <AlertTriangle className={`h-3 w-3 ${hasCritical ? 'text-red-500' : 'text-amber-500'}`} />
          Maintenance Alerts
          {uncheckedAlerts.length > 0 && (
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${hasCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {uncheckedAlerts.length}
            </span>
          )}
          {checkedAlerts.length > 0 && (
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
              ✓ {checkedAlerts.length}
            </span>
          )}
        </h4>
        {expanded ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>

      {!expanded && hasCritical && (
        <div className="p-2 bg-red-50 border border-red-300 rounded-lg mb-1">
          <p className="text-xs font-bold text-red-700">⛔ {critical.length} critical issue{critical.length > 1 ? 's' : ''} — tap to view</p>
        </div>
      )}

      {expanded && (
        <div className="space-y-1.5">
          {/* Unchecked alerts */}
          {uncheckedAlerts.map(alert => {
            const cfg = severityConfig[alert.severity];
            const Icon = cfg.icon;
            const isCollapsed = collapsedAlerts[alert.id];
            const sectionId = alertSectionMap[alert.id];
            return (
              <div key={alert.id} className={`rounded-lg border ${cfg.bg} ${cfg.border}`}>
                {/* Alert header row */}
                <div className="flex items-center gap-2 px-2.5 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => toggleCheck(alert.id, sectionId)}
                    title="Mark as checked (opens editor)"
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="h-3 w-3 text-slate-300 hover:text-emerald-500" />
                  </button>
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${cfg.iconColor}`} />
                  <p className="text-xs font-bold text-slate-800 flex-1 min-w-0 truncate">{alert.title}</p>
                  {alert.safety && <span className="text-xs px-1 py-0.5 bg-red-100 text-red-700 rounded font-semibold whitespace-nowrap">⛔ Safety</span>}
                  <button type="button" onClick={() => toggleAlertCollapse(alert.id)} className="flex-shrink-0">
                    {isCollapsed ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronUp className="h-3 w-3 text-slate-400" />}
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="px-2.5 pb-2 pt-0 space-y-1">
                    <p className="text-xs text-slate-500 italic">Detected: {alert.createdDate}</p>
                    <p className="text-xs text-slate-600">{alert.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-xs text-slate-500 font-medium">→ {alert.action}</span>
                      {onEditSection && sectionId && (
                        <button
                          type="button"
                          onClick={() => onEditSection(sectionId)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-700 text-white rounded-full hover:bg-slate-900 transition-colors"
                        >
                          ✏️ Fix in Editor
                        </button>
                      )}
                      {boat.mechanic_phone && (
                        <a
                          href={`https://wa.me/${boat.mechanic_phone.replace(/\D/g, '')}?text=Hi ${boat.mechanic_name || 'Mechanic'}, I need to schedule service for ${boat.name}: ${alert.title}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                        >
                          <Phone className="h-2.5 w-2.5" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Checked alerts */}
          {checkedAlerts.length > 0 && (
            <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
              <p className="text-xs text-slate-400 font-medium mb-1.5">✓ Checked ({checkedAlerts.length})</p>
              {checkedAlerts.map(alert => (
                <div key={alert.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 mb-1 opacity-70">
                  <button
                    type="button"
                    onClick={() => toggleCheck(alert.id, alertSectionMap[alert.id])}
                    className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-red-400 transition-colors"
                    title="Uncheck"
                  >
                    <CheckCircle className="h-3 w-3 text-white" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 line-through truncate">{alert.title}</p>
                    <p className="text-xs text-emerald-600">Checked: {checked[alert.id]?.checkedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}