import { useRef, type RefObject } from "react";
import {
  Disc3,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipForward,
  Sparkles,
  Video,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useFullscreen } from "../hooks/useFullscreen";
import type { CurrentTrack } from "../types/jukebox";

interface YouTubeStagePlayerProps {
  containerRef: RefObject<HTMLDivElement | null>;
  currentTrack: CurrentTrack | null;
  isPlaying: boolean;
  stageMode: "video" | "cover";
  needsInteraction: boolean;
  onEnableAudio: () => void;
  onToggleStageMode: (mode: "video" | "cover") => void;
  onTogglePlayPause?: () => void;
  onSkipNext?: () => void;
}

export function YouTubeStagePlayer({
  containerRef,
  currentTrack,
  isPlaying,
  stageMode,
  needsInteraction,
  onEnableAudio,
  onToggleStageMode,
  onTogglePlayPause,
  onSkipNext,
}: YouTubeStagePlayerProps) {
  const { t } = useLanguage();
  const stageWrapperRef = useRef<HTMLDivElement | null>(null);
  const {
    isFullscreen: isPlayerFullscreen,
    isSupported: isFullscreenSupported,
    toggleFullscreen,
  } = useFullscreen(stageWrapperRef);

  return (
    <div
      ref={stageWrapperRef}
      className={`relative overflow-hidden bg-black/70 shadow-2xl ${
        isPlayerFullscreen
          ? "h-screen w-screen rounded-none border-0 bg-[#07070b]"
          : "rounded-3xl border border-white/15"
      }`}
    >
      {/* Top-right stage mode & player fullscreen controls */}
      <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
        <div className="inline-flex items-center rounded-full border border-white/15 bg-black/65 p-1 backdrop-blur-xl">
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

        {isFullscreenSupported && (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            title={isPlayerFullscreen ? t.exitFullscreen : t.playerFullscreen}
            aria-label={isPlayerFullscreen ? t.exitFullscreen : t.playerFullscreen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/65 text-zinc-200 backdrop-blur-xl transition hover:bg-white/20 hover:text-white"
          >
            {isPlayerFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Stage Container: iframe stays mounted at all times so toggling modes never interrupts playback */}
      <div
        className={`relative w-full overflow-hidden bg-zinc-950 ${
          isPlayerFullscreen ? "h-screen w-screen" : "aspect-video"
        }`}
      >
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
                  className={
                    isPlayerFullscreen
                      ? "h-72 w-[480px] max-w-[85vw] object-cover sm:h-96 sm:w-[640px]"
                      : "h-44 w-72 object-cover sm:h-56 sm:w-96"
                  }
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

        {/* Floating bottom bar when player itself is fullscreen */}
        {isPlayerFullscreen && currentTrack && (
          <div className="absolute inset-x-4 bottom-5 z-30 mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/70 px-5 py-3.5 shadow-2xl backdrop-blur-2xl">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-white">{currentTrack.title}</p>
              <p className="truncate text-xs text-cyan-300">
                {t.requestedBy} {currentTrack.requestedBy} · {currentTrack.channelTitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onTogglePlayPause && (
                <button
                  type="button"
                  onClick={onTogglePlayPause}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-zinc-950 transition hover:bg-zinc-200"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5 fill-current" />
                      {t.pause}
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      {t.play}
                    </>
                  )}
                </button>
              )}

              {onSkipNext && (
                <button
                  type="button"
                  onClick={onSkipNext}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  {t.skipNext}
                </button>
              )}

              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/20"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                {t.exitFullscreen}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
