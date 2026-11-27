export type SortMode = "fifo" | "votes";

export type TrackStatus = "queued" | "playing" | "played" | "skipped";

export interface CurrentTrack {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  requestedBy: string;
  addedAt: number;
}

export interface RoomState {
  isPlaying: boolean;
  sortMode: SortMode;
  requestsLocked: boolean;
  maxPerUser: number;
  currentTrack: CurrentTrack | null;
  playbackPosition?: number;
  playbackDuration?: number;
  playbackUpdatedAt?: number;
}

export interface QueueTrack {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  requestedBy: string;
  guestId: string;
  votes: number;
  votedBy: string[];
  status: TrackStatus;
  addedAt: number;
  priority?: number;
}

export interface NewTrackInput {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  requestedBy: string;
  guestId: string;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}
