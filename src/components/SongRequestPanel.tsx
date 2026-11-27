import React, { useMemo, useState } from "react";
import { Check, Link2, Loader2, Lock, Plus, Search, Sparkles } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import type { AddTrackResult } from "../services/roomStore";
import {
  extractYouTubeVideoId,
  fetchYouTubeOEmbed,
  hasYouTubeApiKey,
  searchYouTubeVideos,
} from "../services/youtube";
import type { NewTrackInput, QueueTrack, RoomState, YouTubeSearchResult } from "../types/jukebox";

interface SongRequestPanelProps {
  room: RoomState;
  queue: QueueTrack[];
  guestId: string;
  nickname: string;
  onRequestNickname: () => void;
  onAddTrack: (track: Omit<NewTrackInput, "guestId">) => Promise<AddTrackResult>;
}

export function SongRequestPanel({
  room,
  queue,
  guestId,
  nickname,
  onRequestNickname,
  onAddTrack,
}: SongRequestPanelProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"search" | "link">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDemoCatalog, setIsDemoCatalog] = useState(!hasYouTubeApiKey);

  const [linkInput, setLinkInput] = useState("");
  const [linkPreview, setLinkPreview] = useState<YouTubeSearchResult | null>(null);
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [addingVideoId, setAddingVideoId] = useState<string | null>(null);

  const userActiveCount = useMemo(
    () => queue.filter((item) => item.guestId === guestId).length,
    [guestId, queue]
  );

  const queuedVideoIds = useMemo(() => {
    const ids = new Set(queue.map((item) => item.videoId));
    if (room.currentTrack?.videoId) {
      ids.add(room.currentTrack.videoId);
    }
    return ids;
  }, [queue, room.currentTrack]);

  const handleFetchLink = async (rawUrl: string) => {
    setLinkError(null);
    const id = extractYouTubeVideoId(rawUrl);
    if (!id) {
      setLinkPreview(null);
      setLinkError(t.invalidYoutubeLink);
      return;
    }

    setIsFetchingLink(true);
    try {
      const metadata = await fetchYouTubeOEmbed(rawUrl);
      setLinkPreview(metadata);
    } catch {
      setLinkPreview(null);
      setLinkError(t.linkFetchFailed);
    } finally {
      setIsFetchingLink(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // Smart shortcut: if the guest pastes a YouTube URL into Search, switch & preview it via oEmbed
    if (extractYouTubeVideoId(trimmed)) {
      setActiveTab("link");
      setLinkInput(trimmed);
      await handleFetchLink(trimmed);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await searchYouTubeVideos(trimmed);
      setSearchResults(response.results);
      setIsDemoCatalog(response.isDemoCatalog);
    } catch {
      showToast(t.connectionError, "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleFetchLink(linkInput);
  };

  const handleQueueTrack = async (item: YouTubeSearchResult) => {
    if (!nickname.trim()) {
      onRequestNickname();
      return;
    }

    if (room.requestsLocked) {
      showToast(t.requestsLockedToast, "warning");
      return;
    }

    setAddingVideoId(item.videoId);
    try {
      const result = await onAddTrack({
        videoId: item.videoId,
        title: item.title,
        thumbnail: item.thumbnail,
        channelTitle: item.channelTitle,
        requestedBy: nickname,
      });

      if (result.ok) {
        showToast(`${t.addedToast} — ${item.title}`, "success");
      } else if (result.reason === "locked") {
        showToast(t.requestsLockedToast, "warning");
      } else if (result.reason === "duplicate") {
        showToast(t.alreadyInQueue, "info");
      } else if (result.reason === "limit") {
        showToast(`${t.limitReachedToast} (${result.maxPerUser ?? room.maxPerUser})`, "warning");
      }
    } catch {
      showToast(t.connectionError, "error");
    } finally {
      setAddingVideoId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-2xl border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              activeTab === "search"
                ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            {t.searchTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              activeTab === "link"
                ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            {t.directLinkTab}
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
          <span>{t.quotaBadge}:</span>
          <span
            className={`font-bold ${
              userActiveCount >= room.maxPerUser ? "text-amber-300" : "text-emerald-400"
            }`}
          >
            {userActiveCount}/{room.maxPerUser}
          </span>
        </div>
      </div>

      {room.requestsLocked && (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-200 sm:text-sm">
          <Lock className="h-4 w-4 shrink-0 text-amber-300" />
          <span>{t.requestsLockedBanner}</span>
        </div>
      )}

      {activeTab === "search" ? (
        <div className="space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-2xl border border-white/15 bg-black/45 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isSearching ? t.searching : t.searchButton}
              </span>
            </button>
          </form>

          {isDemoCatalog && (
            <div className="flex items-start gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3.5 py-2.5 text-xs text-cyan-200">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
              <span>{t.demoCatalogNotice}</span>
            </div>
          )}

          {hasSearched && !isSearching && searchResults.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-400">{t.noSearchResults}</p>
          )}

          {searchResults.length > 0 && (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {searchResults.map((item) => {
                const isAlreadyQueued = queuedVideoIds.has(item.videoId);
                const isAdding = addingVideoId === item.videoId;
                return (
                  <div
                    key={item.videoId}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-2.5 transition hover:border-white/20 hover:bg-black/50"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-14 w-20 shrink-0 rounded-xl object-cover bg-zinc-800"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">
                        {item.channelTitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isAlreadyQueued || isAdding || room.requestsLocked}
                      onClick={() => handleQueueTrack(item)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        isAlreadyQueued
                          ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                          : "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md shadow-fuchsia-500/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      }`}
                    >
                      {isAdding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isAlreadyQueued ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isAdding
                          ? t.adding
                          : isAlreadyQueued
                            ? t.alreadyInQueue
                            : t.addToQueue}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <form onSubmit={handleLinkSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="url"
                value={linkInput}
                onChange={(e) => {
                  setLinkInput(e.target.value);
                  setLinkError(null);
                }}
                placeholder={t.directLinkPlaceholder}
                className="w-full rounded-2xl border border-white/15 bg-black/45 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={isFetchingLink || !linkInput.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isFetchingLink ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              <span>{isFetchingLink ? t.fetchingLink : t.fetchLinkButton}</span>
            </button>
          </form>

          {linkError && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-200">
              {linkError}
            </p>
          )}

          {linkPreview && (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-black/45 p-3 sm:flex-row sm:items-center">
              <img
                src={linkPreview.thumbnail}
                alt={linkPreview.title}
                className="h-28 w-full shrink-0 rounded-xl object-cover sm:h-16 sm:w-28"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold text-white">
                  {linkPreview.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-400">
                  {linkPreview.channelTitle}
                </p>
              </div>
              <button
                type="button"
                disabled={
                  queuedVideoIds.has(linkPreview.videoId) ||
                  addingVideoId === linkPreview.videoId ||
                  room.requestsLocked
                }
                onClick={() => handleQueueTrack(linkPreview)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {queuedVideoIds.has(linkPreview.videoId) ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t.alreadyInQueue}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {t.addToQueue}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
