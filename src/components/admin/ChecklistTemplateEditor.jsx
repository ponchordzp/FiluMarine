import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Inline static section data (labels only, no need to duplicate full defs) ─
const INBOARD_SECTIONS_META = [
  { id: 'vessel_profile', label: '1. Vessel Profile', color: 'blue', items: [
    { id: 'ves_reg', label: 'Vessel registration & HIN verified', interval: 'On change' },
    { id: 'ves_ins', label: 'Insurance active', interval: '1 year' },
    { id: 'ves_war', label: 'Warranty statuses updated', interval: '12 months' },
    { id: 'ves_doc', label: 'Documentation library uploaded', interval: 'On update' },
  ]},
  { id: 'main_engines', label: '2. Main Engines (Port / Starboard)', color: 'amber', items: [
    { id: 'eng_hrs', label: 'Engine hours synced', interval: 'Continuous' },
    { id: 'eng_idle', label: 'Idle vs load % tracked', interval: 'Continuous' },
    { id: 'eng_oil_p', label: 'Oil pressure normal', interval: 'Continuous' },
    { id: 'eng_cool', label: 'Coolant temperature trend normal', interval: 'Continuous' },
    { id: 'eng_fault', label: 'Fault codes reviewed', interval: '30 days' },
    { id: 'eng_250_oil', label: 'Engine oil replaced', interval: '250h' },
    { id: 'eng_250_oilf', label: 'Oil filters replaced', interval: '250h' },
    { id: 'eng_250_ff1', label: 'Fuel primary filters replaced', interval: '250h' },
    { id: 'eng_250_ff2', label: 'Fuel secondary filters replaced', interval: '250h' },
    { id: 'eng_250_belt', label: 'Belts inspected', interval: '250h' },
    { id: 'eng_1k_valve', label: 'Valve adjustment', interval: '500–1,000h' },
    { id: 'eng_1k_heat', label: 'Heat exchanger cleaned', interval: '1,000h' },
    { id: 'eng_1k_after', label: 'Aftercooler serviced', interval: '1,000h' },
    { id: 'eng_1k_inj', label: 'Injector inspection', interval: '1,000h' },
    { id: 'eng_500_raw', label: 'Raw water pump inspection', interval: '500h' },
    { id: 'eng_ann_zinc', label: 'Zinc anodes replaced', interval: '12 months' },
    { id: 'eng_ann_cool', label: 'Cooling system flushed', interval: '12 months' },
    { id: 'eng_ann_exh', label: 'Exhaust riser inspected', interval: '12 months' },
    { id: 'eng_ann_align', label: 'Engine alignment check', interval: '12 months' },
  ]},
  { id: 'generator', label: '3. Generator', color: 'yellow', items: [
    { id: 'gen_hrs', label: 'Hours logged', interval: 'Continuous' },
    { id: 'gen_oil', label: 'Oil & filter change', interval: '200h' },
    { id: 'gen_imp', label: 'Impeller replaced', interval: '12 months' },
    { id: 'gen_fuel', label: 'Fuel filter replaced', interval: '200h' },
    { id: 'gen_load', label: 'Load test completed', interval: '12 months' },
    { id: 'gen_sound', label: 'Sound shield inspected', interval: '12 months' },
  ]},
  { id: 'running_gear', label: '4. Running Gear & Propulsion', color: 'orange', items: [
    { id: 'rg_shaft', label: 'Shaft alignment checked', interval: '12 months' },
    { id: 'rg_cutlass', label: 'Cutlass bearings inspected', interval: '12 months' },
    { id: 'rg_seals', label: 'Shaft seals inspected', interval: '12 months' },
    { id: 'rg_prop', label: 'Propellers balanced', interval: '2 years' },
    { id: 'rg_pods', label: 'Pods serviced (if applicable)', interval: '1,000h' },
    { id: 'rg_thrust', label: 'Thrusters tested', interval: '6 months' },
    { id: 'rg_stab', label: 'Stabilizers serviced', interval: '1,000h' },
  ]},
  { id: 'fuel_system_inb', label: '5. Fuel System', color: 'red', items: [
    { id: 'fuel_tank', label: 'Fuel tanks inspected', interval: '2 years' },
    { id: 'fuel_racor', label: 'Racor filters replaced', interval: '250h' },
    { id: 'fuel_polish', label: 'Fuel polishing completed', interval: '1 year' },
    { id: 'fuel_water', label: 'Water contamination test', interval: '6 months' },
    { id: 'fuel_vents', label: 'Tank vents clear', interval: '12 months' },
  ]},
  { id: 'electrical_inb', label: '6. Electrical System', color: 'violet', items: [
    { id: 'elec_house', label: 'House batteries load tested', interval: '6 months' },
    { id: 'elec_start', label: 'Engine start batteries tested', interval: '6 months' },
    { id: 'elec_alt', label: 'Alternator output verified', interval: '12 months' },
    { id: 'elec_shore', label: 'Shore power system inspected', interval: '12 months' },
    { id: 'elec_inv', label: 'Inverter/charger inspected', interval: '12 months' },
  ]},
  { id: 'hvac', label: '7. HVAC & Plumbing', color: 'cyan', items: [
    { id: 'hvac_ac', label: 'Air conditioning serviced', interval: '12 months' },
    { id: 'hvac_sea', label: 'Seawater strainers cleaned', interval: '3 months' },
    { id: 'hvac_water', label: 'Watermaker flushed', interval: '30 days' },
    { id: 'hvac_pump', label: 'Freshwater pump tested', interval: '6 months' },
    { id: 'hvac_bilge', label: 'Bilge pumps tested', interval: '3 months' },
    { id: 'hvac_float', label: 'Float switches tested', interval: '3 months' },
  ]},
  { id: 'safety_inb', label: '8. Safety & Compliance', color: 'rose', items: [
    { id: 'safe_fire', label: 'Fire suppression inspected', interval: '1 year' },
    { id: 'safe_epirb', label: 'EPIRB battery valid', interval: '5 years' },
    { id: 'safe_flare', label: 'Flares in date', interval: '3 years' },
    { id: 'safe_raft', label: 'Life raft serviced', interval: '1–3 years' },
    { id: 'safe_surv', label: 'Insurance survey completed', interval: '2–5 years' },
  ]},
  { id: 'hull_ext', label: '9. Hull & Exterior', color: 'teal', items: [
    { id: 'hull_paint', label: 'Bottom paint inspection', interval: '12 months' },
    { id: 'hull_thru', label: 'Through-hulls inspected', interval: '12 months' },
    { id: 'hull_anod', label: 'Anodes replaced', interval: '6–12 months' },
    { id: 'hull_moist', label: 'Hull moisture reading', interval: '2 years' },
    { id: 'hull_deck', label: 'Deck hardware sealed', interval: '2 years' },
  ]},
  { id: 'haul_out', label: '10. Haul-Out Checklist', color: 'slate', items: [
    { id: 'haul_wash', label: 'Pressure wash', interval: 'Each haul-out' },
    { id: 'haul_run', label: 'Running gear inspection', interval: 'Each haul-out' },
    { id: 'haul_prop', label: 'Prop speed coating applied', interval: 'Each haul-out' },
    { id: 'haul_thru', label: 'Through-hull valves exercised', interval: 'Each haul-out' },
    { id: 'haul_blst', label: 'Hull blister inspection', interval: 'Each haul-out' },
  ]},
];

const OUTBOARD_SECTIONS_META = [
  { id: 'vessel_profile_out', label: '1. Vessel Profile', color: 'blue', items: [
    { id: 'vop_serial', label: 'Engine serial numbers registered', interval: 'On change' },
    { id: 'vop_war', label: 'Warranty active per engine', interval: 'Manufacturer term' },
    { id: 'vop_prop', label: 'Prop specs recorded', interval: 'On change' },
    { id: 'vop_ecu', label: 'ECU firmware current', interval: '12 months' },
  ]},
  { id: 'outboard_engines', label: '2. Outboard Engines (Per Engine)', color: 'amber', items: [
    { id: 'out_hrs', label: 'Total hours synced', interval: 'Continuous' },
    { id: 'out_rpm', label: 'RPM band distribution tracked', interval: 'Continuous' },
    { id: 'out_wot', label: 'WOT hours reviewed', interval: '50h' },
    { id: 'out_ovheat', label: 'Overheat events logged', interval: 'Immediate' },
    { id: 'out_ovrev', label: 'Over-rev events logged', interval: 'Immediate' },
    { id: 'out_100_oil', label: 'Engine oil changed', interval: '100h' },
    { id: 'out_100_oilf', label: 'Oil filter replaced', interval: '100h' },
    { id: 'out_100_gear', label: 'Gearcase lube replaced', interval: '100h' },
    { id: 'out_100_fuel', label: 'Fuel filters replaced', interval: '100h' },
    { id: 'out_100_anod', label: 'Anodes inspected', interval: '100h' },
    { id: 'out_300_pump', label: 'Water pump impeller replaced', interval: '200–300h' },
    { id: 'out_300_therm', label: 'Thermostat inspected', interval: '300h' },
    { id: 'out_300_plug', label: 'Spark plugs replaced', interval: '300h' },
    { id: 'out_300_comp', label: 'Compression test recorded', interval: '300h' },
    { id: 'out_ann_lower', label: 'Lower unit pressure test', interval: '12 months' },
    { id: 'out_ann_steer', label: 'Steering system inspected', interval: '12 months' },
    { id: 'out_ann_corr', label: 'Corrosion inspection completed', interval: '12 months' },
  ]},
  { id: 'flush_corrosion', label: '3. Flush & Corrosion Control', color: 'cyan', items: [
    { id: 'flush_fresh', label: 'Freshwater flush completed after trip', interval: 'After each use' },
    { id: 'flush_chem', label: 'Chemical flush logged', interval: '3 months' },
    { id: 'flush_anod', label: 'External anodes replaced', interval: '6–12 months' },
    { id: 'flush_photo', label: 'Corrosion photos documented', interval: '6 months' },
    { id: 'flush_tilt', label: 'Tilt/trim rams inspected', interval: '6 months' },
  ]},
  { id: 'fuel_system_out', label: '4. Fuel System', color: 'red', items: [
    { id: 'fuelo_eth', label: 'Ethanol content recorded', interval: 'Each fuel fill' },
    { id: 'fuelo_racor', label: 'Racor filter replaced', interval: '100h' },
    { id: 'fuelo_sep', label: 'Water separator inspected', interval: '6 months' },
    { id: 'fuelo_stab', label: 'Fuel stabilizer used', interval: 'Seasonal storage' },
    { id: 'fuelo_turn', label: 'Tank turnover monitored', interval: '90 days' },
  ]},
  { id: 'electrical_out', label: '5. Electrical & Helm Systems', color: 'violet', items: [
    { id: 'eleco_start', label: 'Starting batteries tested', interval: '6 months' },
    { id: 'eleco_house', label: 'House battery bank tested', interval: '6 months' },
    { id: 'eleco_mfd', label: 'MFD software updated', interval: '12 months' },
    { id: 'eleco_radar', label: 'Radar tested', interval: '12 months' },
    { id: 'eleco_auto', label: 'Autopilot calibrated', interval: '12 months' },
    { id: 'eleco_stereo', label: 'Stereo amplifiers inspected', interval: '12 months' },
  ]},
  { id: 'steering', label: '6. Steering & Controls', color: 'orange', items: [
    { id: 'steer_fluid', label: 'Hydraulic steering fluid inspected', interval: '12 months' },
    { id: 'steer_seal', label: 'Helm seals inspected', interval: '12 months' },
    { id: 'steer_dts', label: 'Digital throttle & shift calibrated', interval: '12 months' },
    { id: 'steer_fault', label: 'Fault codes cleared', interval: '6 months' },
  ]},
  { id: 'fishing_sys', label: '7. Fishing Systems', color: 'teal', items: [
    { id: 'fish_live', label: 'Livewell pump tested', interval: '6 months' },
    { id: 'fish_aer', label: 'Aerator inspected', interval: '6 months' },
    { id: 'fish_mac', label: 'Fishbox macerator tested', interval: '6 months' },
    { id: 'fish_wash', label: 'Washdown pump inspected', interval: '6 months' },
  ]},
  { id: 'propulsion_perf', label: '8. Propulsion Performance', color: 'indigo', items: [
    { id: 'prop_dmg', label: 'Prop damage inspection', interval: '6 months' },
    { id: 'prop_rpm', label: 'RPM vs speed test recorded', interval: '12 months' },
    { id: 'prop_burn', label: 'Fuel burn per NM tracked', interval: 'Live/Continuous' },
    { id: 'prop_sync', label: 'Engine synchronization verified', interval: '6 months' },
  ]},
  { id: 'trailer', label: '9. Trailer (If Applicable)', color: 'slate', items: [
    { id: 'trail_axle', label: 'Axles inspected', interval: '12 months' },
    { id: 'trail_brake', label: 'Brake corrosion inspected', interval: '6 months' },
    { id: 'trail_bear', label: 'Wheel bearings greased', interval: '12 months' },
    { id: 'trail_tire', label: 'Tire age checked', interval: '5 years' },
    { id: 'trail_winch', label: 'Winch strap inspected', interval: '12 months' },
  ]},
  { id: 'offshore_ready', label: '10. Offshore Readiness', color: 'rose', items: [
    { id: 'off_prop', label: 'Spare prop onboard', interval: 'Before offshore trip' },
    { id: 'off_filter', label: 'Spare fuel filters onboard', interval: 'Before offshore trip' },
    { id: 'off_safety', label: 'Safety gear valid', interval: '12 months' },
    { id: 'off_bilge', label: 'Bilge redundancy verified', interval: '6 months' },
    { id: 'off_wx', label: 'Weather check logged', interval: 'Each offshore departure' },
  ]},
];

const COLOR_HEADER = {
  blue: 'bg-blue-700', amber: 'bg-amber-600', yellow: 'bg-yellow-500',
  orange: 'bg-orange-600', red: 'bg-red-700', violet: 'bg-violet-700',
  cyan: 'bg-cyan-600', rose: 'bg-rose-700', teal: 'bg-teal-700',
  slate: 'bg-slate-700', indigo: 'bg-indigo-700',
};
const COLOR_BG = {
  blue: 'bg-blue-50', amber: 'bg-amber-50', yellow: 'bg-yellow-50',
  orange: 'bg-orange-50', red: 'bg-red-50', violet: 'bg-violet-50',
  cyan: 'bg-cyan-50', rose: 'bg-rose-50', teal: 'bg-teal-50',
  slate: 'bg-slate-50', indigo: 'bg-indigo-50',
};
const COLOR_BORDER = {
  blue: 'border-blue-200', amber: 'border-amber-200', yellow: 'border-yellow-200',
  orange: 'border-orange-200', red: 'border-red-200', violet: 'border-violet-200',
  cyan: 'border-cyan-200', rose: 'border-rose-200', teal: 'border-teal-200',
  slate: 'border-slate-200', indigo: 'border-indigo-200',
};

function EditableRow({ item, overrides, onSave, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(overrides?.label ?? item.label);
  const [draftInterval, setDraftInterval] = useState(overrides?.interval ?? item.interval);
  const isRemoved = overrides?.removed;

  const handleSave = () => {
    onSave(item.id, { label: draftLabel, interval: draftInterval });
    setEditing(false);
  };

  if (isRemoved) {
    return (
      <div className="flex items-center gap-2 py-1.5 opacity-50">
        <span className="flex-1 text-xs text-slate-400 line-through">{item.label}</span>
        <button type="button" onClick={() => onRemove(item.id, false)} className="text-xs text-green-600 hover:underline px-1">Restore</button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1.5 bg-blue-50 rounded px-2 -mx-2">
        <Input value={draftLabel} onChange={e => setDraftLabel(e.target.value)} className="flex-1 h-7 text-xs" />
        <Input value={draftInterval} onChange={e => setDraftInterval(e.target.value)} className="w-28 h-7 text-xs" placeholder="Interval" />
        <button type="button" onClick={handleSave} className="p-1 text-green-600 hover:text-green-800"><Check className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => { setDraftLabel(overrides?.label ?? item.label); setDraftInterval(overrides?.interval ?? item.interval); setEditing(false); }} className="p-1 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <span className="flex-1 text-xs text-slate-700">{overrides?.label ?? item.label}</span>
      <span className="text-xs text-slate-400 w-24 text-right">{overrides?.interval ?? item.interval}</span>
      <button type="button" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:text-blue-700 transition-opacity"><Pencil className="h-3 w-3" /></button>
      <button type="button" onClick={() => onRemove(item.id, true)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"><Trash2 className="h-3 w-3" /></button>
    </div>
  );
}

function AddedItemRow({ item, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(item.label);
  const [draftInterval, setDraftInterval] = useState(item.interval);

  const handleSave = () => {
    onEdit(item.id, { label: draftLabel, interval: draftInterval });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1.5 bg-green-50 rounded px-2 -mx-2">
        <Input value={draftLabel} onChange={e => setDraftLabel(e.target.value)} className="flex-1 h-7 text-xs" />
        <Input value={draftInterval} onChange={e => setDraftInterval(e.target.value)} className="w-28 h-7 text-xs" placeholder="Interval" />
        <button type="button" onClick={handleSave} className="p-1 text-green-600 hover:text-green-800"><Check className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 group bg-green-50/60 rounded px-1 -mx-1">
      <span className="flex-1 text-xs text-green-800 font-medium">★ {item.label}</span>
      <span className="text-xs text-green-600 w-24 text-right">{item.interval}</span>
      <button type="button" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:text-blue-700 transition-opacity"><Pencil className="h-3 w-3" /></button>
      <button type="button" onClick={() => onRemove(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"><Trash2 className="h-3 w-3" /></button>
    </div>
  );
}

function SectionEditor({ section, overrides, addedItems, onSaveOverride, onRemoveItem, onAddItem, onEditAdded, onRemoveAdded }) {
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newInterval, setNewInterval] = useState('');

  const header = COLOR_HEADER[section.color] || COLOR_HEADER.slate;
  const bg = COLOR_BG[section.color] || COLOR_BG.slate;
  const border = COLOR_BORDER[section.color] || COLOR_BORDER.slate;
  const sectionAdded = addedItems.filter(i => i.section_id === section.id);
  const removedCount = section.items.filter(i => overrides[i.id]?.removed).length;
  const totalVisible = section.items.length - removedCount + sectionAdded.length;

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    onAddItem(section.id, { label: newLabel.trim(), interval: newInterval.trim() || 'As needed' });
    setNewLabel('');
    setNewInterval('');
    setShowAddForm(false);
  };

  return (
    <div className={`rounded-xl overflow-hidden border ${border} mb-2`}>
      <button type="button" onClick={() => setOpen(o => !o)} className={`w-full ${header} px-4 py-2.5 flex items-center gap-2 text-left`}>
        <span className="text-sm font-bold text-white flex-1">{section.label}</span>
        <span className="text-xs text-white/70">{totalVisible} items</span>
        {removedCount > 0 && <span className="text-xs text-red-200 bg-red-700/40 px-1.5 rounded">{removedCount} hidden</span>}
        {sectionAdded.length > 0 && <span className="text-xs text-green-200 bg-green-700/40 px-1.5 rounded">+{sectionAdded.length} added</span>}
        {open ? <ChevronUp className="h-4 w-4 text-white/70" /> : <ChevronDown className="h-4 w-4 text-white/70" />}
      </button>
      {open && (
        <div className={`${bg} px-4 py-3`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Items (hover to edit/remove)</p>
          </div>
          {section.items.map(item => (
            <EditableRow
              key={item.id}
              item={item}
              overrides={overrides[item.id]}
              onSave={onSaveOverride}
              onRemove={(id, removed) => onRemoveItem(id, removed)}
            />
          ))}
          {sectionAdded.map(item => (
            <AddedItemRow
              key={item.id}
              item={item}
              onEdit={onEditAdded}
              onRemove={onRemoveAdded}
            />
          ))}
          {showAddForm ? (
            <div className="mt-2 flex items-center gap-2 bg-white border border-green-300 rounded px-2 py-1.5">
              <Input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="New item label..." className="flex-1 h-7 text-xs" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              <Input value={newInterval} onChange={e => setNewInterval(e.target.value)} placeholder="Interval" className="w-28 h-7 text-xs" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              <button type="button" onClick={handleAdd} disabled={!newLabel.trim()} className="p-1 text-green-600 hover:text-green-800 disabled:opacity-40"><Check className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => setShowAddForm(false)} className="p-1 text-slate-400"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAddForm(true)} className="mt-2 flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium">
              <Plus className="h-3 w-3" /> Add item to this section
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EngineTypeEditor({ engineType, label, sections }) {
  const queryClient = useQueryClient();

  const { data: configs = [] } = useQuery({
    queryKey: ['global-checklist-config', engineType],
    queryFn: () => base44.entities.GlobalChecklistConfig.filter({ engine_type: engineType }),
  });

  const config = configs[0] || null;
  const overrides = config?.overrides || {};
  const addedItems = config?.added_items || [];

  const saveMutation = useMutation({
    mutationFn: (data) => config
      ? base44.entities.GlobalChecklistConfig.update(config.id, data)
      : base44.entities.GlobalChecklistConfig.create({ engine_type: engineType, ...data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['global-checklist-config', engineType] }),
  });

  const handleSaveOverride = (itemId, changes) => {
    const newOverrides = { ...overrides, [itemId]: { ...(overrides[itemId] || {}), ...changes } };
    saveMutation.mutate({ overrides: newOverrides, added_items: addedItems });
  };

  const handleRemoveItem = (itemId, removed) => {
    const newOverrides = { ...overrides, [itemId]: { ...(overrides[itemId] || {}), removed } };
    saveMutation.mutate({ overrides: newOverrides, added_items: addedItems });
  };

  const handleAddItem = (sectionId, item) => {
    const newItem = { id: `global_${engineType}_${Date.now()}`, section_id: sectionId, ...item };
    saveMutation.mutate({ overrides, added_items: [...addedItems, newItem] });
  };

  const handleEditAdded = (itemId, changes) => {
    const newAdded = addedItems.map(i => i.id === itemId ? { ...i, ...changes } : i);
    saveMutation.mutate({ overrides, added_items: newAdded });
  };

  const handleRemoveAdded = (itemId) => {
    saveMutation.mutate({ overrides, added_items: addedItems.filter(i => i.id !== itemId) });
  };

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const removedTotal = Object.values(overrides).filter(v => v?.removed).length;
  const addedTotal = addedItems.length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800 rounded-xl">
        <Settings className="h-5 w-5 text-slate-300" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs text-slate-400">{totalItems - removedTotal + addedTotal} active items · {removedTotal} hidden · {addedTotal} global additions</p>
        </div>
        {saveMutation.isPending && <span className="text-xs text-blue-300 animate-pulse">Saving…</span>}
        {saveMutation.isSuccess && <span className="text-xs text-green-400">Saved ✓</span>}
      </div>
      <div className="space-y-1">
        {sections.map(section => (
          <SectionEditor
            key={section.id}
            section={section}
            overrides={overrides}
            addedItems={addedItems}
            onSaveOverride={handleSaveOverride}
            onRemoveItem={handleRemoveItem}
            onAddItem={handleAddItem}
            onEditAdded={handleEditAdded}
            onRemoveAdded={handleRemoveAdded}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChecklistTemplateEditor() {
  const [activeEngine, setActiveEngine] = useState('inboard');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          <button
            type="button"
            onClick={() => setActiveEngine('inboard')}
            className={`px-4 py-2 text-sm font-medium transition-all ${activeEngine === 'inboard' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            ⚙️ Inboard
          </button>
          <button
            type="button"
            onClick={() => setActiveEngine('outboard')}
            className={`px-4 py-2 text-sm font-medium transition-all ${activeEngine === 'outboard' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            🚤 Outboard
          </button>
        </div>
        <div className="flex-1 p-2.5 rounded-lg text-xs text-amber-200/80" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          Changes here apply to <strong>all boats</strong> of this engine type. Each boat can still add its own custom items.
        </div>
      </div>

      {activeEngine === 'inboard' && (
        <EngineTypeEditor
          engineType="inboard"
          label="Inboard Diesel Yacht — Global Template"
          sections={INBOARD_SECTIONS_META}
        />
      )}
      {activeEngine === 'outboard' && (
        <EngineTypeEditor
          engineType="outboard"
          label="Outboard Center Console — Global Template"
          sections={OUTBOARD_SECTIONS_META}
        />
      )}
    </div>
  );
}