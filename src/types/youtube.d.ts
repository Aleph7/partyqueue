export {};

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }

  namespace YT {
    enum PlayerState {
      UNSTARTED = -1,
      ENDED = 0,
      PLAYING = 1,
      PAUSED = 2,
      BUFFERING = 3,
      CUED = 5,
    }

    interface PlayerOptions {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: {
        autoplay?: 0 | 1;
        controls?: 0 | 1;
        disablekb?: 0 | 1;
        enablejsapi?: 0 | 1;
        fs?: 0 | 1;
        modestbranding?: 0 | 1;
        origin?: string;
        playsinline?: 0 | 1;
        rel?: 0 | 1;
      };
      events?: {
        onReady?: (event: PlayerEvent) => void;
        onStateChange?: (event: OnStateChangeEvent) => void;
        onError?: (event: OnErrorEvent) => void;
      };
    }

    interface PlayerEvent {
      target: Player;
    }

    interface OnStateChangeEvent {
      target: Player;
      data: PlayerState;
    }

    interface OnErrorEvent {
      target: Player;
      data: number;
    }

    class Player {
      constructor(element: HTMLElement | string, options: PlayerOptions);
      loadVideoById(videoId: string, startSeconds?: number): void;
      cueVideoById(videoId: string, startSeconds?: number): void;
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      seekTo(seconds: number, allowSeekAhead?: boolean): void;
      setVolume(volume: number): void;
      getVolume(): number;
      mute(): void;
      unMute(): void;
      isMuted(): boolean;
      getCurrentTime(): number;
      getDuration(): number;
      getPlayerState(): PlayerState;
      destroy(): void;
    }
  }
}
