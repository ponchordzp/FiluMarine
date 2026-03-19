import React, { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇲🇽' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

function getStoredLang() {
  try { return localStorage.getItem('filu-lang') || 'en'; } catch { return 'en'; }
}

function triggerGoogleTranslate(langCode) {
  // Find the Google Translate combo box and change it
  const select = document.querySelector('.goog-te-combo');
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event('change'));
    return true;
  }
  return false;
}

export default function LanguageSwitcher() {
  const [activeLang, setActiveLang] = useState(getStoredLang);
  const [open, setOpen] = useState(false);
  const [gtReady, setGtReady] = useState(false);
  const retryRef = useRef(null);
  const ref = useRef(null);

  // Inject Google Translate script once
  useEffect(() => {
    // Callback that GT calls when ready
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,es,fr',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          'gt-element'
        );
      }
    };

    // Only inject script if not already present
    if (!document.getElementById('gt-script')) {
      const s = document.createElement('script');
      s.id = 'gt-script';
      s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.async = true;
      document.head.appendChild(s);
    } else if (window.google && window.google.translate) {
      // Script already loaded, re-init
      window.googleTranslateElementInit();
    }

    // Poll until the GT combo appears, then apply stored lang
    const stored = getStoredLang();
    retryRef.current = setInterval(() => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        clearInterval(retryRef.current);
        setGtReady(true);
        if (stored !== 'en') {
          select.value = stored;
          select.dispatchEvent(new Event('change'));
        }
      }
    }, 300);

    return () => clearInterval(retryRef.current);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (lang) => {
    setOpen(false);
    if (lang.code === activeLang) return;

    localStorage.setItem('filu-lang', lang.code);
    setActiveLang(lang.code);

    if (lang.code === 'en') {
      // Reset — Google Translate provides a "show original" mechanism
      const restore = document.querySelector('.goog-te-menu-value');
      if (restore) restore.click();
      // Fallback: reload with no cookie
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + location.hostname;
      window.location.reload();
      return;
    }

    const success = triggerGoogleTranslate(lang.code);
    if (!success) {
      // GT not ready yet — store cookie and reload so it applies on load
      document.cookie = `googtrans=/en/${lang.code}; path=/`;
      document.cookie = `googtrans=/en/${lang.code}; path=/; domain=${location.hostname}`;
      window.location.reload();
    }
  };

  const current = LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0];

  return (
    <>
      {/* Hidden GT mount point */}
      <div id="gt-element" style={{ display: 'none', position: 'absolute' }} />

      <div ref={ref} className="fixed top-4 right-4 z-[9999]" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/25 text-white text-sm font-medium transition-all shadow-lg"
        >
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
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
    </>
  );
}