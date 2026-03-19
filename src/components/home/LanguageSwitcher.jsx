import React, { useState, useEffect, useRef } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { translateNodes } from '@/lib/translator';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇲🇽' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

function getStoredLang() {
  try { return localStorage.getItem('filu-lang') || 'en'; } catch { return 'en'; }
}

export default function LanguageSwitcher() {
  const [activeLang, setActiveLang] = useState(getStoredLang);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // On mount, if a non-English lang is stored, apply it
  useEffect(() => {
    const stored = getStoredLang();
    if (stored !== 'en') {
      setLoading(true);
      translateNodes(stored).finally(() => setLoading(false));
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (lang) => {
    setOpen(false);
    if (lang.code === activeLang) return;

    localStorage.setItem('filu-lang', lang.code);
    setActiveLang(lang.code);

    if (lang.code === 'en') {
      // Reload to restore original text
      window.location.reload();
      return;
    }

    setLoading(true);
    try {
      await translateNodes(lang.code);
    } finally {
      setLoading(false);
    }
  };

  const current = LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0];

  return (
    <div ref={ref} className="fixed top-4 right-4 z-[9999]">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/25 text-white text-sm font-medium transition-all shadow-lg"
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
          : <Globe className="h-3.5 w-3.5 text-cyan-400" />
        }
        <span>{current.flag}</span>
        <span className="text-xs tracking-wide">{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-[#0c1f3d]/95 backdrop-blur-md">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors
                ${activeLang === lang.code
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-white hover:bg-white/10'
                }`}
            >
              <span>{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {activeLang === lang.code && <span className="text-cyan-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}