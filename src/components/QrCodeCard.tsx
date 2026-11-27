import { Check, Copy, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

export function QrCodeCard({ guestUrl }: { guestUrl: string }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      showToast(t.linkCopied, "success");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(guestUrl, "info");
    }
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center gap-4">
        <div className="shrink-0 rounded-2xl bg-white p-2.5 shadow-lg">
          <QRCodeSVG
            value={guestUrl}
            size={104}
            bgColor="#ffffff"
            fgColor="#09090b"
            level="M"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <QrCode className="h-3.5 w-3.5" />
            <span>{t.scanToRequest}</span>
          </div>
          <p className="mt-1 truncate text-xs text-zinc-300">{guestUrl}</p>

          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? t.linkCopied : t.copyGuestLink}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
