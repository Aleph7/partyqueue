import React, { useEffect, useState } from "react";
import { Delete, ShieldCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const PIN_STORAGE_KEY = "partyqueue_host_pin_override";

export function getExpectedHostPin(): string {
  try {
    const override = localStorage.getItem(PIN_STORAGE_KEY)?.trim();
    if (override && /^\d{4}$/.test(override)) {
      return override;
    }
  } catch {
    // Ignore storage error
  }
  const envPin = import.meta.env.VITE_HOST_PIN?.trim();
  return envPin && /^\d{4}$/.test(envPin) ? envPin : "0000";
}

export function setHostPinOverride(newPin: string): boolean {
  if (!/^\d{4}$/.test(newPin)) {
    return false;
  }
  try {
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
    return true;
  } catch {
    return false;
  }
}

interface HostPinGateProps {
  onUnlock: () => void;
}

export function HostPinGate({ onUnlock }: HostPinGateProps) {
  const { t } = useLanguage();
  const [pin, setPin] = useState("");
  const [hasError, setHasError] = useState(false);

  const attemptVerify = (candidate: string) => {
    const expected = getExpectedHostPin();
    if (candidate === expected) {
      onUnlock();
    } else {
      setHasError(true);
      window.setTimeout(() => {
        setPin("");
        setHasError(false);
      }, 480);
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= 4 || hasError) return;
    const next = `${pin}${digit}`;
    setPin(next);
    if (next.length === 4) {
      attemptVerify(next);
    }
  };

  const handleBackspace = () => {
    if (hasError) return;
    setPin((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        setPin("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      attemptVerify(pin);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070b] p-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.18),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_50%)]" />

      <form
        onSubmit={handleSubmit}
        className={`relative z-10 w-full max-w-sm rounded-3xl border border-white/15 bg-zinc-900/80 p-7 text-center shadow-2xl backdrop-blur-2xl ${
          hasError ? "animate-shake border-rose-500/50" : ""
        }`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/25">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h1 className="text-xl font-extrabold text-white">{t.hostPinTitle}</h1>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{t.hostPinSubtitle}</p>

        <div className="my-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((slot) => {
            const filled = slot < pin.length;
            return (
              <div
                key={slot}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-bold transition ${
                  hasError
                    ? "border-rose-400 bg-rose-500/20 text-rose-200"
                    : filled
                      ? "border-fuchsia-400 bg-fuchsia-500/20 text-white"
                      : "border-white/15 bg-black/40 text-zinc-600"
                }`}
              >
                {filled ? "•" : ""}
              </div>
            );
          })}
        </div>

        {hasError && (
          <p className="mb-4 text-xs font-semibold text-rose-400">{t.hostPinIncorrect}</p>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="rounded-2xl border border-white/10 bg-white/5 py-3 text-lg font-bold text-white transition hover:bg-white/15 active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin("")}
            className="rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            {t.hostPinClear}
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="rounded-2xl border border-white/10 bg-white/5 py-3 text-lg font-bold text-white transition hover:bg-white/15 active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-3 text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-[11px] text-zinc-500">{t.hostPinDefaultHint}</p>
      </form>
    </div>
  );
}
