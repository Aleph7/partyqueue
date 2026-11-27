import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_ROOM_STATE, getRoomStore, type AddTrackResult } from "../services/roomStore";
import type { CurrentTrack, NewTrackInput, QueueTrack, RoomState } from "../types/jukebox";
import { getGuestId } from "../utils/guestIdentity";
import { sortQueue } from "../utils/queueSort";

export function useRoom(roomId: string) {
  const store = useMemo(() => getRoomStore(), []);
  const [room, setRoom] = useState<RoomState>({ ...DEFAULT_ROOM_STATE });
  const [rawQueue, setRawQueue] = useState<QueueTrack[]>([]);
  const [guestId, setGuestId] = useState<string>(() => getGuestId());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    void store.ensureAuth().then((uid) => {
      if (active && uid) {
        setGuestId(uid);
      }
    });

    const unsubscribe = store.subscribe(
      roomId,
      (snapshot) => {
        if (!active) return;
        setRoom(snapshot.room);
        setRawQueue(snapshot.queue);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        if (!active) return;
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [roomId, store]);

  const sortedQueue = useMemo(
    () => sortQueue(rawQueue, room.sortMode),
    [rawQueue, room.sortMode]
  );

  const addTrack = useCallback(
    (track: Omit<NewTrackInput, "guestId">): Promise<AddTrackResult> =>
      store.addTrack(roomId, { ...track, guestId }),
    [guestId, roomId, store]
  );

  const toggleVote = useCallback(
    (trackId: string) => store.toggleVote(roomId, trackId, guestId),
    [guestId, roomId, store]
  );

  const removeTrack = useCallback(
    (trackId: string) => store.removeTrack(roomId, trackId),
    [roomId, store]
  );

  const moveTrackToTop = useCallback(
    (trackId: string) => store.moveTrackToTop(roomId, trackId),
    [roomId, store]
  );

  const clearQueue = useCallback(() => store.clearQueue(roomId), [roomId, store]);

  const updateRoomSettings = useCallback(
    (patch: Partial<RoomState>) => store.updateRoomSettings(roomId, patch),
    [roomId, store]
  );

  const advanceQueue = useCallback(
    (currentTrackId: string | null, reason: "played" | "skipped"): Promise<CurrentTrack | null> =>
      store.advanceQueue(roomId, currentTrackId, reason),
    [roomId, store]
  );

  const seedDemoTracks = useCallback(
    () => store.seedDemoTracks(roomId, guestId),
    [guestId, roomId, store]
  );

  return {
    room,
    sortedQueue,
    mode: store.mode,
    guestId,
    isLoading,
    error,
    addTrack,
    toggleVote,
    removeTrack,
    moveTrackToTop,
    clearQueue,
    updateRoomSettings,
    advanceQueue,
    seedDemoTracks,
  };
}
