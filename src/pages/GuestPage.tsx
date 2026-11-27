import { useState } from "react";
import { Disc3, Edit3, MonitorPlay, Radio } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { GuestNowPlayingBar } from "../components/GuestNowPlayingBar";
import { LanguageToggle } from "../components/LanguageToggle";
import { NicknameModal } from "../components/NicknameModal";
import { QueueList } from "../components/QueueList";
import { SongRequestPanel } from "../components/SongRequestPanel";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useRoom } from "../hooks/useRoom";
import { getStoredNickname, setStoredNickname } from "../utils/guestIdentity";

export function GuestPage() {
  const { roomId: rawRoomId } = useParams<{ roomId?: string }>();
  const roomId = rawRoomId?.trim() || "main";

  const { t } = useLanguage();
  const { showToast } = useToast();
  const {
    room,
    sortedQueue,
    mode,
    guestId,
    error,
    addTrack,
    toggleVote,
    removeTrack,
  } = useRoom(roomId);

  const [nickname, setNickname] = useState<string>(() => getStoredNickname());
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState<boolean>(
    () => !getStoredNickname()
  );

  const handleSaveNickname = (nextName: string) => {
    const saved = setStoredNickname(nextName);
    setNickname(saved);
    setIsNicknameModalOpen(false);
  };

  const handleRemoveOwnTrack = async (trackId: string) => {
    try {
      await removeTrack(trackId);
    } catch {
      showToast(t.connectionError, "error");
    }
  };

  const hostPath = roomId === "main" ? "/host" : `/room/${roomId}/host`;

  return (
    <div className="relative min-h-screen bg-[#07070b] pb-16 text-white">
      {/* Ambient Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {room.currentTrack ? (
          <img
            src={room.currentTrack.thumbnail}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-125 object-cover opacity-20 blur-3xl transition-all duration-1000"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.2),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_50%)]" />
        )}
        <div className="absolute inset-0 bg-[#07070b]/75" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-lg shadow-fuchsia-500/25">
            <Disc3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">
                {t.appName}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  mode === "firebase"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-200"
                }`}
              >
                <Radio className="h-2.5 w-2.5" />
                {mode === "firebase" ? t.liveModeBadge : t.demoModeBadge}
              </span>
            </div>
            {roomId !== "main" && (
              <p className="text-[11px] text-zinc-400">
                {t.roomLabel}: <span className="font-semibold text-zinc-200">{roomId}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNicknameModalOpen(true)}
            title={t.nicknameEdit}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/15"
          >
            <span className="max-w-[90px] truncate">{nickname || "..."}</span>
            <Edit3 className="h-3 w-3 text-fuchsia-300" />
          </button>

          <LanguageToggle />

          <Link
            to={hostPath}
            title={t.hostStageLink}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/15 hover:text-white sm:px-3 sm:py-1.5"
          >
            <MonitorPlay className="h-3.5 w-3.5 text-cyan-300" />
            <span className="hidden sm:inline">{t.hostStageLink}</span>
          </Link>
        </div>
      </header>

      {/* Sticky Mini Now Playing Bar */}
      <GuestNowPlayingBar room={room} />

      {/* Main Content */}
      <main className="relative z-10 mx-auto mt-4 flex max-w-2xl flex-col gap-4 px-3 sm:px-4">
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-200">
            {t.connectionError}
          </div>
        )}

        <SongRequestPanel
          room={room}
          queue={sortedQueue}
          guestId={guestId}
          nickname={nickname}
          onRequestNickname={() => setIsNicknameModalOpen(true)}
          onAddTrack={addTrack}
        />

        <QueueList
          queue={sortedQueue}
          sortMode={room.sortMode}
          guestId={guestId}
          onToggleVote={toggleVote}
          onRemoveTrack={handleRemoveOwnTrack}
        />
      </main>

      <NicknameModal
        isOpen={isNicknameModalOpen}
        initialValue={nickname}
        canClose={Boolean(nickname)}
        onSave={handleSaveNickname}
        onClose={() => setIsNicknameModalOpen(false)}
      />
    </div>
  );
}
