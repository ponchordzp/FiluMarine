import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LanguageSwitcher({ currentLanguage, onLanguageChange, darkMode, onDarkModeToggle }) {
  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇲🇽' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  const handleApply = () => {
    localStorage.setItem('preferred-language', selectedLang);
    onLanguageChange(selectedLang);
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onDarkModeToggle}
        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-slate-800"
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-slate-800"
          >
            <Globe className="h-4 w-4 mr-2" />
            <span className="mr-1">{currentLang.flag}</span>
            {currentLang.code.toUpperCase()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={selectedLang === lang.code ? 'bg-slate-100 dark:bg-slate-700' : ''}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          ))}
          {selectedLang !== currentLanguage && (
            <div className="p-2 pt-2 border-t mt-1">
              <Button onClick={handleApply} size="sm" className="w-full bg-[#1e88e5] hover:bg-[#1976d2]">
                Apply & Reload
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}