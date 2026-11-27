import React, { useEffect, useState } from "react";
import { Sparkles, UserCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface NicknameModalProps {
  isOpen: boolean;
  initialValue: string;
  canClose: boolean;
  onSave: (nickname: string) => void;
  onClose: () => void;
}

export function NicknameModal({
  isOpen,
  initialValue,
  canClose,
  onSave,
  onClose,
}: NicknameModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialValue);

  useEffect(() => {
    setName(initialValue);
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-900/90 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{t.nicknameTitle}</h2>
            <p className="text-xs text-zinc-400">{t.nicknameSubtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            autoFocus
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.nicknamePlaceholder}
            className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-base text-white placeholder-zinc-500 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/25"
          />

          <div className="flex flex-wrap gap-1.5">
            {t.nicknameSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setName(suggestion)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/15 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
              >
                {t.close}
              </button>
            )}
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <UserCheck className="h-4 w-4" />
              {t.nicknameSave}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
