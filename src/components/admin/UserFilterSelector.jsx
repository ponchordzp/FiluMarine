import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, Lock, LockOpen, Save, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'filu_user_filter_perms';
const LOCKED_STORAGE_KEY = 'filu_user_filter_perms_locked';
const OPERATOR_STORAGE_KEY = 'filu_operators';

function loadOperators() {
  try {
    const raw = localStorage.getItem(OPERATOR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [{ id: 'filu', name: 'FILU', color: '#1e88e5' }];
}

function encodePerms(perms) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(perms))));
}

function decodePerms(encoded) {
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

// Loads locked prefs first (protected), then falls back to mutable prefs
export function loadUserFilterPerms(userId) {
  try {
    // Try locked store first — immune to overwrites
    const lockedRaw = localStorage.getItem(LOCKED_STORAGE_KEY);
    if (lockedRaw) {
      const lockedAll = JSON.parse(lockedRaw);
      if (lockedAll[userId]) {
        return { ...decodePerms(lockedAll[userId]), _locked: true };
      }
    }
    // Fall back to mutable store
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[userId] ?? { allowed_operators: ['all'], allowed_locations: ['all'] };
  } catch {
    return { allowed_operators: ['all'], allowed_locations: ['all'] };
  }
}

function saveMutablePerms(userId, perms) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[userId] = perms;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function saveLockedPerms(userId, perms) {
  try {
    const raw = localStorage.getItem(LOCKED_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[userId] = encodePerms(perms);
    localStorage.setItem(LOCKED_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function clearLockedPerms(userId) {
  try {
    const raw = localStorage.getItem(LOCKED_STORAGE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    delete all[userId];
    localStorage.setItem(LOCKED_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export default function UserFilterSelector({ userId, username }) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState(() => loadUserFilterPerms(userId));
  const [isLocked, setIsLocked] = useState(() => !!loadUserFilterPerms(userId)._locked);
  const [savedFlash, setSavedFlash] = useState(false);

  const operators = loadOperators();

  const { data: dbLocations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list('sort_order'),
  });

  const locationOptions = dbLocations.length > 0
    ? dbLocations.map(l => ({ id: l.location_id, label: l.name }))
    : [{ id: 'ixtapa_zihuatanejo', label: 'Ixtapa-Zihuatanejo' }, { id: 'acapulco', label: 'Acapulco' }];

  useEffect(() => {
    const loaded = loadUserFilterPerms(userId);
    setPerms(loaded);
    setIsLocked(!!loaded._locked);
  }, [userId]);

  const cleanPerms = (p) => {
    const { _locked, ...rest } = p;
    return rest;
  };

  const applyChange = (updated) => {
    if (isLocked) return; // locked — no changes allowed
    setPerms(updated);
    saveMutablePerms(userId, updated);
  };

  const handleSaveAndLock = () => {
    const clean = cleanPerms(perms);
    saveLockedPerms(userId, clean);
    saveMutablePerms(userId, clean);
    setIsLocked(true);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleUnlock = () => {
    clearLockedPerms(userId);
    setIsLocked(false);
  };

  const toggleOperator = (name) => {
    if (isLocked) return;
    let current = perms.allowed_operators ?? ['all'];
    if (current.includes('all')) {
      current = operators.map(o => o.name).filter(n => n !== name);
    } else if (current.includes(name)) {
      current = current.filter(n => n !== name);
      if (current.length === 0) current = ['all'];
    } else {
      current = [...current, name];
      if (current.length === operators.length) current = ['all'];
    }
    applyChange({ ...cleanPerms(perms), allowed_operators: current });
  };

  const toggleLocation = (id) => {
    if (isLocked) return;
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
    applyChange({ ...cleanPerms(perms), allowed_locations: current });
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
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter Visibility for @{username}
          {isLocked && <Lock className="h-3 w-3 text-amber-500" />}
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {open && (
          <div className="flex items-center gap-1.5">
            {savedFlash && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <CheckCircle className="h-3 w-3" /> Locked!
              </span>
            )}
            {isLocked ? (
              <button
                type="button"
                onClick={handleUnlock}
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <LockOpen className="h-3 w-3" /> Unlock to Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndLock}
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Save className="h-3 w-3" /> Save & Lock
              </button>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className={`mt-2 space-y-2 ${isLocked ? 'opacity-70 pointer-events-none select-none' : ''}`}>
          {isLocked && (
            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
              <Lock className="h-3 w-3" /> Selection is locked and protected from overwrites. Unlock to make changes.
            </p>
          )}

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
                      disabled={isLocked}
                      className="rounded border-slate-300 text-indigo-600 h-3 w-3"
                    />
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${allowed ? 'text-white border-transparent' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'}`}
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
                      disabled={isLocked}
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