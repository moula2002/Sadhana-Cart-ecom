import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import "./LanguageSwitcher.css";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const changeLang = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("lang", langCode);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      className="language-switcher custom-dropdown" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={`lang-dropdown-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{currentLang.label}</span>
        <ChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} size={16} />
      </button>

      <ul className={`lang-dropdown-list ${isOpen ? 'show' : ''}`} role="listbox">
        {LANGUAGES.map((lang) => (
          <li
            key={lang.code}
            className={`lang-dropdown-item ${currentLang.code === lang.code ? 'selected' : ''}`}
            onClick={() => changeLang(lang.code)}
            role="option"
            aria-selected={currentLang.code === lang.code}
          >
            {lang.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LanguageSwitcher;
