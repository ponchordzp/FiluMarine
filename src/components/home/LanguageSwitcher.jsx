import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', gtCode: '/en/' },
  { code: 'es', name: 'Español', flag: '🇲🇽', gtCode: '/es/' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', gtCode: '/fr/' },
];

function getActiveLang() {
  try {
    const cookie = document.cookie;
    const match = cookie.match(/googtrans=\/[a-z]+\/([a-z]+)/);
    if (match) return match[1];
  } catch (_) {}
  return localStorage.getItem('filu-lang') || 'en';
}

function setGoogleTranslateLang(langCode) {
  if (langCode === 'en') {
    // Remove the cookie to reset to original
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';
  } else {
    const cookieVal = `/en/${langCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname}`;
  }
  localStorage.setItem('filu-lang', langCode);
  window.location.reload();
}

export default function LanguageSwitcher() {
  const [activeLang, setActiveLang] = useState('en');

  useEffect(() => {
    setActiveLang(getActiveLang());
  }, []);

  const current = LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0];

  const handleSelect = (lang) => {
    if (lang.code === activeLang) return;
    setGoogleTranslateLang(lang.code);
  };

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      {/* Hidden Google Translate element (needed to initialise the engine) */}
      <div id="google_translate_element" className="hidden" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white text-sm font-medium transition-all shadow-lg">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span>{current.flag}</span>
            <span className="text-xs tracking-wide">{current.code.toUpperCase()}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 bg-[#0c1f3d]/95 border-white/20 backdrop-blur-md">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleSelect(lang)}
              className={`flex items-center gap-2 text-white hover:bg-white/10 cursor-pointer ${activeLang === lang.code ? 'bg-cyan-500/20 text-cyan-300' : ''}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {activeLang === lang.code && <span className="ml-auto text-cyan-400 text-xs">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}