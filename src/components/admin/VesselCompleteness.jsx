import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

function calcPct(values) {
  const filled = values.filter(Boolean).length;
  return Math.round((filled / values.length) * 100);
}

function getSections(boat) {
  const exp = boat.available_expeditions || [];
  const pricing = boat.expedition_pricing || [];
  const equip = boat.equipment || {};
  const custom = boat.custom_equipment || [];
  const checklist = boat.maintenance_checklist || {};
  const customChecklist = checklist.__custom__ || [];
  const checklistKeys = Object.keys(checklist).filter(k => k !== '__custom__');
  const supplies = boat.supplies_inventory || [];
  const sellers = boat.supply_sellers || [];
  const recurring = boat.recurring_costs || [];
  const isRentalOnly = boat.boat_mode === 'rental_only';
  const isRental = boat.boat_mode !== 'maintenance_only';

  const allSections = [
    {
      id: 'section-general',
      label: 'General Info',
      color: '#0284c7',
      pct: calcPct([boat.name, boat.type, boat.boat_model, boat.size, boat.capacity, boat.location, boat.description, boat.image]),
      modes: ['rental_and_maintenance', 'rental_only', 'maintenance_only'],
    },
    {
      id: 'section-expeditions',
      label: 'Expeditions',
      color: '#4f46e5',
      pct: calcPct([
        exp.length > 0,
        pricing.some(p => p.price_mxn > 0),
        pricing.some(p => p.duration_hours > 0),
      ]),
      modes: ['rental_and_maintenance', 'rental_only'],
    },
    {
      id: 'section-equipment',
      label: 'Equipment',
      color: '#0d9488',
      pct: calcPct([
        Object.values(equip).some(Boolean),
        custom.length > 0 || Object.values(equip).filter(Boolean).length >= 3,
      ]),
      modes: ['rental_and_maintenance', 'rental_only'],
    },
    {
      id: 'section-engine',
      label: 'Engine Config',
      color: '#d97706',
      pct: calcPct([boat.engine_config, boat.engine_name, boat.engine_quantity, boat.engine_year]),
      modes: ['rental_and_maintenance', 'maintenance_only'],
    },
    {
      id: 'section-checklist',
      label: 'Checklist',
      color: '#15803d',
      pct: (() => {
        const total = checklistKeys.length + customChecklist.length;
        if (total === 0) return 0;
        const checked = checklistKeys.filter(k => {
          const v = checklist[k];
          return typeof v === 'object' ? v?.checked : !!v;
        }).length + customChecklist.filter(i => checklist[i.id]?.checked).length;
        return Math.round((checked / total) * 100);
      })(),
      modes: ['rental_and_maintenance', 'maintenance_only'],
    },
    {
      id: 'section-maintenance',
      label: 'Maintenance',
      color: '#ea580c',
      pct: calcPct([
        boat.last_service_date,
        boat.mechanic_name,
        boat.mechanic_phone,
        boat.impeller_last_replaced_date,
        boat.fuel_filter_last_replaced_date,
        boat.oil_filter_last_replaced_date,
        boat.battery_inspection_date,
        boat.zinc_anodes_last_replaced_date,
        boat.safety_equipment_inspection_date,
      ]),
      modes: ['rental_and_maintenance', 'maintenance_only'],
    },
    {
      id: 'section-supplies',
      label: 'Supplies',
      color: '#059669',
      pct: calcPct([
        supplies.length > 0,
        supplies.some(s => s.quantity > 0),
        supplies.some(s => s.price_per_unit > 0),
      ]),
      modes: ['rental_and_maintenance', 'maintenance_only'],
    },
    {
      id: 'section-sellers',
      label: 'Sellers',
      color: '#0891b2',
      pct: calcPct([
        sellers.length > 0,
        boat.owner_phone,
        sellers.some(s => s.phone),
      ]),
      modes: ['rental_and_maintenance', 'maintenance_only'],
    },
    {
      id: 'section-recurring',
      label: 'Recurring Costs',
      color: '#7c3aed',
      pct: calcPct([
        recurring.length > 0,
        recurring.some(r => r.amount > 0),
      ]),
      modes: ['rental_and_maintenance', 'maintenance_only'],
    },
  ];

  const mode = boat.boat_mode || 'rental_and_maintenance';
  return allSections.filter(s => s.modes.includes(mode));
}

function CircleFill({ pct, color, label, onClick }) {
  const radius = 22;
  const strokeWidth = 5;
  const size = 64;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const isComplete = pct === 100;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}: ${pct}% — click to edit`}
      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
          {/* Track */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          {/* Fill */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={isComplete ? '#22c55e' : color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Percentage text — centered inside the ring */}
        <span
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{ fontSize: '11px', color: isComplete ? '#16a34a' : color }}
        >
          {pct}%
        </span>
      </div>
      <span
        className="text-center leading-tight group-hover:underline"
        style={{ fontSize: '9px', color: '#475569', maxWidth: '60px' }}
      >
        {label}
      </span>
    </button>
  );
}

export default function VesselCompleteness({ boat, onEditSection }) {
  const [expanded, setExpanded] = useState(false);
  const sections = getSections(boat);
  const overall = Math.round(sections.reduce((s, x) => s + x.pct, 0) / sections.length);

  return (
    <div className="mt-3 pt-3 border-t">
      <button
        type="button"
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between gap-2 mb-2 group"
      >
        <h4 className="font-semibold text-xs text-slate-700 flex items-center gap-2">
          <BarChart2 className="h-3 w-3 text-slate-500" />
          Vessel Completeness
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
              overall >= 80 ? 'bg-green-100 text-green-700' :
              overall >= 50 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}
          >
            {overall}%
          </span>
        </h4>
        {expanded
          ? <ChevronUp className="h-3 w-3 text-slate-400" />
          : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>

      {expanded && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-3 text-center">
            Click any circle to open that section in the editor
          </p>
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 justify-items-center">
            {sections.map(section => (
              <CircleFill
                key={section.id}
                pct={section.pct}
                color={section.color}
                label={section.label}
                onClick={() => onEditSection(section.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}