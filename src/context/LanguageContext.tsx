import React, { createContext, useContext, useMemo, useState } from "react";
import { translations, type Language, type TranslationDictionary } from "../i18n/translations";

const LANG_KEY = "partyqueue_lang";

function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "th") {
      return saved;
    }
    if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("th")) {
      return "th";
    }
  } catch {
    // Fallback to English
  }
  return "en";
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // Ignore storage error
    }
  };

  const toggleLang = () => setLang(lang === "en" ? "th" : "en");

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang,
      t: translations[lang],
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
