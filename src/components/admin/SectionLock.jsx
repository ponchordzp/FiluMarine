import React from 'react';
import { Lock, LockOpen, Info, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Tooltip for field info
export function FieldInfo({ text, example }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center flex-shrink-0 transition-colors"
        tabIndex={-1}
      >
        <Info className="h-2.5 w-2.5" />
      </button>
      {show && (
        <div className="absolute z-50 left-5 top-0 w-56 bg-slate-800 text-white text-xs rounded-lg p-2.5 shadow-xl pointer-events-none">
          <p className="leading-relaxed">{text}</p>
          {example && (
            <p className="mt-1.5 font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded text-xs">
              e.g. {example}
            </p>
          )}
        </div>
      )}
    </span>
  );
}

// Label with info tooltip
export function InfoLabel({ children, info, example, className = '' }) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-0.5 ${className}`}>
      {children}
      <FieldInfo text={info} example={example} />
    </label>
  );
}

// Timestamp button — hover to see audit info (who filled & when), click to stamp today's date
export function TimestampButton({ onStamp, meta = null, disabled = false, className = '' }) {
  const [flashed, setFlashed] = React.useState(false);
  const [show, setShow] = React.useState(false);

  const handleClick = async () => {
    if (disabled) return;
    const today = new Date().toISOString().split('T')[0];
    let userName = 'Unknown';
    try {
      const user = await base44.auth.me();
      userName = user?.full_name || user?.email || 'Unknown';
    } catch {}
    const newMeta = { by: userName, at: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) };
    onStamp(today, newMeta);
    setFlashed(true);
    setTimeout(() => setFlashed(false), 800);
  };

  const hasMeta = meta && (meta.by || meta.at);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        title={hasMeta ? `Last set by ${meta.by} on ${meta.at}` : 'Set to today\'s date'}
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          disabled ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400' :
          flashed ? 'bg-green-500 text-white' :
          hasMeta ? 'bg-green-100 text-green-600 hover:bg-green-200' :
          'bg-amber-100 text-amber-600 hover:bg-amber-200'
        } ${className}`}
      >
        <Clock className="h-2.5 w-2.5" />
      </button>
      {show && hasMeta && (
        <div className="absolute z-50 left-5 top-0 w-52 bg-slate-800 text-white text-xs rounded-lg p-2.5 shadow-xl pointer-events-none">
          <p className="font-semibold text-slate-300 mb-1">Last updated by</p>
          <p className="text-white">{meta.by}</p>
          <p className="text-slate-400 mt-1">{meta.at}</p>
        </div>
      )}
      {show && !hasMeta && !disabled && (
        <div className="absolute z-50 left-5 top-0 w-44 bg-slate-800 text-white text-xs rounded-lg p-2.5 shadow-xl pointer-events-none">
          <p className="text-slate-300">Click to set today's date and record who filled this field.</p>
        </div>
      )}
    </span>
  );
}

// Section lock toggle button + state hook
export function useSectionLocks(sections) {
  const [locks, setLocks] = React.useState(() =>
    Object.fromEntries(sections.map((s) => [s, false]))
  );

  const toggle = (section, isComplete) => {
    if (locks[section]) {
      // Always allow unlocking
      setLocks((prev) => ({ ...prev, [section]: false }));
    } else if (isComplete) {
      // Only allow locking if data is complete
      setLocks((prev) => ({ ...prev, [section]: true }));
    }
  };

  return { locks, toggle };
}

// Lock button shown inside section headers
export function SectionLockButton({ sectionKey, locks, toggle, isComplete }) {
  const locked = locks[sectionKey];
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggle(sectionKey, isComplete); }}
      title={locked ? 'Unlock section' : isComplete ? 'Lock section' : 'Fill all required fields to lock'}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all mr-1 flex-shrink-0 ${
        locked
          ? 'bg-red-500/80 text-white hover:bg-red-600'
          : isComplete
          ? 'bg-white/20 text-white hover:bg-white/30'
          : 'bg-white/10 text-white/40 cursor-not-allowed'
      }`}
    >
      {locked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
      {locked ? 'Locked' : 'Lock'}
    </button>
  );
}