import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { CurrentTrack, QueueTrack, RoomState } from "../types/jukebox";
import { getGuestId } from "../utils/guestIdentity";
import { sortQueue } from "../utils/queueSort";
import { getFirebaseServices } from "./firebaseConfig";
import { DEFAULT_ROOM_STATE, type AddTrackResult, type RoomSnapshot, type RoomStore } from "./roomStore";
import { DEMO_CATALOG } from "./youtube";

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return Date.now();
}

function normalizeRoomState(raw: Record<string, unknown> | undefined): RoomState {
  if (!raw) {
    return { ...DEFAULT_ROOM_STATE };
  }

  const rawTrack = raw.currentTrack as Record<string, unknown> | null | undefined;
  const currentTrack: CurrentTrack | null = rawTrack
    ? {
        id: String(rawTrack.id ?? ""),
        videoId: String(rawTrack.videoId ?? ""),
        title: String(rawTrack.title ?? "Untitled"),
        thumbnail: String(rawTrack.thumbnail ?? ""),
        channelTitle: String(rawTrack.channelTitle ?? "YouTube"),
        requestedBy: String(rawTrack.requestedBy ?? "Guest"),
        addedAt: toMillis(rawTrack.addedAt),
      }
    : null;

  return {
    isPlaying: Boolean(raw.isPlaying),
    sortMode: raw.sortMode === "votes" ? "votes" : "fifo",
    requestsLocked: Boolean(raw.requestsLocked),
    maxPerUser:
      typeof raw.maxPerUser === "number" && raw.maxPerUser >= 1 ? raw.maxPerUser : 3,
    currentTrack,
    playbackPosition:
      typeof raw.playbackPosition === "number" ? raw.playbackPosition : undefined,
    playbackDuration:
      typeof raw.playbackDuration === "number" ? raw.playbackDuration : undefined,
    playbackUpdatedAt:
      typeof raw.playbackUpdatedAt === "number" ? raw.playbackUpdatedAt : undefined,
  };
}

function normalizeQueueTrack(id: string, raw: Record<string, unknown>): QueueTrack {
  return {
    id,
    videoId: String(raw.videoId ?? ""),
    title: String(raw.title ?? "Untitled"),
    thumbnail: String(raw.thumbnail ?? ""),
    channelTitle: String(raw.channelTitle ?? "YouTube"),
    requestedBy: String(raw.requestedBy ?? "Guest"),
    guestId: String(raw.guestId ?? ""),
    votes: typeof raw.votes === "number" ? raw.votes : 1,
    votedBy: Array.isArray(raw.votedBy)
      ? raw.votedBy.filter((item): item is string => typeof item === "string")
      : [],
    status:
      raw.status === "playing" || raw.status === "played" || raw.status === "skipped"
        ? raw.status
        : "queued",
    addedAt: toMillis(raw.addedAt),
    priority: typeof raw.priority === "number" ? raw.priority : 0,
  };
}

export function createFirebaseStore(): RoomStore {
  const { auth, db } = getFirebaseServices();
  let authPromise: Promise<string> | null = null;

  const ensureAuth = async (): Promise<string> => {
    if (auth.currentUser?.uid) {
      return auth.currentUser.uid;
    }
    if (!authPromise) {
      authPromise = signInAnonymously(auth)
        .then((cred) => cred.user.uid)
        .catch(() => getGuestId());
    }
    return authPromise;
  };

  const ensureRoomDoc = async (roomId: string) => {
    const roomRef = doc(db, "rooms", roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
      await setDoc(roomRef, DEFAULT_ROOM_STATE);
    }
    return roomRef;
  };

  return {
    mode: "firebase",
    ensureAuth,

    subscribe(roomId, onUpdate, onError) {
      let active = true;
      let latestRoom: RoomState = { ...DEFAULT_ROOM_STATE };
      let latestQueue: QueueTrack[] = [];
      let unsubRoom: (() => void) | null = null;
      let unsubQueue: (() => void) | null = null;

      const emit = () => {
        if (!active) return;
        const snapshot: RoomSnapshot = {
          room: latestRoom,
          queue: latestQueue,
        };
        onUpdate(snapshot);
      };

      void (async () => {
        try {
          await ensureAuth();
          if (!active) return;

          const roomRef = await ensureRoomDoc(roomId);
          if (!active) return;

          unsubRoom = onSnapshot(
            roomRef,
            (snap) => {
              latestRoom = normalizeRoomState(snap.data() as Record<string, unknown> | undefined);
              emit();
            },
            (err) => onError(err)
          );

          const queueQuery = query(
            collection(db, "rooms", roomId, "queue"),
            where("status", "==", "queued")
          );

          unsubQueue = onSnapshot(
            queueQuery,
            (snap) => {
              latestQueue = snap.docs.map((d) =>
                normalizeQueueTrack(d.id, d.data() as Record<string, unknown>)
              );
              emit();
            },
            (err) => onError(err)
          );
        } catch (err) {
          if (active) {
            onError(err instanceof Error ? err : new Error("Failed to connect to Firestore"));
          }
        }
      })();

      return () => {
        active = false;
        unsubRoom?.();
        unsubQueue?.();
      };
    },

    async addTrack(roomId, track): Promise<AddTrackResult> {
      await ensureAuth();
      const roomRef = await ensureRoomDoc(roomId);
      const roomSnap = await getDoc(roomRef);
      const room = normalizeRoomState(roomSnap.data() as Record<string, unknown> | undefined);

      if (room.requestsLocked) {
        return { ok: false, reason: "locked" };
      }

      const queuedSnap = await getDocs(
        query(collection(db, "rooms", roomId, "queue"), where("status", "==", "queued"))
      );
      const queuedTracks = queuedSnap.docs.map((d) =>
        normalizeQueueTrack(d.id, d.data() as Record<string, unknown>)
      );

      const isDuplicate =
        room.currentTrack?.videoId === track.videoId ||
        queuedTracks.some((item) => item.videoId === track.videoId);
      if (isDuplicate) {
        return { ok: false, reason: "duplicate" };
      }

      const userActiveCount = queuedTracks.filter((item) => item.guestId === track.guestId).length;
      if (userActiveCount >= room.maxPerUser) {
        return { ok: false, reason: "limit", maxPerUser: room.maxPerUser };
      }

      const docRef = await addDoc(collection(db, "rooms", roomId, "queue"), {
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
        addedAt: serverTimestamp(),
      });

      return { ok: true, trackId: docRef.id };
    },

    async toggleVote(roomId, trackId, guestId) {
      await ensureAuth();
      const trackRef = doc(db, "rooms", roomId, "queue", trackId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(trackRef);
        if (!snap.exists()) return;

        const track = normalizeQueueTrack(snap.id, snap.data() as Record<string, unknown>);
        const hasVoted = track.votedBy.includes(guestId);
        const nextVotedBy = hasVoted
          ? track.votedBy.filter((id) => id !== guestId)
          : [...track.votedBy, guestId];

        tx.update(trackRef, {
          votedBy: nextVotedBy,
          votes: nextVotedBy.length,
        });
      });
    },

    async removeTrack(roomId, trackId) {
      await ensureAuth();
      await updateDoc(doc(db, "rooms", roomId, "queue", trackId), {
        status: "skipped",
      });
    },

    async moveTrackToTop(roomId, trackId) {
      await ensureAuth();
      await updateDoc(doc(db, "rooms", roomId, "queue", trackId), {
        priority: Date.now(),
      });
    },

    async clearQueue(roomId) {
      await ensureAuth();
      const queuedSnap = await getDocs(
        query(collection(db, "rooms", roomId, "queue"), where("status", "==", "queued"))
      );
      if (queuedSnap.empty) return;

      const batch = writeBatch(db);
      queuedSnap.docs.forEach((item) => {
        batch.update(item.ref, { status: "skipped" });
      });
      await batch.commit();
    },

    async updateRoomSettings(roomId, patch) {
      await ensureAuth();
      const roomRef = await ensureRoomDoc(roomId);
      await updateDoc(roomRef, patch);
    },

    async advanceQueue(roomId, currentTrackId, reason) {
      await ensureAuth();
      const roomRef = doc(db, "rooms", roomId);

      // Query queued candidates outside transaction, then validate & promote inside transaction
      const queuedSnap = await getDocs(
        query(collection(db, "rooms", roomId, "queue"), where("status", "==", "queued"))
      );
      const candidates = queuedSnap.docs.map((d) =>
        normalizeQueueTrack(d.id, d.data() as Record<string, unknown>)
      );

      return runTransaction(db, async (tx) => {
        const roomSnap = await tx.get(roomRef);
        const room = normalizeRoomState(roomSnap.data() as Record<string, unknown> | undefined);

        // Guard against duplicate skip/end triggers from multiple listeners
        if (currentTrackId && room.currentTrack && room.currentTrack.id !== currentTrackId) {
          return room.currentTrack;
        }

        if (currentTrackId) {
          const prevTrackRef = doc(db, "rooms", roomId, "queue", currentTrackId);
          const prevSnap = await tx.get(prevTrackRef);
          if (prevSnap.exists()) {
            tx.update(prevTrackRef, { status: reason });
          }
        }

        const sorted = sortQueue(
          candidates.filter((item) => item.id !== currentTrackId),
          room.sortMode
        );

        let nextCurrent: CurrentTrack | null = null;
        for (const candidate of sorted) {
          const candRef = doc(db, "rooms", roomId, "queue", candidate.id);
          const candSnap = await tx.get(candRef);
          if (candSnap.exists() && candSnap.data().status === "queued") {
            tx.update(candRef, { status: "playing" });
            nextCurrent = {
              id: candidate.id,
              videoId: candidate.videoId,
              title: candidate.title,
              thumbnail: candidate.thumbnail,
              channelTitle: candidate.channelTitle,
              requestedBy: candidate.requestedBy,
              addedAt: candidate.addedAt,
            };
            break;
          }
        }

        tx.set(
          roomRef,
          {
            ...room,
            currentTrack: nextCurrent,
            isPlaying: Boolean(nextCurrent),
            playbackPosition: 0,
            playbackDuration: 0,
            playbackUpdatedAt: Date.now(),
          },
          { merge: true }
        );

        return nextCurrent;
      });
    },

    async seedDemoTracks(roomId, guestId) {
      await ensureAuth();
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
