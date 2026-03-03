import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Plus, Info, Pencil, X } from 'lucide-react';

// Editable tooltip — SuperAdmin can click the pencil to change the tooltip text
function EditableInfo({ text, onSave, isSuperAdmin }) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => !editing && setShow(true)}
        onMouseLeave={() => !editing && setShow(false)}
        onFocus={() => !editing && setShow(true)}
        onBlur={() => !editing && setShow(false)}
        onClick={() => { if (isSuperAdmin) { setEditing(true); setShow(false); } }}
        className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center flex-shrink-0 transition-colors"
        tabIndex={-1}
        title={isSuperAdmin ? 'Click to edit tooltip' : undefined}
      >
        <Info className="h-2.5 w-2.5" />
      </button>
      {show && !editing && (
        <div className="absolute z-50 left-5 top-0 w-64 bg-slate-800 text-white text-xs rounded-lg p-2.5 shadow-xl pointer-events-none">
          <p className="leading-relaxed">{text}</p>
          {isSuperAdmin && <p className="mt-1 text-slate-400 italic">Click ⓘ to edit</p>}
        </div>
      )}
      {editing && isSuperAdmin && (
        <div className="absolute z-50 left-5 top-0 w-72 bg-white border border-blue-300 rounded-lg p-3 shadow-2xl" style={{ minWidth: 260 }}>
          <p className="text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1"><Pencil className="h-3 w-3" /> Edit Tooltip</p>
          <textarea
            autoFocus
            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400 resize-none"
            rows={3}
            value={draft}
            onChange={e => setDraft(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={handleSave} className="flex-1 bg-blue-600 text-white text-xs py-1 rounded hover:bg-blue-700">Save</button>
            <button type="button" onClick={() => { setDraft(text); setEditing(false); }} className="px-3 text-xs border border-slate-200 rounded hover:bg-slate-50"><X className="h-3 w-3" /></button>
          </div>
        </div>
      )}
    </span>
  );
}

// ── INBOARD CHECKLIST DEFINITION ──────────────────────────────────────────────
const INBOARD_SECTIONS = [
  {
    id: 'vessel_profile',
    label: '1. Vessel Profile',
    color: 'blue',
    items: [
      { id: 'ves_reg', label: 'Vessel registration & HIN verified', interval: 'On change' },
      { id: 'ves_ins', label: 'Insurance active', interval: '1 year' },
      { id: 'ves_war', label: 'Warranty statuses updated', interval: '12 months' },
      { id: 'ves_doc', label: 'Documentation library uploaded', interval: 'On update' },
    ],
  },
  {
    id: 'main_engines',
    label: '2. Main Engines (Port / Starboard)',
    color: 'amber',
    subsections: [
      {
        label: 'Engine Hours & Monitoring',
        items: [
          { id: 'eng_hrs', label: 'Engine hours synced', interval: 'Continuous' },
          { id: 'eng_idle', label: 'Idle vs load % tracked', interval: 'Continuous' },
          { id: 'eng_oil_p', label: 'Oil pressure normal', interval: 'Continuous' },
          { id: 'eng_cool', label: 'Coolant temperature trend normal', interval: 'Continuous' },
          { id: 'eng_fault', label: 'Fault codes reviewed', interval: '30 days' },
        ],
      },
      {
        label: '250–300h Service',
        items: [
          { id: 'eng_250_oil', label: 'Engine oil replaced', interval: '250h' },
          { id: 'eng_250_oilf', label: 'Oil filters replaced', interval: '250h' },
          { id: 'eng_250_ff1', label: 'Fuel primary filters replaced', interval: '250h' },
          { id: 'eng_250_ff2', label: 'Fuel secondary filters replaced', interval: '250h' },
          { id: 'eng_250_belt', label: 'Belts inspected', interval: '250h' },
        ],
      },
      {
        label: '500–1,000h Service',
        items: [
          { id: 'eng_1k_valve', label: 'Valve adjustment', interval: '500–1,000h' },
          { id: 'eng_1k_heat', label: 'Heat exchanger cleaned', interval: '1,000h' },
          { id: 'eng_1k_after', label: 'Aftercooler serviced', interval: '1,000h' },
          { id: 'eng_1k_inj', label: 'Injector inspection', interval: '1,000h' },
          { id: 'eng_500_raw', label: 'Raw water pump inspection', interval: '500h' },
        ],
      },
      {
        label: 'Annual',
        items: [
          { id: 'eng_ann_zinc', label: 'Zinc anodes replaced', interval: '12 months' },
          { id: 'eng_ann_cool', label: 'Cooling system flushed', interval: '12 months' },
          { id: 'eng_ann_exh', label: 'Exhaust riser inspected', interval: '12 months' },
          { id: 'eng_ann_align', label: 'Engine alignment check', interval: '12 months' },
        ],
      },
    ],
  },
  {
    id: 'generator',
    label: '3. Generator',
    color: 'yellow',
    items: [
      { id: 'gen_hrs', label: 'Hours logged', interval: 'Continuous' },
      { id: 'gen_oil', label: 'Oil & filter change', interval: '200h' },
      { id: 'gen_imp', label: 'Impeller replaced', interval: '12 months' },
      { id: 'gen_fuel', label: 'Fuel filter replaced', interval: '200h' },
      { id: 'gen_load', label: 'Load test completed', interval: '12 months' },
      { id: 'gen_sound', label: 'Sound shield inspected', interval: '12 months' },
    ],
  },
  {
    id: 'running_gear',
    label: '4. Running Gear & Propulsion',
    color: 'orange',
    items: [
      { id: 'rg_shaft', label: 'Shaft alignment checked', interval: '12 months' },
      { id: 'rg_cutlass', label: 'Cutlass bearings inspected', interval: '12 months' },
      { id: 'rg_seals', label: 'Shaft seals inspected', interval: '12 months' },
      { id: 'rg_prop', label: 'Propellers balanced', interval: '2 years' },
      { id: 'rg_pods', label: 'Pods serviced (if applicable)', interval: '1,000h' },
      { id: 'rg_thrust', label: 'Thrusters tested', interval: '6 months' },
      { id: 'rg_stab', label: 'Stabilizers serviced', interval: '1,000h' },
    ],
  },
  {
    id: 'fuel_system_inb',
    label: '5. Fuel System',
    color: 'red',
    items: [
      { id: 'fuel_tank', label: 'Fuel tanks inspected', interval: '2 years' },
      { id: 'fuel_racor', label: 'Racor filters replaced', interval: '250h' },
      { id: 'fuel_polish', label: 'Fuel polishing completed', interval: '1 year' },
      { id: 'fuel_water', label: 'Water contamination test', interval: '6 months' },
      { id: 'fuel_vents', label: 'Tank vents clear', interval: '12 months' },
    ],
  },
  {
    id: 'electrical_inb',
    label: '6. Electrical System',
    color: 'violet',
    items: [
      { id: 'elec_house', label: 'House batteries load tested', interval: '6 months' },
      { id: 'elec_start', label: 'Engine start batteries tested', interval: '6 months' },
      { id: 'elec_alt', label: 'Alternator output verified', interval: '12 months' },
      { id: 'elec_shore', label: 'Shore power system inspected', interval: '12 months' },
      { id: 'elec_inv', label: 'Inverter/charger inspected', interval: '12 months' },
    ],
  },
  {
    id: 'hvac',
    label: '7. HVAC & Plumbing',
    color: 'cyan',
    items: [
      { id: 'hvac_ac', label: 'Air conditioning serviced', interval: '12 months' },
      { id: 'hvac_sea', label: 'Seawater strainers cleaned', interval: '3 months' },
      { id: 'hvac_water', label: 'Watermaker flushed', interval: '30 days' },
      { id: 'hvac_pump', label: 'Freshwater pump tested', interval: '6 months' },
      { id: 'hvac_bilge', label: 'Bilge pumps tested', interval: '3 months' },
      { id: 'hvac_float', label: 'Float switches tested', interval: '3 months' },
    ],
  },
  {
    id: 'safety_inb',
    label: '8. Safety & Compliance',
    color: 'rose',
    items: [
      { id: 'safe_fire', label: 'Fire suppression inspected', interval: '1 year' },
      { id: 'safe_epirb', label: 'EPIRB battery valid', interval: '5 years' },
      { id: 'safe_flare', label: 'Flares in date', interval: '3 years' },
      { id: 'safe_raft', label: 'Life raft serviced', interval: '1–3 years' },
      { id: 'safe_surv', label: 'Insurance survey completed', interval: '2–5 years' },
    ],
  },
  {
    id: 'hull_ext',
    label: '9. Hull & Exterior',
    color: 'teal',
    items: [
      { id: 'hull_paint', label: 'Bottom paint inspection', interval: '12 months' },
      { id: 'hull_thru', label: 'Through-hulls inspected', interval: '12 months' },
      { id: 'hull_anod', label: 'Anodes replaced', interval: '6–12 months' },
      { id: 'hull_moist', label: 'Hull moisture reading', interval: '2 years' },
      { id: 'hull_deck', label: 'Deck hardware sealed', interval: '2 years' },
    ],
  },
  {
    id: 'haul_out',
    label: '10. Haul-Out Checklist',
    color: 'slate',
    items: [
      { id: 'haul_wash', label: 'Pressure wash', interval: 'Each haul-out' },
      { id: 'haul_run', label: 'Running gear inspection', interval: 'Each haul-out' },
      { id: 'haul_prop', label: 'Prop speed coating applied', interval: 'Each haul-out' },
      { id: 'haul_thru', label: 'Through-hull valves exercised', interval: 'Each haul-out' },
      { id: 'haul_blst', label: 'Hull blister inspection', interval: 'Each haul-out' },
    ],
  },
];

// ── OUTBOARD CHECKLIST DEFINITION ─────────────────────────────────────────────
const OUTBOARD_SECTIONS = [
  {
    id: 'vessel_profile_out',
    label: '1. Vessel Profile',
    color: 'blue',
    items: [
      { id: 'vop_serial', label: 'Engine serial numbers registered', interval: 'On change' },
      { id: 'vop_war', label: 'Warranty active per engine', interval: 'Manufacturer term' },
      { id: 'vop_prop', label: 'Prop specs recorded', interval: 'On change' },
      { id: 'vop_ecu', label: 'ECU firmware current', interval: '12 months' },
    ],
  },
  {
    id: 'outboard_engines',
    label: '2. Outboard Engines (Per Engine)',
    color: 'amber',
    subsections: [
      {
        label: 'Engine Hours & RPM Profile',
        items: [
          { id: 'out_hrs', label: 'Total hours synced', interval: 'Continuous' },
          { id: 'out_rpm', label: 'RPM band distribution tracked', interval: 'Continuous' },
          { id: 'out_wot', label: 'WOT hours reviewed', interval: '50h' },
          { id: 'out_ovheat', label: 'Overheat events logged', interval: 'Immediate' },
          { id: 'out_ovrev', label: 'Over-rev events logged', interval: 'Immediate' },
        ],
      },
      {
        label: '100h Service',
        items: [
          { id: 'out_100_oil', label: 'Engine oil changed', interval: '100h' },
          { id: 'out_100_oilf', label: 'Oil filter replaced', interval: '100h' },
          { id: 'out_100_gear', label: 'Gearcase lube replaced', interval: '100h' },
          { id: 'out_100_fuel', label: 'Fuel filters replaced', interval: '100h' },
          { id: 'out_100_anod', label: 'Anodes inspected', interval: '100h' },
        ],
      },
      {
        label: '300h+ Service',
        items: [
          { id: 'out_300_pump', label: 'Water pump impeller replaced', interval: '200–300h' },
          { id: 'out_300_therm', label: 'Thermostat inspected', interval: '300h' },
          { id: 'out_300_plug', label: 'Spark plugs replaced', interval: '300h' },
          { id: 'out_300_comp', label: 'Compression test recorded', interval: '300h' },
        ],
      },
      {
        label: 'Annual',
        items: [
          { id: 'out_ann_lower', label: 'Lower unit pressure test', interval: '12 months' },
          { id: 'out_ann_steer', label: 'Steering system inspected', interval: '12 months' },
          { id: 'out_ann_corr', label: 'Corrosion inspection completed', interval: '12 months' },
        ],
      },
    ],
  },
  {
    id: 'flush_corrosion',
    label: '3. Flush & Corrosion Control',
    color: 'cyan',
    items: [
      { id: 'flush_fresh', label: 'Freshwater flush completed after trip', interval: 'After each use' },
      { id: 'flush_chem', label: 'Chemical flush logged', interval: '3 months' },
      { id: 'flush_anod', label: 'External anodes replaced', interval: '6–12 months' },
      { id: 'flush_photo', label: 'Corrosion photos documented', interval: '6 months' },
      { id: 'flush_tilt', label: 'Tilt/trim rams inspected', interval: '6 months' },
    ],
  },
  {
    id: 'fuel_system_out',
    label: '4. Fuel System',
    color: 'red',
    items: [
      { id: 'fuelo_eth', label: 'Ethanol content recorded', interval: 'Each fuel fill' },
      { id: 'fuelo_racor', label: 'Racor filter replaced', interval: '100h' },
      { id: 'fuelo_sep', label: 'Water separator inspected', interval: '6 months' },
      { id: 'fuelo_stab', label: 'Fuel stabilizer used', interval: 'Seasonal storage' },
      { id: 'fuelo_turn', label: 'Tank turnover monitored', interval: '90 days' },
    ],
  },
  {
    id: 'electrical_out',
    label: '5. Electrical & Helm Systems',
    color: 'violet',
    items: [
      { id: 'eleco_start', label: 'Starting batteries tested', interval: '6 months' },
      { id: 'eleco_house', label: 'House battery bank tested', interval: '6 months' },
      { id: 'eleco_mfd', label: 'MFD software updated', interval: '12 months' },
      { id: 'eleco_radar', label: 'Radar tested', interval: '12 months' },
      { id: 'eleco_auto', label: 'Autopilot calibrated', interval: '12 months' },
      { id: 'eleco_stereo', label: 'Stereo amplifiers inspected', interval: '12 months' },
    ],
  },
  {
    id: 'steering',
    label: '6. Steering & Controls',
    color: 'orange',
    items: [
      { id: 'steer_fluid', label: 'Hydraulic steering fluid inspected', interval: '12 months' },
      { id: 'steer_seal', label: 'Helm seals inspected', interval: '12 months' },
      { id: 'steer_dts', label: 'Digital throttle & shift calibrated', interval: '12 months' },
      { id: 'steer_fault', label: 'Fault codes cleared', interval: '6 months' },
    ],
  },
  {
    id: 'fishing_sys',
    label: '7. Fishing Systems',
    color: 'teal',
    items: [
      { id: 'fish_live', label: 'Livewell pump tested', interval: '6 months' },
      { id: 'fish_aer', label: 'Aerator inspected', interval: '6 months' },
      { id: 'fish_mac', label: 'Fishbox macerator tested', interval: '6 months' },
      { id: 'fish_wash', label: 'Washdown pump inspected', interval: '6 months' },
    ],
  },
  {
    id: 'propulsion_perf',
    label: '8. Propulsion Performance',
    color: 'indigo',
    items: [
      { id: 'prop_dmg', label: 'Prop damage inspection', interval: '6 months' },
      { id: 'prop_rpm', label: 'RPM vs speed test recorded', interval: '12 months' },
      { id: 'prop_burn', label: 'Fuel burn per NM tracked', interval: 'Live/Continuous' },
      { id: 'prop_sync', label: 'Engine synchronization verified', interval: '6 months' },
    ],
  },
  {
    id: 'trailer',
    label: '9. Trailer (If Applicable)',
    color: 'slate',
    items: [
      { id: 'trail_axle', label: 'Axles inspected', interval: '12 months' },
      { id: 'trail_brake', label: 'Brake corrosion inspected', interval: '6 months' },
      { id: 'trail_bear', label: 'Wheel bearings greased', interval: '12 months' },
      { id: 'trail_tire', label: 'Tire age checked', interval: '5 years' },
      { id: 'trail_winch', label: 'Winch strap inspected', interval: '12 months' },
    ],
  },
  {
    id: 'offshore_ready',
    label: '10. Offshore Readiness',
    color: 'rose',
    items: [
      { id: 'off_prop', label: 'Spare prop onboard', interval: 'Before offshore trip' },
      { id: 'off_filter', label: 'Spare fuel filters onboard', interval: 'Before offshore trip' },
      { id: 'off_safety', label: 'Safety gear valid', interval: '12 months' },
      { id: 'off_bilge', label: 'Bilge redundancy verified', interval: '6 months' },
      { id: 'off_wx', label: 'Weather check logged', interval: 'Each offshore departure' },
    ],
  },
];

const COLOR_MAP = {
  blue:   { header: 'bg-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   check: 'bg-blue-600',   sub: 'bg-blue-100 text-blue-800' },
  amber:  { header: 'bg-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  check: 'bg-amber-600',  sub: 'bg-amber-100 text-amber-800' },
  yellow: { header: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', check: 'bg-yellow-600', sub: 'bg-yellow-100 text-yellow-800' },
  orange: { header: 'bg-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', check: 'bg-orange-600', sub: 'bg-orange-100 text-orange-800' },
  red:    { header: 'bg-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    check: 'bg-red-600',    sub: 'bg-red-100 text-red-800' },
  violet: { header: 'bg-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', check: 'bg-violet-600', sub: 'bg-violet-100 text-violet-800' },
  cyan:   { header: 'bg-cyan-600',   bg: 'bg-cyan-50',   border: 'border-cyan-200',   check: 'bg-cyan-600',   sub: 'bg-cyan-100 text-cyan-800' },
  rose:   { header: 'bg-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200',   check: 'bg-rose-600',   sub: 'bg-rose-100 text-rose-800' },
  teal:   { header: 'bg-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200',   check: 'bg-teal-600',   sub: 'bg-teal-100 text-teal-800' },
  slate:  { header: 'bg-slate-700',  bg: 'bg-slate-50',  border: 'border-slate-200',  check: 'bg-slate-600',  sub: 'bg-slate-100 text-slate-800' },
  indigo: { header: 'bg-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', check: 'bg-indigo-600', sub: 'bg-indigo-100 text-indigo-800' },
};

function ChecklistItem({ id, label, interval, info, checked, note, lastDate, onToggle, onNoteChange, onDateChange, isSuperAdmin, onInfoChange }) {
  const defaultInfo = info || `Check and record when "${label}" was last completed. Recommended interval: ${interval}.`;
  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggle(id)}
          className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
            checked ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300 hover:border-green-400'
          }`}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug flex items-center gap-0.5 ${checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {label}
            <EditableInfo
              text={defaultInfo}
              isSuperAdmin={isSuperAdmin}
              onSave={(val) => onInfoChange && onInfoChange(id, val)}
            />
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Interval: {interval}</p>
          <div className="flex gap-2 mt-1.5">
            <input
              type="date"
              value={lastDate || ''}
              onChange={(e) => onDateChange(id, e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-green-400"
              title="Last done date"
            />
            <input
              type="text"
              value={note || ''}
              onChange={(e) => onNoteChange(id, e.target.value)}
              placeholder="Notes..."
              className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-green-400 placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionProgress({ section, checklist }) {
  const allItems = section.items
    ? section.items
    : section.subsections.flatMap(s => s.items);
  const checked = allItems.filter(i => {
    const v = checklist[i.id];
    return v && typeof v === 'object' ? v.checked : !!v;
  }).length;
  const pct = allItems.length > 0 ? Math.round((checked / allItems.length) * 100) : 0;
  return { checked, total: allItems.length, pct };
}

function ChecklistSection({ section, checklist, onToggle, onNote, onDate, isSuperAdmin, onInfoChange }) {
  const [open, setOpen] = useState(false);
  const c = COLOR_MAP[section.color] || COLOR_MAP.slate;
  const { checked, total, pct } = SectionProgress({ section, checklist });
  const complete = pct === 100;

  return (
    <div className={`rounded-xl overflow-hidden border ${c.border} mb-3`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full ${c.header} px-4 py-3 flex items-center gap-3 text-left`}
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${complete ? 'bg-green-400' : 'bg-white/20'}`}>
          {complete && <Check className="h-3 w-3 text-white" />}
        </div>
        <span className="text-sm font-bold text-white flex-1">{section.label}</span>
        <span className="text-xs text-white/80 mr-2">{checked}/{total}</span>
        <div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2">
          <div className="h-full bg-white transition-all" style={{ width: `${pct}%` }} />
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-white/70" /> : <ChevronDown className="h-4 w-4 text-white/70" />}
      </button>

      {open && (
        <div className={`${c.bg} px-4 py-3`}>
          {section.items && section.items.map(item => (
                <ChecklistItem key={item.id} {...item} info={getVal(checklist, item.id, 'info')} checked={getVal(checklist, item.id, 'checked')} note={getVal(checklist, item.id, 'note')} lastDate={getVal(checklist, item.id, 'lastDate')} onToggle={onToggle} onNoteChange={onNote} onDateChange={onDate} isSuperAdmin={isSuperAdmin} onInfoChange={onInfoChange} />
          ))}
          {section.subsections && section.subsections.map(sub => (
            <div key={sub.label} className="mb-4 last:mb-0">
              <p className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded mb-2 inline-block ${c.sub}`}>{sub.label}</p>
              {sub.items.map(item => (
                <ChecklistItem key={item.id} {...item} info={getVal(checklist, item.id, 'info')} checked={getVal(checklist, item.id, 'checked')} note={getVal(checklist, item.id, 'note')} lastDate={getVal(checklist, item.id, 'lastDate')} onToggle={onToggle} onNoteChange={onNote} onDateChange={onDate} isSuperAdmin={isSuperAdmin} onInfoChange={onInfoChange} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// checklist shape: { [id]: { checked: bool, note: string, lastDate: string } | bool (legacy) }
function getVal(checklist, id, field) {
  const v = checklist[id];
  if (!v || typeof v !== 'object') return field === 'checked' ? !!v : '';
  return v[field] ?? (field === 'checked' ? false : '');
}

function setVal(checklist, id, field, value) {
  const existing = checklist[id];
  const base = existing && typeof existing === 'object' ? existing : { checked: !!existing, note: '', lastDate: '' };
  return { ...checklist, [id]: { ...base, [field]: value } };
}

export default function MaintenanceChecklist({ engineConfig, checklist = {}, onChange, isSuperAdmin = false }) {
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemInterval, setNewItemInterval] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!engineConfig) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-300">
        ⚙️ Select an engine type (Inboard / Outboard) in Engine Configuration to unlock the maintenance checklist.
      </div>
    );
  }

  const sections = engineConfig === 'inboard' ? INBOARD_SECTIONS : OUTBOARD_SECTIONS;
  const layoutLabel = engineConfig === 'inboard' ? 'Layout A — Inboard Diesel Yacht' : 'Layout B — Outboard Center Console';

  const customItems = checklist.__custom__ || [];

  const handleToggle = (id) => {
    onChange(setVal(checklist, id, 'checked', !getVal(checklist, id, 'checked')));
  };

  const handleNote = (id, value) => {
    onChange(setVal(checklist, id, 'note', value));
  };

  const handleDate = (id, value) => {
    onChange(setVal(checklist, id, 'lastDate', value));
  };

  const handleInfo = (id, value) => {
    onChange(setVal(checklist, id, 'info', value));
  };

  const handleAddCustom = () => {
    if (!newItemLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    const updated = {
      ...checklist,
      __custom__: [...customItems, { id, label: newItemLabel.trim(), interval: newItemInterval.trim() || 'As needed' }],
    };
    onChange(updated);
    setNewItemLabel('');
    setNewItemInterval('');
    setShowAddForm(false);
  };

  const handleRemoveCustom = (id) => {
    const { [id]: _, ...rest } = checklist;
    onChange({ ...rest, __custom__: customItems.filter(i => i.id !== id) });
  };

  const allItems = sections.flatMap(s =>
    s.items ? s.items : s.subsections.flatMap(sub => sub.items)
  );
  const totalChecked = [...allItems, ...customItems].filter(i => getVal(checklist, i.id, 'checked')).length;
  const totalAll = allItems.length + customItems.length;
  const overallPct = totalAll > 0 ? Math.round((totalChecked / totalAll) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Overall progress bar */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">{layoutLabel}</p>
            <p className="text-xs text-slate-500">{totalChecked} of {totalAll} items checked</p>
          </div>
          <span className={`text-lg font-bold ${overallPct === 100 ? 'text-green-600' : overallPct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{overallPct}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${overallPct === 100 ? 'bg-green-500' : overallPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-green-800">Check off each item as it is completed. Log the date it was last done and any relevant notes. Add custom items (e.g. T-Top detailing) using the <strong>+ Add Item</strong> button below.</p>
      </div>

      {sections.map(section => (
        <ChecklistSection key={section.id} section={section} checklist={checklist} onToggle={handleToggle} onNote={handleNote} onDate={handleDate} isSuperAdmin={isSuperAdmin} onInfoChange={handleInfo} />
      ))}

      {/* Custom items section */}
      {customItems.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-green-300">
          <div className="bg-green-700 px-4 py-3 flex items-center gap-2">
            <span className="text-sm font-bold text-white flex-1">Custom Items</span>
            <span className="text-xs text-white/80">{customItems.filter(i => getVal(checklist, i.id, 'checked')).length}/{customItems.length}</span>
            <div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all" style={{ width: `${customItems.length > 0 ? Math.round(customItems.filter(i => getVal(checklist, i.id, 'checked')).length / customItems.length * 100) : 0}%` }} />
            </div>
          </div>
          <div className="bg-green-50 px-4 py-2">
            {customItems.map(item => (
              <div key={item.id} className="py-2 border-b border-green-100 last:border-0 flex items-start gap-2">
                <div className="flex-1">
                  <ChecklistItem {...item} checked={getVal(checklist, item.id, 'checked')} note={getVal(checklist, item.id, 'note')} lastDate={getVal(checklist, item.id, 'lastDate')} onToggle={handleToggle} onNoteChange={handleNote} onDateChange={handleDate} />
                </div>
                <button type="button" onClick={() => handleRemoveCustom(item.id)} className="mt-2 text-red-400 hover:text-red-600 text-xs flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add custom item */}
      {showAddForm ? (
        <div className="bg-white border-2 border-green-300 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-green-800">New Custom Checklist Item</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-600 font-medium">Item Name *</label>
              <input
                autoFocus
                type="text"
                value={newItemLabel}
                onChange={e => setNewItemLabel(e.target.value)}
                placeholder="e.g., T-Top detailing"
                className="w-full mt-1 text-sm border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-green-400"
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-600 font-medium">Interval (optional)</label>
              <input
                type="text"
                value={newItemInterval}
                onChange={e => setNewItemInterval(e.target.value)}
                placeholder="e.g., 3 months, After each trip"
                className="w-full mt-1 text-sm border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-green-400"
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAddCustom} disabled={!newItemLabel.trim()} className="flex-1 bg-green-600 text-white text-sm py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-40">Add Item</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-green-300 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Custom Item
        </button>
      )}
    </div>
  );
}