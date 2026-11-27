import { ArrowUp, ArrowUpToLine, Flame, ListOrdered, Music2, Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { QueueTrack, SortMode } from "../types/jukebox";

interface QueueListProps {
  queue: QueueTrack[];
  sortMode: SortMode;
  guestId: string;
  isHost?: boolean;
  onToggleVote?: (trackId: string) => void;
  onRemoveTrack?: (trackId: string) => void;
  onMoveToTop?: (trackId: string) => void;
}

export function QueueList({
  queue,
  sortMode,
  guestId,
  isHost = false,
  onToggleVote,
  onRemoveTrack,
  onMoveToTop,
}: QueueListProps) {
  const { t } = useLanguage();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-white sm:text-lg">{t.upNext}</h2>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-zinc-200">
            {queue.length}
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-zinc-300">
          {sortMode === "votes" ? (
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
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center">
          <Music2 className="mb-2.5 h-8 w-8 text-zinc-600" />
          <p className="max-w-xs text-sm text-zinc-400">
            {isHost ? t.queueEmptyHost : t.queueEmptyGuest}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {queue.map((track, idx) => {
            const isMine = track.guestId === guestId;
            const hasVoted = track.votedBy.includes(guestId);

            return (
              <div
                key={track.id}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-2.5 transition hover:border-white/20 hover:bg-black/50"
              >
                <div className="flex w-6 shrink-0 items-center justify-center text-xs font-extrabold text-zinc-500">
                  #{idx + 1}
                </div>

                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="h-12 w-16 shrink-0 rounded-xl object-cover bg-zinc-800"
                />

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-white">
                    {track.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                    <span className="truncate max-w-[140px]">{track.channelTitle}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-zinc-200">
                      {track.requestedBy}
                      {isMine && !isHost && (
                        <span className="rounded-full bg-fuchsia-500/30 px-1.5 text-[10px] font-bold text-fuchsia-200">
                          {t.youBadge}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {onToggleVote && !isHost && (
                    <button
                      type="button"
                      onClick={() => onToggleVote(track.id)}
                      aria-label={hasVoted ? t.upvoted : t.upvote}
                      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                        hasVoted
                          ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-200 shadow-sm shadow-fuchsia-500/20"
                          : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/25 hover:bg-white/10"
                      }`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      <span>{track.votes}</span>
                    </button>
                  )}

                  {isHost && (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-zinc-300">
                      <ArrowUp className="h-3 w-3 text-fuchsia-400" />
                      {track.votes}
                    </span>
                  )}

                  {isHost && onMoveToTop && idx > 0 && (
                    <button
                      type="button"
                      onClick={() => onMoveToTop(track.id)}
                      title={t.moveToTop}
                      aria-label={t.moveToTop}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:text-cyan-200"
                    >
                      <ArrowUpToLine className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {onRemoveTrack && (isHost || isMine) && (
                    <button
                      type="button"
                      onClick={() => onRemoveTrack(track.id)}
                      title={isHost ? t.removeTrack : t.cancelRequest}
                      aria-label={isHost ? t.removeTrack : t.cancelRequest}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:border-rose-400/40 hover:bg-rose-500/20 hover:text-rose-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
