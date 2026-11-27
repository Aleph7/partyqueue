import { useCallback, useEffect, useState, type RefObject } from "react";

interface WebKitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
}

interface WebKitHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  const doc = document as WebKitDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function useFullscreen(targetRef?: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isSupported =
    typeof document !== "undefined" &&
    Boolean(
      document.fullscreenEnabled ||
        (document as WebKitDocument).webkitFullscreenEnabled ||
        document.documentElement.requestFullscreen ||
        (document.documentElement as WebKitHTMLElement).webkitRequestFullscreen
    );

  const syncState = useCallback(() => {
    const active = getFullscreenElement();
    if (targetRef) {
      setIsFullscreen(Boolean(targetRef.current && active === targetRef.current));
    } else {
      setIsFullscreen(Boolean(active));
    }
  }, [targetRef]);

  useEffect(() => {
    syncState();
    document.addEventListener("fullscreenchange", syncState);
    document.addEventListener("webkitfullscreenchange", syncState);
    return () => {
      document.removeEventListener("fullscreenchange", syncState);
      document.removeEventListener("webkitfullscreenchange", syncState);
    };
  }, [syncState]);

  const enterFullscreen = useCallback(async () => {
    const target = (targetRef?.current ?? document.documentElement) as WebKitHTMLElement | null;
    if (!target) return;
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        await target.webkitRequestFullscreen();
      }
    } catch {
      // Ignore user-gesture or browser policy rejections
    }
  }, [targetRef]);

  const exitFullscreen = useCallback(async () => {
    const doc = document as WebKitDocument;
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
    } catch {
      // Ignore exit errors
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const active = getFullscreenElement();
    const isTargetActive = targetRef
      ? Boolean(targetRef.current && active === targetRef.current)
      : Boolean(active);

    if (isTargetActive) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, targetRef]);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
