import type { CurrentTrack, NewTrackInput, QueueTrack, RoomState } from "../types/jukebox";
import { getGuestId } from "../utils/guestIdentity";
import { sortQueue } from "../utils/queueSort";
import { DEFAULT_ROOM_STATE, type AddTrackResult, type RoomSnapshot, type RoomStore } from "./roomStore";
import { DEMO_CATALOG } from "./youtube";

const STORAGE_PREFIX = "partyqueue:room:";
const CHANNEL_NAME = "partyqueue-sync";

function readSnapshot(roomId: string): RoomSnapshot {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${roomId}`);
    if (!raw) {
      return {
        room: { ...DEFAULT_ROOM_STATE },
        queue: [],
      };
    }
    const parsed = JSON.parse(raw) as Partial<RoomSnapshot>;
    return {
      room: {
        ...DEFAULT_ROOM_STATE,
        ...(parsed.room ?? {}),
      },
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
    };
  } catch {
    return {
      room: { ...DEFAULT_ROOM_STATE },
      queue: [],
    };
  }
}

export function createLocalDemoStore(): RoomStore {
  const listeners = new Map<string, Set<(snapshot: RoomSnapshot) => void>>();
  const channel =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

  const notifyRoom = (roomId: string, snapshot: RoomSnapshot) => {
    const subs = listeners.get(roomId);
    if (subs) {
      const activeSnapshot: RoomSnapshot = {
        room: snapshot.room,
        queue: snapshot.queue.filter((item) => item.status === "queued"),
      };
      subs.forEach((cb) => cb(activeSnapshot));
    }
  };

  const writeSnapshot = (roomId: string, snapshot: RoomSnapshot) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${roomId}`, JSON.stringify(snapshot));
    } catch {
      // Ignore quota errors
    }
    notifyRoom(roomId, snapshot);
    channel?.postMessage({ roomId });
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (!event.key || !event.key.startsWith(STORAGE_PREFIX)) {
        return;
      }
      const roomId = event.key.slice(STORAGE_PREFIX.length);
      notifyRoom(roomId, readSnapshot(roomId));
    });
  }

  channel?.addEventListener("message", (event) => {
    const roomId = (event.data as { roomId?: string } | undefined)?.roomId;
    if (roomId) {
      notifyRoom(roomId, readSnapshot(roomId));
    }
  });

  return {
    mode: "demo",

    async ensureAuth() {
      return getGuestId();
    },

    subscribe(roomId, onUpdate) {
      const set = listeners.get(roomId) ?? new Set();
      set.add(onUpdate);
      listeners.set(roomId, set);

      const initial = readSnapshot(roomId);
      onUpdate({
        room: initial.room,
        queue: initial.queue.filter((item) => item.status === "queued"),
      });

      return () => {
        const current = listeners.get(roomId);
        if (!current) return;
        current.delete(onUpdate);
        if (current.size === 0) {
          listeners.delete(roomId);
        }
      };
    },

    async addTrack(roomId, track: NewTrackInput): Promise<AddTrackResult> {
      const snapshot = readSnapshot(roomId);
      const queuedTracks = snapshot.queue.filter((item) => item.status === "queued");

      if (snapshot.room.requestsLocked) {
        return { ok: false, reason: "locked" };
      }

      const isDuplicate =
        snapshot.room.currentTrack?.videoId === track.videoId ||
        queuedTracks.some((item) => item.videoId === track.videoId);
      if (isDuplicate) {
        return { ok: false, reason: "duplicate" };
      }

      const userActiveCount = queuedTracks.filter((item) => item.guestId === track.guestId).length;
      if (userActiveCount >= snapshot.room.maxPerUser) {
        return { ok: false, reason: "limit", maxPerUser: snapshot.room.maxPerUser };
      }

      const newTrack: QueueTrack = {
        id: `trk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        videoId: track.videoId,
        title: track.title,
        thumbnail: track.thumbnail,
        channelTitle: track.channelTitle,
        requestedBy: track.requestedBy,
        guestId: track.guestId,
        votes: 1,
        votedBy: [track.guestId],
        status: "queued",
        priority: 0,
        addedAt: Date.now(),
      };

      writeSnapshot(roomId, {
        room: snapshot.room,
        queue: [...snapshot.queue, newTrack],
      });

      return { ok: true, trackId: newTrack.id };
    },

    async toggleVote(roomId, trackId, guestId) {
      const snapshot = readSnapshot(roomId);
      const nextQueue = snapshot.queue.map((item) => {
        if (item.id !== trackId) return item;
        const hasVoted = item.votedBy.includes(guestId);
        const nextVotedBy = hasVoted
          ? item.votedBy.filter((id) => id !== guestId)
          : [...item.votedBy, guestId];
        return {
          ...item,
          votedBy: nextVotedBy,
          votes: nextVotedBy.length,
        };
      });
      writeSnapshot(roomId, { room: snapshot.room, queue: nextQueue });
    },

    async removeTrack(roomId, trackId) {
      const snapshot = readSnapshot(roomId);
      const nextQueue = snapshot.queue.map((item) =>
        item.id === trackId ? { ...item, status: "skipped" as const } : item
      );
      writeSnapshot(roomId, { room: snapshot.room, queue: nextQueue });
    },

    async moveTrackToTop(roomId, trackId) {
      const snapshot = readSnapshot(roomId);
      const nextQueue = snapshot.queue.map((item) =>
        item.id === trackId ? { ...item, priority: Date.now() } : item
      );
      writeSnapshot(roomId, { room: snapshot.room, queue: nextQueue });
    },

    async clearQueue(roomId) {
      const snapshot = readSnapshot(roomId);
      const nextQueue = snapshot.queue.map((item) =>
        item.status === "queued" ? { ...item, status: "skipped" as const } : item
      );
      writeSnapshot(roomId, { room: snapshot.room, queue: nextQueue });
    },

    async updateRoomSettings(roomId, patch: Partial<RoomState>) {
      const snapshot = readSnapshot(roomId);
      writeSnapshot(roomId, {
        room: { ...snapshot.room, ...patch },
        queue: snapshot.queue,
      });
    },

    async advanceQueue(roomId, currentTrackId, reason) {
      const snapshot = readSnapshot(roomId);
      if (
        currentTrackId &&
        snapshot.room.currentTrack &&
        snapshot.room.currentTrack.id !== currentTrackId
      ) {
        return snapshot.room.currentTrack;
      }

      let nextQueue = snapshot.queue.map((item) =>
        currentTrackId && item.id === currentTrackId ? { ...item, status: reason } : item
      );

      const candidates = sortQueue(
        nextQueue.filter((item) => item.status === "queued"),
        snapshot.room.sortMode
      );

      let nextCurrent: CurrentTrack | null = null;
      if (candidates.length > 0) {
        const chosen = candidates[0];
        nextQueue = nextQueue.map((item) =>
          item.id === chosen.id ? { ...item, status: "playing" as const } : item
        );
        nextCurrent = {
          id: chosen.id,
          videoId: chosen.videoId,
          title: chosen.title,
          thumbnail: chosen.thumbnail,
          channelTitle: chosen.channelTitle,
          requestedBy: chosen.requestedBy,
          addedAt: chosen.addedAt,
        };
      }

      writeSnapshot(roomId, {
        room: {
          ...snapshot.room,
          currentTrack: nextCurrent,
          isPlaying: Boolean(nextCurrent),
          playbackPosition: 0,
          playbackDuration: 0,
          playbackUpdatedAt: Date.now(),
        },
        queue: nextQueue,
      });

      return nextCurrent;
    },

    async seedDemoTracks(roomId, guestId) {
      const picks = DEMO_CATALOG.slice(0, 3);
      for (const item of picks) {
        await this.addTrack(roomId, {
          videoId: item.videoId,
          title: item.title,
          thumbnail: item.thumbnail,
          channelTitle: item.channelTitle,
          requestedBy: "DJ Demo",
          guestId,
        });
      }
    },
  };
}
