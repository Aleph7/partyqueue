import { useLanguage } from "../context/LanguageContext";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-full border border-white/15 bg-white/5 p-0.5 text-xs font-semibold backdrop-blur-md"
      role="group"
      aria-label="Language switcher"
    >
      <button
        type="button"
        onClick={() => setLang("th")}
        className={`rounded-full px-2.5 py-1 transition ${
          lang === "th"
            ? "bg-white text-zinc-950 shadow-sm"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        TH
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1 transition ${
          lang === "en"
            ? "bg-white text-zinc-950 shadow-sm"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
