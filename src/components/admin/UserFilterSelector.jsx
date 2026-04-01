import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEY = 'filu_user_filter_perms';

export function loadUserFilterPerms(userId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[userId] ?? { operator_filter: true, location_filter: true };
  } catch {
    return { operator_filter: true, location_filter: true };
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

const FILTER_OPTIONS = [
  { key: 'operator_filter', label: 'Operator Filter' },
  { key: 'location_filter', label: 'Location Filter' },
];

export default function UserFilterSelector({ userId, username }) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState(() => loadUserFilterPerms(userId));

  useEffect(() => {
    setPerms(loadUserFilterPerms(userId));
  }, [userId]);

  const toggle = (key) => {
    const updated = { ...perms, [key]: !perms[key] };
    setPerms(updated);
    saveUserFilterPerms(userId, updated);
  };

  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filter Visibility
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(opt => (
            <label key={opt.key} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={perms[opt.key]}
                onChange={() => toggle(opt.key)}
                className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5"
              />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${perms[opt.key] ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'}`}>
                {opt.label}
              </span>
            </label>
          ))}
          <span className="text-xs text-slate-400 self-center ml-1">— visible to @{username}</span>
        </div>
      )}
    </div>
  );
}