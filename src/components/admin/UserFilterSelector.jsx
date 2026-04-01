import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'filu_user_filter_perms';
const OPERATOR_STORAGE_KEY = 'filu_operators';

function loadOperators() {
  try {
    const raw = localStorage.getItem(OPERATOR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [{ id: 'filu', name: 'FILU', color: '#1e88e5' }];
}

export function loadUserFilterPerms(userId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[userId] ?? { allowed_operators: ['all'], allowed_locations: ['all'] };
  } catch {
    return { allowed_operators: ['all'], allowed_locations: ['all'] };
  }
}

function saveUserFilterPerms(userId, perms) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[userId] = perms;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export default function UserFilterSelector({ userId, username }) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState(() => loadUserFilterPerms(userId));

  const operators = loadOperators();

  const { data: dbLocations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list('sort_order'),
  });

  const locationOptions = dbLocations.length > 0
    ? dbLocations.map(l => ({ id: l.location_id, label: l.name }))
    : [{ id: 'ixtapa_zihuatanejo', label: 'Ixtapa-Zihuatanejo' }, { id: 'acapulco', label: 'Acapulco' }];

  useEffect(() => {
    setPerms(loadUserFilterPerms(userId));
  }, [userId]);

  const save = (updated) => {
    setPerms(updated);
    saveUserFilterPerms(userId, updated);
  };

  const toggleOperator = (name) => {
    let current = perms.allowed_operators ?? ['all'];
    // If 'all' is current, expand to explicit list minus this one
    if (current.includes('all')) {
      current = operators.map(o => o.name).filter(n => n !== name);
    } else if (current.includes(name)) {
      current = current.filter(n => n !== name);
      if (current.length === 0) current = ['all']; // fallback: all if none left
    } else {
      current = [...current, name];
      if (current.length === operators.length) current = ['all']; // all selected = 'all'
    }
    save({ ...perms, allowed_operators: current });
  };

  const toggleLocation = (id) => {
    let current = perms.allowed_locations ?? ['all'];
    if (current.includes('all')) {
      current = locationOptions.map(l => l.id).filter(i => i !== id);
    } else if (current.includes(id)) {
      current = current.filter(i => i !== id);
      if (current.length === 0) current = ['all'];
    } else {
      current = [...current, id];
      if (current.length === locationOptions.length) current = ['all'];
    }
    save({ ...perms, allowed_locations: current });
  };

  const isOpAllowed = (name) => {
    const list = perms.allowed_operators ?? ['all'];
    return list.includes('all') || list.includes(name);
  };

  const isLocAllowed = (id) => {
    const list = perms.allowed_locations ?? ['all'];
    return list.includes('all') || list.includes(id);
  };

  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filter Visibility for @{username}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {/* Operators */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Visible Operators</p>
            <div className="flex flex-wrap gap-1.5">
              {operators.map(op => {
                const allowed = isOpAllowed(op.name);
                return (
                  <label key={op.id || op.name} className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowed}
                      onChange={() => toggleOperator(op.name)}
                      className="rounded border-slate-300 text-indigo-600 h-3 w-3"
                    />
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${allowed ? 'text-white border-transparent' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'}`}
                      style={allowed ? { background: (op.color || '#6366f1') + 'cc', borderColor: op.color || '#6366f1' } : {}}
                    >
                      {op.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Visible Locations</p>
            <div className="flex flex-wrap gap-1.5">
              {locationOptions.map(loc => {
                const allowed = isLocAllowed(loc.id);
                return (
                  <label key={loc.id} className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowed}
                      onChange={() => toggleLocation(loc.id)}
                      className="rounded border-slate-300 text-teal-600 h-3 w-3"
                    />
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${allowed ? 'bg-teal-500/20 text-teal-700 border-teal-300' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'}`}>
                      {loc.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}