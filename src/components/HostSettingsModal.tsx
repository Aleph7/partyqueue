import React, { useEffect, useState } from "react";
import { Settings, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { getExpectedHostPin, setHostPinOverride } from "./HostPinGate";

interface HostSettingsModalProps {
  isOpen: boolean;
  maxPerUser: number;
  mode: "firebase" | "demo";
  onClose: () => void;
  onSaveMaxPerUser: (maxPerUser: number) => Promise<void>;
}

export function HostSettingsModal({
  isOpen,
  maxPerUser,
  mode,
  onClose,
  onSaveMaxPerUser,
}: HostSettingsModalProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [limit, setLimit] = useState(maxPerUser);
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    setLimit(maxPerUser);
    setPinInput(getExpectedHostPin());
  }, [isOpen, maxPerUser]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clamped = Math.max(1, Math.min(10, Number(limit) || 3));
    await onSaveMaxPerUser(clamped);

    if (/^\d{4}$/.test(pinInput) && pinInput !== getExpectedHostPin()) {
      setHostPinOverride(pinInput);
      showToast(t.pinUpdated, "success");
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-900/95 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="h-5 w-5 text-fuchsia-400" />
            <h2 className="text-lg font-bold text-white">{t.hostSettings}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label={t.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t.maxTracksPerGuest}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="flex-1 accent-fuchsia-500"
              />
              <span className="w-10 rounded-xl border border-white/15 bg-black/40 py-1.5 text-center text-sm font-bold text-white">
                {limit}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t.newHostPin}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-base tracking-[0.5em] text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-zinc-300">
            Sync Mode:{" "}
            <span className="font-bold text-white">
              {mode === "firebase" ? "Firebase Firestore + Anonymous Auth" : "LocalStorage Demo Mode"}
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
            >
              {t.close}
            </button>
            <button
              type="submit"
              className="flex-[2] rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110"
            >
              {t.saveSettings}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
