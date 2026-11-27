import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Disc3,
  Flame,
  ListOrdered,
  Lock,
  Pause,
  Play,
  Radio,
  Settings,
  Shield,
  SkipForward,
  Sparkles,
  Trash2,
  Unlock,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EqualizerBars } from "../components/EqualizerBars";
import { HostPinGate } from "../components/HostPinGate";
import { HostSettingsModal } from "../components/HostSettingsModal";
import { LanguageToggle } from "../components/LanguageToggle";
import { QrCodeCard } from "../components/QrCodeCard";
import { QueueList } from "../components/QueueList";
import { YouTubeStagePlayer } from "../components/YouTubeStagePlayer";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useMediaSession } from "../hooks/useMediaSession";
import { useRoom } from "../hooks/useRoom";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";
import { formatTime } from "../utils/queueSort";

const PIN_SESSION_KEY_PREFIX = "partyqueue_host_unlocked_";

export function HostPage() {
  const { roomId: rawRoomId } = useParams<{ roomId?: string }>();
  const roomId = rawRoomId?.trim() || "main";

  const { t } = useLanguage();
  const { showToast } = useToast();
  const {
    room,
    sortedQueue,
    mode,
    guestId,
    isLoading,
    error,
    removeTrack,
    moveTrackToTop,
    clearQueue,
    updateRoomSettings,
    advanceQueue,
    seedDemoTracks,
  } = useRoom(roomId);

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(`${PIN_SESSION_KEY_PREFIX}${roomId}`) === "1";
    } catch {
      return false;
    }
  });
  const [stageMode, setStageMode] = useState<"video" | "cover">("video");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentTrackId = room.currentTrack?.id ?? null;
  const currentVideoId = room.currentTrack?.videoId ?? null;

  const processingTrackIdRef = useRef<string | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);
  const lastProgressSyncRef = useRef<number>(0);

  const handleAdvance = useCallback(
    async (reason: "played" | "skipped") => {
      const targetId = currentTrackId ?? "__empty__";
      if (processingTrackIdRef.current === targetId) {
        return;
      }
      processingTrackIdRef.current = targetId;
      try {
        await advanceQueue(currentTrackId, reason);
      } catch {
        showToast(t.connectionError, "error");
      } finally {
        window.setTimeout(() => {
          if (processingTrackIdRef.current === targetId) {
            processingTrackIdRef.current = null;
          }
        }, 500);
      }
    },
    [advanceQueue, currentTrackId, showToast, t.connectionError]
  );

  const handlePlayerEnded = useCallback(() => {
    void handleAdvance("played");
  }, [handleAdvance]);

  const handlePlayerError = useCallback(
    (code: number) => {
      // YouTube error codes 100 (not found/private), 101/150 (embed restricted), 2/5 (bad playback)
      if (!currentTrackId) return;
      if (processingTrackIdRef.current === currentTrackId) return;

      processingTrackIdRef.current = currentTrackId;
      const reasonMsg =
        code === 100 || code === 101 || code === 150
          ? t.videoRestrictedSkipping
          : t.videoRestrictedSkipping;
      showToast(reasonMsg, "warning", 4000);

      window.setTimeout(() => {
        void advanceQueue(currentTrackId, "skipped").finally(() => {
          window.setTimeout(() => {
            if (processingTrackIdRef.current === currentTrackId) {
              processingTrackIdRef.current = null;
            }
          }, 500);
        });
      }, 800);
    },
    [advanceQueue, currentTrackId, showToast, t.videoRestrictedSkipping]
  );

  const handlePlaybackChange = useCallback(
    (playing: boolean) => {
      if (!currentTrackId) return;
      if (room.isPlaying !== playing) {
        void updateRoomSettings({ isPlaying: playing });
      }
    },
    [currentTrackId, room.isPlaying, updateRoomSettings]
  );

  const player = useYouTubePlayer({
    onEnded: handlePlayerEnded,
    onError: handlePlayerError,
    onPlaybackChange: handlePlaybackChange,
  });

  // Load new track when room.currentTrack changes
  useEffect(() => {
    if (!isUnlocked || !player.isReady) {
      return;
    }

    if (!currentTrackId || !currentVideoId) {
      if (loadedTrackIdRef.current !== null) {
        loadedTrackIdRef.current = null;
        player.stopVideo();
      }
      return;
    }

    if (loadedTrackIdRef.current !== currentTrackId) {
      loadedTrackIdRef.current = currentTrackId;
      processingTrackIdRef.current = null;
      player.loadVideo(currentVideoId, room.isPlaying);
    }
  }, [
    currentTrackId,
    currentVideoId,
    isUnlocked,
    player,
    room.isPlaying,
  ]);

  // Auto-promote the first queued track when the stage is idle and songs arrive
  useEffect(() => {
    if (!isUnlocked || isLoading) return;
    if (!room.currentTrack && sortedQueue.length > 0 && processingTrackIdRef.current === null) {
      void handleAdvance("played");
    }
  }, [handleAdvance, isLoading, isUnlocked, room.currentTrack, sortedQueue.length]);

  // Throttled playback progress sync so Guest mini-bar stays live
  useEffect(() => {
    if (!isUnlocked || !room.currentTrack || !room.isPlaying) return;
    const now = Date.now();
    if (now - lastProgressSyncRef.current < 4500) return;
    lastProgressSyncRef.current = now;

    void updateRoomSettings({
      playbackPosition: Math.floor(player.currentTime),
      playbackDuration: Math.floor(player.duration),
      playbackUpdatedAt: now,
    });
  }, [
    isUnlocked,
    player.currentTime,
    player.duration,
    room.currentTrack,
    room.isPlaying,
    updateRoomSettings,
  ]);

  const handleTogglePlayPause = useCallback(() => {
    if (!room.currentTrack) {
      if (sortedQueue.length > 0) {
        void handleAdvance("played");
      }
      return;
    }

    if (room.isPlaying) {
      player.pause();
      void updateRoomSettings({
        isPlaying: false,
        playbackPosition: Math.floor(player.currentTime),
        playbackDuration: Math.floor(player.duration),
        playbackUpdatedAt: Date.now(),
      });
    } else {
      player.play();
      void updateRoomSettings({
        isPlaying: true,
        playbackPosition: Math.floor(player.currentTime),
        playbackDuration: Math.floor(player.duration),
        playbackUpdatedAt: Date.now(),
      });
    }
  }, [
    handleAdvance,
    player,
    room.currentTrack,
    room.isPlaying,
    sortedQueue.length,
    updateRoomSettings,
  ]);

  const handleSkipNext = useCallback(() => {
    if (!room.currentTrack && sortedQueue.length === 0) return;
    void handleAdvance("skipped");
    showToast(t.trackSkipped, "info");
  }, [handleAdvance, room.currentTrack, showToast, sortedQueue.length, t.trackSkipped]);

  // macOS Native MediaSession integration (Media Keys + Control Center Now Playing)
  useMediaSession({
    currentTrack: room.currentTrack,
    isPlaying: room.isPlaying,
    currentTime: player.currentTime,
    duration: player.duration,
    onPlay: () => {
      if (room.currentTrack) {
        player.play();
        void updateRoomSettings({ isPlaying: true });
      }
    },
    onPause: () => {
      if (room.currentTrack) {
        player.pause();
        void updateRoomSettings({ isPlaying: false });
      }
    },
    onNextTrack: handleSkipNext,
    onSeekTo: (seconds) => player.seekTo(seconds),
  });

  // Keyboard shortcuts for Mac Host
  useEffect(() => {
    if (!isUnlocked) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlayPause();
      } else if (e.shiftKey && (e.key === "N" || e.key === "n")) {
        e.preventDefault();
        handleSkipNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSkipNext, handleTogglePlayPause, isUnlocked]);

  const guestUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    return roomId === "main"
      ? `${window.location.origin}${basePath || "/"}`
      : `${window.location.origin}${basePath}/room/${roomId}`;
  }, [roomId]);

  const guestPath = roomId === "main" ? "/" : `/room/${roomId}`;
  const nextTrack = sortedQueue[0] ?? null;

  const handleUnlock = () => {
    setIsUnlocked(true);
    try {
      sessionStorage.setItem(`${PIN_SESSION_KEY_PREFIX}${roomId}`, "1");
    } catch {
      // Ignore storage error
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem(`${PIN_SESSION_KEY_PREFIX}${roomId}`);
    } catch {
      // Ignore storage error
    }
  };

  const handleClearQueue = async () => {
    if (sortedQueue.length === 0) return;
    if (!window.confirm(t.clearQueueConfirm)) return;
    await clearQueue();
  };

  if (!isUnlocked) {
    return <HostPinGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07070b] pb-10 text-white">
      {/* Dynamic Ambient Backdrop from Album Art */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {room.currentTrack ? (
          <img
            src={room.currentTrack.thumbnail}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-110 object-cover opacity-35 blur-3xl transition-all duration-1000"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.22),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.18),transparent_50%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070b]/70 via-[#07070b]/80 to-[#07070b]" />
      </div>

      {/* Host Header */}
      <header className="relative z-20 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-lg shadow-fuchsia-500/25">
            <Disc3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white">
                {t.appName} <span className="font-medium text-zinc-400">Stage</span>
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  mode === "firebase"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-200"
                }`}
              >
                <Radio className="h-3 w-3" />
                {mode === "firebase" ? t.liveModeBadge : t.demoModeBadge}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {roomId !== "main" ? `${t.roomLabel}: ${roomId} · ` : ""}
              {t.shortcutsHint}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />

          <Link
            to={guestPath}
            className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/15"
          >
            {t.guestRemoteLink}
          </Link>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/15"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.hostSettings}</span>
          </button>

          <button
            type="button"
            onClick={handleLock}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200"
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.lockStage}</span>
          </button>
        </div>
      </header>

      {/* Main Mac Stage Layout */}
      <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-12">
        {/* Left 8 cols: Hero Player + Metadata + Host Control Deck */}
        <section className="flex flex-col gap-5 lg:col-span-8">
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-200">
              {t.connectionError}
            </div>
          )}

          <YouTubeStagePlayer
            containerRef={player.containerRef}
            currentTrack={room.currentTrack}
            isPlaying={room.isPlaying}
            stageMode={stageMode}
            needsInteraction={player.needsInteraction}
            onEnableAudio={() => {
              player.play();
              void updateRoomSettings({ isPlaying: true });
            }}
            onToggleStageMode={setStageMode}
          />

          {/* Now Playing Typography & Progress Deck */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-fuchsia-300">
                  <EqualizerBars isPlaying={Boolean(room.currentTrack && room.isPlaying)} />
                  <span>{t.nowPlaying}</span>
                </div>

                <h2 className="line-clamp-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {room.currentTrack?.title ?? t.nothingPlaying}
                </h2>

                {room.currentTrack ? (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-medium text-zinc-300">
                      {room.currentTrack.channelTitle}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-200 shadow-sm shadow-cyan-500/10">
                      <Sparkles className="h-3 w-3" />
                      {t.requestedBy} {room.currentTrack.requestedBy}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1.5 text-sm text-zinc-400">{t.nothingPlayingHint}</p>
                )}
              </div>

              {/* Next Up Mini Preview */}
              <div className="w-full shrink-0 rounded-2xl border border-white/10 bg-black/40 p-3 sm:w-64">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {t.nextUpLabel}
                </p>
                {nextTrack ? (
                  <div className="mt-2 flex items-center gap-2.5">
                    <img
                      src={nextTrack.thumbnail}
                      alt={nextTrack.title}
                      className="h-10 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">{nextTrack.title}</p>
                      <p className="truncate text-[11px] text-zinc-400">
                        {nextTrack.requestedBy}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-zinc-500">{t.noNextTrack}</p>
                )}
              </div>
            </div>

            {/* Interactive Progress Scrubber */}
            <div className="mt-5">
              <input
                type="range"
                min={0}
                max={Math.max(1, Math.floor(player.duration || 1))}
                value={Math.min(
                  Math.floor(player.currentTime),
                  Math.max(1, Math.floor(player.duration || 1))
                )}
                disabled={!room.currentTrack || player.duration <= 0}
                onChange={(e) => player.seekTo(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-fuchsia-500 disabled:cursor-default"
                aria-label="Playback progress"
              />
              <div className="mt-1.5 flex justify-between text-xs font-medium text-zinc-400">
                <span>{formatTime(player.currentTime)}</span>
                <span>{formatTime(player.duration)}</span>
              </div>
            </div>

            {/* Host Control Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              {/* Primary Transport + Volume */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleTogglePlayPause}
                  disabled={!room.currentTrack && sortedQueue.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-950 shadow-lg transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {room.isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 fill-current" />
                      {t.pause}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      {t.play}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipNext}
                  disabled={!room.currentTrack && sortedQueue.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <SkipForward className="h-4 w-4" />
                  {t.skipNext}
                </button>

                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
                  <button
                    type="button"
                    onClick={player.toggleMute}
                    className="text-zinc-300 transition hover:text-white"
                    aria-label={player.isMuted ? "Unmute" : "Mute"}
                  >
                    {player.isMuted || player.volume === 0 ? (
                      <VolumeX className="h-4 w-4 text-rose-400" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={player.isMuted ? 0 : player.volume}
                    onChange={(e) => player.setVolume(Number(e.target.value))}
                    className="w-20 cursor-pointer accent-cyan-400"
                    aria-label="Volume"
                  />
                </div>
              </div>

              {/* Room Policy Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void updateRoomSettings({
                      sortMode: room.sortMode === "fifo" ? "votes" : "fifo",
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/15"
                >
                  {room.sortMode === "votes" ? (
                    <>
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                      {t.sortVotes}
                    </>
                  ) : (
                    <>
                      <ListOrdered className="h-3.5 w-3.5 text-cyan-400" />
                      {t.sortFifo}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void updateRoomSettings({ requestsLocked: !room.requestsLocked })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition ${
                    room.requestsLocked
                      ? "border-amber-400/40 bg-amber-500/20 text-amber-200"
                      : "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/15"
                  }`}
                >
                  {room.requestsLocked ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      {t.requestsClosed}
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                      {t.requestsOpen}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => void handleClearQueue()}
                  disabled={sortedQueue.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t.clearQueue}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right 4 cols: Corner QR Code Card + Live Host Queue */}
        <aside className="flex flex-col gap-5 lg:col-span-4">
          <QrCodeCard guestUrl={guestUrl} />

          {mode === "demo" && sortedQueue.length === 0 && (
            <button
              type="button"
              onClick={async () => {
                await seedDemoTracks();
                showToast(t.demoTracksLoaded, "success");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/15 px-4 py-3 text-sm font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/25"
            >
              <Sparkles className="h-4 w-4" />
              {t.loadDemoTracks}
            </button>
          )}

          <QueueList
            queue={sortedQueue}
            sortMode={room.sortMode}
            guestId={guestId}
            isHost
            onRemoveTrack={(id) => void removeTrack(id)}
            onMoveToTop={(id) => void moveTrackToTop(id)}
          />
        </aside>
      </main>

      <HostSettingsModal
        isOpen={isSettingsOpen}
        maxPerUser={room.maxPerUser}
        mode={mode}
        onClose={() => setIsSettingsOpen(false)}
        onSaveMaxPerUser={async (maxPerUser) => {
          await updateRoomSettings({ maxPerUser });
        }}
      />
    </div>
  );
}
