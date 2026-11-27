import { Disc3, Pause, Play } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { RoomState } from "../types/jukebox";
import { formatTime } from "../utils/queueSort";
import { EqualizerBars } from "./EqualizerBars";

export function GuestNowPlayingBar({ room }: { room: RoomState }) {
  const { t } = useLanguage();
  const track = room.currentTrack;

  const duration = room.playbackDuration ?? 0;
  const position = room.playbackPosition ?? 0;
  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  return (
    <div className="sticky top-2 z-30 mx-auto w-full max-w-2xl px-3 sm:px-4">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/80 shadow-2xl shadow-black/50 backdrop-blur-2xl">
        <div className="flex items-center gap-3 p-3">
          {track ? (
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
              <img
                src={track.thumbnail}
                alt={track.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
              <Disc3 className="h-6 w-6 animate-spin [animation-duration:8s]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-fuchsia-300">
              <EqualizerBars isPlaying={Boolean(track && room.isPlaying)} />
              <span>{t.nowPlayingOnMac}</span>
              {track && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium normal-case text-zinc-200">
                  {room.isPlaying ? (
                    <>
                      <Play className="h-2.5 w-2.5 fill-current text-emerald-400" />
                      {t.playing}
                    </>
                  ) : (
                    <>
                      <Pause className="h-2.5 w-2.5 text-amber-300" />
                      {t.paused}
                    </>
                  )}
                </span>
              )}
            </div>

            {track ? (
              <>
                <p className="truncate text-sm font-bold text-white">{track.title}</p>
                <p className="truncate text-xs text-zinc-400">
                  {t.requestedBy}{" "}
                  <span className="font-semibold text-cyan-300">{track.requestedBy}</span>
                  {duration > 0 && (
                    <span className="ml-2 text-zinc-500">
                      {formatTime(position)} / {formatTime(duration)}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-zinc-200">
                  {t.nothingPlaying}
                </p>
                <p className="truncate text-xs text-zinc-400">{t.nothingPlayingHint}</p>
              </>
            )}
          </div>
        </div>

        <div className="h-1 w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${track ? progressPct : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
