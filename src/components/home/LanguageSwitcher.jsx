import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LanguageSwitcher({ currentLanguage, onLanguageChange }) {
  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const [isOpen, setIsOpen] = useState(false);
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇲🇽' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  const handleApply = () => {
    localStorage.setItem('preferred-language', selectedLang);
    onLanguageChange(selectedLang);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/90 backdrop-blur-sm shadow-md hover:bg-white"
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
              className={selectedLang === lang.code ? 'bg-slate-100' : ''}
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