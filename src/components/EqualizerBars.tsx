export function EqualizerBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <span className="inline-flex h-3.5 items-end gap-0.5" aria-hidden="true">
      <span
        className={`w-0.5 rounded-full bg-fuchsia-400 transition-all ${
          isPlaying ? "h-full animate-eq-1" : "h-1.5 opacity-60"
        }`}
      />
      <span
        className={`w-0.5 rounded-full bg-cyan-400 transition-all ${
          isPlaying ? "h-full animate-eq-2" : "h-2.5 opacity-60"
        }`}
      />
      <span
        className={`w-0.5 rounded-full bg-fuchsia-300 transition-all ${
          isPlaying ? "h-full animate-eq-3" : "h-1 opacity-60"
        }`}
      />
    </span>
  );
}
