import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToast, type ToastVariant } from "../context/ToastContext";

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-400/30 bg-emerald-950/85 text-emerald-100",
  error: "border-rose-400/35 bg-rose-950/90 text-rose-100",
  warning: "border-amber-400/35 bg-amber-950/90 text-amber-100",
  info: "border-white/20 bg-zinc-900/90 text-zinc-100",
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  switch (variant) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
    case "error":
      return <XCircle className="h-4 w-4 shrink-0 text-rose-400" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />;
    default:
      return <Info className="h-4 w-4 shrink-0 text-sky-400" />;
  }
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl transition-all ${variantStyles[toast.variant]}`}
        >
          <ToastIcon variant={toast.variant} />
          <span className="leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="ml-1 rounded-lg p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
