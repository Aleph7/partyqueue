import type { RefObject } from "react";
import { Disc3, Play, Sparkles, Video } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { CurrentTrack } from "../types/jukebox";

interface YouTubeStagePlayerProps {
  containerRef: RefObject<HTMLDivElement | null>;
  currentTrack: CurrentTrack | null;
  isPlaying: boolean;
  stageMode: "video" | "cover";
  needsInteraction: boolean;
  onEnableAudio: () => void;
  onToggleStageMode: (mode: "video" | "cover") => void;
}

export function YouTubeStagePlayer({
  containerRef,
  currentTrack,
  isPlaying,
  stageMode,
  needsInteraction,
  onEnableAudio,
  onToggleStageMode,
}: YouTubeStagePlayerProps) {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/70 shadow-2xl">
      {/* Stage mode pill */}
      <div className="absolute right-4 top-4 z-30 inline-flex items-center rounded-full border border-white/15 bg-black/65 p-1 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => onToggleStageMode("video")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            stageMode === "video"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-300 hover:text-white"
          }`}
        >
          <Video className="h-3.5 w-3.5" />
          {t.videoStageMode}
        </button>
        <button
          type="button"
          onClick={() => onToggleStageMode("cover")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            stageMode === "cover"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-300 hover:text-white"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t.coverArtMode}
        </button>
      </div>

      {/* 16:9 Stage Container: iframe stays mounted at all times so toggling modes never interrupts playback */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        <div
          ref={containerRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
            currentTrack && stageMode === "video"
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        />

        {/* Ambient Cover Art Mode overlay */}
        {currentTrack && stageMode === "cover" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden p-6">
            <img
              src={currentTrack.thumbnail}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/50" />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div
                className={`overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-black/70 ${
                  isPlaying ? "animate-float-slow" : ""
                }`}
              >
                <img
                  src={`https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`}
                  alt={currentTrack.title}
                  className="h-44 w-72 object-cover sm:h-56 sm:w-96"
                />
              </div>
            </div>
          </div>
        )}

        {/* Idle Stage Overlay */}
        {!currentTrack && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.16),transparent_65%)] p-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-white/5 text-fuchsia-300 shadow-xl">
              <Disc3 className="h-10 w-10 animate-spin [animation-duration:10s]" />
            </div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">{t.nothingPlaying}</h3>
            <p className="mt-1.5 max-w-md text-sm text-zinc-400">{t.nothingPlayingHint}</p>
          </div>
        )}

        {/* Browser Autoplay Gesture Recovery Overlay */}
        {currentTrack && needsInteraction && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 p-6 text-center backdrop-blur-md">
            <button
              type="button"
              onClick={onEnableAudio}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-7 py-4 text-base font-extrabold text-white shadow-2xl shadow-fuchsia-500/35 transition hover:scale-105"
            >
              <Play className="h-5 w-5 fill-current" />
              {t.enableAudioButton}
            </button>
            <p className="mt-3 max-w-sm text-xs text-zinc-300">{t.enableAudioHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
