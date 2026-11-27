import type { QueueTrack, SortMode } from "../types/jukebox";

export function sortQueue(tracks: QueueTrack[], sortMode: SortMode): QueueTrack[] {
  return [...tracks].sort((a, b) => {
    const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    if (sortMode === "votes") {
      const voteDiff = b.votes - a.votes;
      if (voteDiff !== 0) {
        return voteDiff;
      }
    }

    return a.addedAt - b.addedAt;
  });
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
