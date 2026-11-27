import { useCallback, useEffect, useRef, useState } from "react";

let apiPromise: Promise<typeof YT> | null = null;

function loadYouTubeIframeApi(): Promise<typeof YT> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window unavailable"));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (apiPromise) {
    return apiPromise;
  }

  apiPromise = new Promise<typeof YT>((resolve, reject) => {
    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      existingCallback?.();
      if (window.YT) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube IFrame API failed to initialize"));
      }
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => reject(new Error("Failed to load YouTube IFrame API script"));
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}

interface UseYouTubePlayerOptions {
  onEnded?: () => void;
  onError?: (errorCode: number) => void;
  onPlaybackChange?: (isPlaying: boolean) => void;
}

export function useYouTubePlayer(options: UseYouTubePlayerOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);

  const onEndedRef = useRef(options.onEnded);
  const onErrorRef = useRef(options.onError);
  const onPlaybackChangeRef = useRef(options.onPlaybackChange);

  useEffect(() => {
    onEndedRef.current = options.onEnded;
    onErrorRef.current = options.onError;
    onPlaybackChangeRef.current = options.onPlaybackChange;
  }, [options.onEnded, options.onError, options.onPlaybackChange]);

  const [isReady, setIsReady] = useState(false);
  const [playerState, setPlayerState] = useState<number>(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);

  useEffect(() => {
    let mounted = true;
    let autoplayCheckTimer: number | null = null;

    void loadYouTubeIframeApi().then((YT) => {
      if (!mounted || !containerRef.current) {
        return;
      }

      // Mount inside a child div so React never tries to reconcile iframe mutations directly
      const mountEl = document.createElement("div");
      mountEl.style.width = "100%";
      mountEl.style.height = "100%";
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(mountEl);

      const player = new YT.Player(mountEl, {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (!mounted) return;
            playerRef.current = event.target;
            setIsReady(true);
            setVolumeState(event.target.getVolume?.() ?? 100);
            setIsMuted(event.target.isMuted?.() ?? false);
          },
          onStateChange: (event) => {
            if (!mounted) return;
            const state = event.data;
            setPlayerState(state);

            if (state === YT.PlayerState.PLAYING) {
              setNeedsInteraction(false);
              if (autoplayCheckTimer) {
                window.clearTimeout(autoplayCheckTimer);
                autoplayCheckTimer = null;
              }
              setDuration(event.target.getDuration?.() ?? 0);
              onPlaybackChangeRef.current?.(true);
            } else if (state === YT.PlayerState.PAUSED) {
              onPlaybackChangeRef.current?.(false);
            } else if (state === YT.PlayerState.ENDED) {
              onPlaybackChangeRef.current?.(false);
              onEndedRef.current?.();
            } else if (state === YT.PlayerState.CUED || state === YT.PlayerState.UNSTARTED) {
              if (loadedVideoIdRef.current) {
                autoplayCheckTimer = window.setTimeout(() => {
                  const current = playerRef.current?.getPlayerState?.();
                  if (
                    mounted &&
                    current !== YT.PlayerState.PLAYING &&
                    current !== YT.PlayerState.BUFFERING
                  ) {
                    setNeedsInteraction(true);
                  }
                }, 1400);
              }
            }
          },
          onError: (event) => {
            if (!mounted) return;
            onErrorRef.current?.(event.data);
          },
        },
      });

      playerRef.current = player;
    });

    return () => {
      mounted = false;
      if (autoplayCheckTimer) {
        window.clearTimeout(autoplayCheckTimer);
      }
      try {
        playerRef.current?.destroy();
      } catch {
        // Ignore cleanup failures
      }
      playerRef.current = null;
      loadedVideoIdRef.current = null;
      setIsReady(false);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || !isReady) return;
      try {
        const time = player.getCurrentTime?.() ?? 0;
        const dur = player.getDuration?.() ?? 0;
        setCurrentTime(time);
        if (dur > 0) {
          setDuration(dur);
        }
      } catch {
        // Ignore transient player reads
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [isReady]);

  const loadVideo = useCallback(
    (videoId: string, shouldPlay = true) => {
      const player = playerRef.current;
      if (!player || !isReady) return;

      loadedVideoIdRef.current = videoId;
      setCurrentTime(0);
      setDuration(0);
      setNeedsInteraction(false);

      if (shouldPlay) {
        player.loadVideoById(videoId, 0);
      } else {
        player.cueVideoById(videoId, 0);
      }
    },
    [isReady]
  );

  const play = useCallback(() => {
    const player = playerRef.current;
    if (!player || !isReady) return;
    setNeedsInteraction(false);
    player.playVideo();
  }, [isReady]);

  const pause = useCallback(() => {
    const player = playerRef.current;
    if (!player || !isReady) return;
    player.pauseVideo();
  }, [isReady]);

  const stopVideo = useCallback(() => {
    const player = playerRef.current;
    loadedVideoIdRef.current = null;
    setCurrentTime(0);
    setDuration(0);
    setNeedsInteraction(false);
    if (!player || !isReady) return;
    player.stopVideo();
  }, [isReady]);

  const seekTo = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player || !isReady) return;
      player.seekTo(seconds, true);
      setCurrentTime(seconds);
    },
    [isReady]
  );

  const setVolume = useCallback(
    (nextVolume: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(nextVolume)));
      setVolumeState(clamped);
      const player = playerRef.current;
      if (!player || !isReady) return;
      if (clamped > 0 && player.isMuted?.()) {
        player.unMute();
        setIsMuted(false);
      }
      player.setVolume(clamped);
    },
    [isReady]
  );

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player || !isReady) return;
    if (player.isMuted()) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  }, [isReady]);

  return {
    containerRef,
    isReady,
    playerState,
    currentTime,
    duration,
    volume,
    isMuted,
    needsInteraction,
    loadVideo,
    play,
    pause,
    stopVideo,
    seekTo,
    setVolume,
    toggleMute,
  };
}
