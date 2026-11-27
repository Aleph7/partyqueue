import { useEffect } from "react";
import type { CurrentTrack } from "../types/jukebox";

interface UseMediaSessionOptions {
  currentTrack: CurrentTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNextTrack: () => void;
  onSeekTo?: (seconds: number) => void;
}

export function useMediaSession({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNextTrack,
  onSeekTo,
}: UseMediaSessionOptions) {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    if (!currentTrack) {
      mediaSession.metadata = null;
      mediaSession.playbackState = "none";
      return;
    }

    const hqUrl = `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`;
    const maxResUrl = `https://i.ytimg.com/vi/${currentTrack.videoId}/maxresdefault.jpg`;

    if (typeof MediaMetadata !== "undefined") {
      mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: `${currentTrack.requestedBy} • ${currentTrack.channelTitle}`,
        album: "PartyQueue",
        artwork: [
          { src: hqUrl, sizes: "480x360", type: "image/jpeg" },
          { src: maxResUrl, sizes: "1280x720", type: "image/jpeg" },
        ],
      });
    }

    mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    if (
      currentTrack &&
      duration > 0 &&
      Number.isFinite(currentTime) &&
      typeof mediaSession.setPositionState === "function"
    ) {
      try {
        mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(Math.max(0, currentTime), duration),
        });
      } catch {
        // Ignore browsers that reject transient position updates
      }
    }
  }, [currentTrack, currentTime, duration]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    const safeSetHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // Ignore unsupported MediaSession actions
      }
    };

    safeSetHandler("play", () => onPlay());
    safeSetHandler("pause", () => onPause());
    safeSetHandler("nexttrack", () => onNextTrack());
    safeSetHandler("seekto", (details) => {
      if (typeof details.seekTime === "number" && onSeekTo) {
        onSeekTo(details.seekTime);
      }
    });

    return () => {
      safeSetHandler("play", null);
      safeSetHandler("pause", null);
      safeSetHandler("nexttrack", null);
      safeSetHandler("seekto", null);
    };
  }, [onPlay, onPause, onNextTrack, onSeekTo]);
}
