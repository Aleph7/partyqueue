import type { CurrentTrack, NewTrackInput, QueueTrack, RoomState } from "../types/jukebox";
import { isFirebaseConfigured } from "./firebaseConfig";
import { createFirebaseStore } from "./firebaseStore";
import { createLocalDemoStore } from "./localStore";

export type AddTrackResult =
  | { ok: true; trackId: string }
  | { ok: false; reason: "locked" | "limit" | "duplicate"; maxPerUser?: number };

export interface RoomSnapshot {
  room: RoomState;
  queue: QueueTrack[];
}

export interface RoomStore {
  mode: "firebase" | "demo";
  ensureAuth: () => Promise<string>;
  subscribe: (
    roomId: string,
    onUpdate: (snapshot: RoomSnapshot) => void,
    onError: (error: Error) => void
  ) => () => void;
  addTrack: (roomId: string, track: NewTrackInput) => Promise<AddTrackResult>;
  toggleVote: (roomId: string, trackId: string, guestId: string) => Promise<void>;
  removeTrack: (roomId: string, trackId: string) => Promise<void>;
  moveTrackToTop: (roomId: string, trackId: string) => Promise<void>;
  clearQueue: (roomId: string) => Promise<void>;
  updateRoomSettings: (roomId: string, patch: Partial<RoomState>) => Promise<void>;
  advanceQueue: (
    roomId: string,
    currentTrackId: string | null,
    reason: "played" | "skipped"
  ) => Promise<CurrentTrack | null>;
  seedDemoTracks: (roomId: string, guestId: string) => Promise<void>;
}

export const DEFAULT_ROOM_STATE: RoomState = {
  isPlaying: false,
  sortMode: "fifo",
  requestsLocked: false,
  maxPerUser: 3,
  currentTrack: null,
};

let singletonStore: RoomStore | null = null;

export function getRoomStore(): RoomStore {
  if (singletonStore) {
    return singletonStore;
  }

  const forceDemo =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1";

  if (isFirebaseConfigured && !forceDemo) {
    singletonStore = createFirebaseStore();
  } else {
    singletonStore = createLocalDemoStore();
  }

  return singletonStore;
}
