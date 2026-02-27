import React from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, Phone, Calendar, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { differenceInDays, parseISO, addMonths } from 'date-fns';

/**
 * Generates proactive maintenance alerts based on engine hours, service dates,
 * and tracked component replacement dates.
 */
function generateAlerts(boat, actualCurrentHours) {
  const alerts = [];
  const now = new Date();

  // --- Engine Hour Alerts ---
  const interval = boat.maintenance_interval_hours || 100;
  const lastMaintHrs = boat.last_maintenance_hours || 0;
  const hoursUntil = Math.max(0, lastMaintHrs + interval - actualCurrentHours);
  const hoursSince = actualCurrentHours - lastMaintHrs;

  if (hoursUntil === 0) {
    alerts.push({
      id: 'engine_overdue',
      severity: 'critical',
      safety: true,
      title: 'Engine Service OVERDUE',
      description: `Overdue by ${Math.abs(hoursSince - interval).toFixed(0)} hrs. Operating without service is a safety risk — engine failure possible.`,
      action: 'Schedule service immediately',
      icon: 'engine',
    });
  } else if (hoursUntil <= 10) {
    alerts.push({
      id: 'engine_due_soon',
      severity: 'warning',
      safety: false,
      title: `Engine Service Due in ${hoursUntil.toFixed(0)} hrs`,
      description: `Schedule before reaching ${lastMaintHrs + interval} total engine hours.`,
      action: 'Schedule service now',
      icon: 'engine',
    });
  }

  // --- Last Service Date Alerts ---
  if (boat.last_service_date) {
    const daysSinceService = differenceInDays(now, parseISO(boat.last_service_date));
    if (daysSinceService > 365) {
      alerts.push({
        id: 'service_over_year',
        severity: 'critical',
        safety: true,
        title: 'No Service in Over 12 Months',
        description: `Last service was ${daysSinceService} days ago. Coolant, belts, and seals degrade over time regardless of hours — safety risk.`,
        action: 'Schedule annual inspection',
        icon: 'calendar',
      });
    } else if (daysSinceService > 270) {
      alerts.push({
        id: 'service_9months',
        severity: 'warning',
        safety: false,
        title: 'Service Approaching 9 Months Ago',
        description: `Last service was ${daysSinceService} days ago. Plan your annual service soon.`,
        action: 'Plan annual service',
        icon: 'calendar',
      });
    }
  } else {
    alerts.push({
      id: 'no_service_date',
      severity: 'warning',
      safety: false,
      title: 'No Service Date Recorded',
      description: 'No last service date on file. Update maintenance records.',
      action: 'Update records',
      icon: 'calendar',
    });
  }

  // --- Outboard-specific alerts ---
  if (boat.engine_config === 'outboard') {
    // Impeller — based on actual replacement date (recommended every 2 years)
    if (boat.impeller_last_replaced_date) {
      const daysSince = differenceInDays(now, parseISO(boat.impeller_last_replaced_date));
      if (daysSince > 730) { // >2 years
        alerts.push({
          id: 'impeller_overdue',
          severity: 'critical',
          safety: true,
          title: `Water Pump Impeller Overdue (${Math.floor(daysSince / 365)}y ${Math.floor((daysSince % 365) / 30)}mo ago)`,
          description: 'Impellers should be replaced every 2 years. A failed impeller causes engine overheating and seizure.',
          action: 'Replace impeller immediately',
          icon: 'wrench',
        });
      } else if (daysSince > 548) { // >18 months
        alerts.push({
          id: 'impeller_due_soon',
          severity: 'warning',
          safety: false,
          title: 'Water Pump Impeller Due Soon',
          description: `Last replaced ${Math.floor(daysSince / 30)} months ago. Replacement recommended every 2 years.`,
          action: 'Schedule impeller replacement',
          icon: 'wrench',
        });
      }
    } else {
      alerts.push({
        id: 'impeller_no_date',
        severity: 'info',
        safety: false,
        title: 'Impeller Replacement Date Not Recorded',
        description: 'Log when the water pump impeller was last replaced to track its replacement cycle.',
        action: 'Record impeller replacement date',
        icon: 'wrench',
      });
    }

    // Spark plugs (outboard) — recommended every 1–2 years
    if (boat.spark_plugs_last_replaced_date) {
      const daysSince = differenceInDays(now, parseISO(boat.spark_plugs_last_replaced_date));
      if (daysSince > 730) {
        alerts.push({
          id: 'spark_plugs_overdue',
          severity: 'warning',
          safety: false,
          title: 'Spark Plugs Due for Replacement',
          description: `Last replaced ${Math.floor(daysSince / 365)} years ago. Worn spark plugs affect performance and fuel efficiency.`,
          action: 'Replace spark plugs',
          icon: 'wrench',
        });
      }
    }

    // Flush reminder (time-based — if last service >90 days)
    if (boat.last_service_date) {
      const days = differenceInDays(now, parseISO(boat.last_service_date));
      if (days > 90) {
        alerts.push({
          id: 'flush_reminder',
          severity: 'info',
          safety: false,
          title: 'Saltwater Flush Recommended',
          description: 'Flush outboard engines regularly to prevent internal corrosion.',
          action: 'Flush engines',
          icon: 'wrench',
        });
      }
    }
  }

  // --- Inboard-specific alerts ---
  if (boat.engine_config === 'inboard') {
    if (actualCurrentHours > 500 && hoursSince > 200) {
      alerts.push({
        id: 'coolant_check',
        severity: 'warning',
        safety: true,
        title: 'Coolant System Inspection Due',
        description: 'High engine hours without inspection: check heat exchanger, impeller, and zincs. Overheating can cause engine failure at sea.',
        action: 'Inspect cooling system',
        icon: 'wrench',
      });
    }

    // Inboard impeller
    if (boat.impeller_last_replaced_date) {
      const daysSince = differenceInDays(now, parseISO(boat.impeller_last_replaced_date));
      if (daysSince > 365) {
        alerts.push({
          id: 'impeller_overdue',
          severity: 'critical',
          safety: true,
          title: `Raw Water Impeller Overdue (${Math.floor(daysSince / 365)}y ago)`,
          description: 'Inboard raw water impellers should be inspected annually. A failed impeller causes engine overheating.',
          action: 'Inspect & replace impeller',
          icon: 'wrench',
        });
      }
    } else {
      alerts.push({
        id: 'impeller_no_date',
        severity: 'info',
        safety: false,
        title: 'Impeller Replacement Date Not Recorded',
        description: 'Log when the raw water pump impeller was last replaced to track its service cycle.',
        action: 'Record impeller replacement date',
        icon: 'wrench',
      });
    }
  }

  // --- Fuel Filter ---
  if (boat.fuel_filter_last_replaced_date) {
    const daysSince = differenceInDays(now, parseISO(boat.fuel_filter_last_replaced_date));
    if (daysSince > 365) {
      alerts.push({
        id: 'fuel_filter_overdue',
        severity: 'warning',
        safety: false,
        title: 'Fuel Filter Replacement Due',
        description: `Last replaced ${Math.floor(daysSince / 30)} months ago. Replace annually to prevent engine fuel starvation.`,
        action: 'Replace fuel filter',
        icon: 'wrench',
      });
    }
  }

  // --- Oil Filter ---
  if (boat.oil_filter_last_replaced_date) {
    const daysSince = differenceInDays(now, parseISO(boat.oil_filter_last_replaced_date));
    if (daysSince > 365) {
      alerts.push({
        id: 'oil_filter_overdue',
        severity: 'warning',
        safety: false,
        title: 'Oil Filter Replacement Due',
        description: `Last replaced ${Math.floor(daysSince / 30)} months ago. Replace annually or per manufacturer interval.`,
        action: 'Replace oil filter',
        icon: 'wrench',
      });
    }
  }

  // --- Battery Inspection ---
  if (boat.battery_inspection_date) {
    const daysSince = differenceInDays(now, parseISO(boat.battery_inspection_date));
    if (daysSince > 365) {
      alerts.push({
        id: 'battery_inspection_due',
        severity: 'info',
        safety: false,
        title: 'Battery Inspection Due',
        description: `Last inspected ${Math.floor(daysSince / 30)} months ago. Check charge, terminals, and electrolyte levels.`,
        action: 'Inspect batteries',
        icon: 'wrench',
      });
    }
  }

  // --- Zinc Anodes ---
  if (boat.zinc_anodes_last_replaced_date) {
    const daysSince = differenceInDays(now, parseISO(boat.zinc_anodes_last_replaced_date));
    if (daysSince > 365) {
      alerts.push({
        id: 'zinc_anodes_overdue',
        severity: 'warning',
        safety: false,
        title: 'Zinc Anodes Replacement Due',
        description: `Last replaced ${Math.floor(daysSince / 30)} months ago. Depleted zincs leave metal exposed to saltwater corrosion.`,
        action: 'Replace zinc anodes',
        icon: 'wrench',
      });
    }
  }

  // --- Antifouling ---
  if (boat.antifouling_last_applied_date) {
    const daysSince = differenceInDays(now, parseISO(boat.antifouling_last_applied_date));
    if (daysSince > 365) {
      alerts.push({
        id: 'antifouling_due',
        severity: 'info',
        safety: false,
        title: 'Anti-Fouling Paint Due',
        description: `Last applied ${Math.floor(daysSince / 30)} months ago. Reapply annually to prevent hull fouling and drag.`,
        action: 'Apply anti-fouling paint',
        icon: 'wrench',
      });
    }
  }

  // --- Safety Equipment ---
  if (boat.safety_equipment_inspection_date) {
    const daysSince = differenceInDays(now, parseISO(boat.safety_equipment_inspection_date));
    if (daysSince > 365) {
      alerts.push({
        id: 'safety_equipment_due',
        severity: 'warning',
        safety: true,
        title: 'Safety Equipment Inspection Due',
        description: `Last inspected ${Math.floor(daysSince / 30)} months ago. Check life jackets, flares, fire extinguishers, and EPIRBs.`,
        action: 'Inspect safety equipment',
        icon: 'wrench',
      });
    }
  } else {
    alerts.push({
      id: 'safety_equipment_no_date',
      severity: 'warning',
      safety: true,
      title: 'Safety Equipment Inspection Not Recorded',
      description: 'No safety equipment inspection on file. Life jackets, flares, and extinguishers must be checked regularly.',
      action: 'Inspect & record safety equipment',
      icon: 'wrench',
    });
  }

  // --- Supplies Needed ---
  if (boat.supplies_inventory) {
    const neededSupplies = boat.supplies_inventory.filter(s => s.status === 'needed');
    if (neededSupplies.length > 0) {
      alerts.push({
        id: 'supplies_needed',
        severity: 'info',
        safety: false,
        title: `${neededSupplies.length} Supply Item${neededSupplies.length > 1 ? 's' : ''} Needed`,
        description: neededSupplies.map(s => s.name).join(', '),
        action: 'Order supplies',
        icon: 'supplies',
      });
    }

    // Expired supplies
    const expiredSupplies = boat.supplies_inventory.filter(s => {
      if (!s.purchased_date || !s.duration_months) return false;
      const purchased = new Date(s.purchased_date);
      const expiresAt = new Date(purchased);
      expiresAt.setMonth(expiresAt.getMonth() + s.duration_months);
      return now > expiresAt;
    });
    if (expiredSupplies.length > 0) {
      alerts.push({
        id: 'supplies_expired',
        severity: 'warning',
        safety: false,
        title: `${expiredSupplies.length} Supply Item${expiredSupplies.length > 1 ? 's' : ''} Expired`,
        description: expiredSupplies.map(s => s.name).join(', '),
        action: 'Replace expired supplies',
        icon: 'supplies',
      });
    }
  }

  // --- Recurring costs overdue ---
  if (boat.recurring_costs) {
    const overdue = boat.recurring_costs.filter(c => {
      if (!c.next_payment_date) return false;
      return differenceInDays(now, parseISO(c.next_payment_date)) > 0;
    });
    if (overdue.length > 0) {
      alerts.push({
        id: 'recurring_overdue',
        severity: 'warning',
        safety: false,
        title: `${overdue.length} Overdue Payment${overdue.length > 1 ? 's' : ''}`,
        description: overdue.map(c => c.name).join(', '),
        action: 'Review payments',
        icon: 'calendar',
      });
    }
  }

  return alerts;
}

const severityConfig = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-600 text-white', icon: XCircle, iconColor: 'text-red-600' },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-500 text-white', icon: AlertTriangle, iconColor: 'text-amber-500' },
  info:     { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500 text-white', icon: Clock, iconColor: 'text-blue-500' },
};

// Map alert id to the form section it belongs to
const alertSectionMap = {
  engine_overdue:              'section-engine',
  engine_due_soon:             'section-engine',
  service_over_year:           'section-maintenance',
  service_9months:             'section-maintenance',
  no_service_date:             'section-maintenance',
  flush_reminder:              'section-maintenance',
  coolant_check:               'section-engine',
  impeller_overdue:            'section-maintenance',
  impeller_due_soon:           'section-maintenance',
  impeller_no_date:            'section-maintenance',
  spark_plugs_overdue:         'section-maintenance',
  fuel_filter_overdue:         'section-maintenance',
  oil_filter_overdue:          'section-maintenance',
  battery_inspection_due:      'section-maintenance',
  zinc_anodes_overdue:         'section-maintenance',
  antifouling_due:             'section-maintenance',
  safety_equipment_due:        'section-maintenance',
  safety_equipment_no_date:    'section-maintenance',
  supplies_needed:             'section-supplies',
  supplies_expired:            'section-supplies',
  recurring_overdue:           'section-recurring',
};

export default function MaintenanceAlerts({ boat, actualCurrentHours, onEditSection }) {
  const [expanded, setExpanded] = React.useState(false);
  const alerts = generateAlerts(boat, actualCurrentHours);

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

  const critical = alerts.filter(a => a.severity === 'critical');
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
          <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${hasCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {alerts.length}
          </span>
        </h4>
        {expanded ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>

      {!expanded && hasCritical && (
        <div className="p-2 bg-red-50 border border-red-300 rounded-lg mb-1">
          <p className="text-xs font-bold text-red-700">⛔ {critical.length} critical issue{critical.length > 1 ? 's' : ''} — tap to view</p>
        </div>
      )}

      {expanded && (
        <div className="space-y-2">
          {alerts.map(alert => {
            const cfg = severityConfig[alert.severity];
            const Icon = cfg.icon;
            return (
              <div key={alert.id} className={`p-2.5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-2">
                  <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <p className="text-xs font-bold text-slate-800">{alert.title}</p>
                      {alert.safety && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-semibold">⛔ Safety Risk</span>}
                    </div>
                    <p className="text-xs text-slate-600 mb-1.5">{alert.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">→ {alert.action}</span>
                      {onEditSection && alertSectionMap[alert.id] && (
                        <button
                          type="button"
                          onClick={() => onEditSection(alertSectionMap[alert.id])}
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
                          <Phone className="h-2.5 w-2.5" /> WhatsApp Mechanic
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}