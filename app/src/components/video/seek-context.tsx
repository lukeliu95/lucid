"use client";

import * as React from "react";

type SeekFn = (sec: number) => void;

type SeekContextValue = {
  /** Player registers its seek implementation (or null to clear on unmount). */
  register: (fn: SeekFn | null) => void;
  /** Anything (e.g. the timeline) requests a seek to `sec` seconds. */
  seek: SeekFn;
};

const SeekContext = React.createContext<SeekContextValue | null>(null);

/**
 * Bridges the (top-of-page) video player and the (sidebar) timeline so a
 * timeline click can drive the player's playback position. They live in
 * separate DOM subtrees, so a ref-backed context is the cleanest channel.
 */
export function SeekProvider({ children }: { children: React.ReactNode }) {
  const fnRef = React.useRef<SeekFn | null>(null);

  const register = React.useCallback((fn: SeekFn | null) => {
    fnRef.current = fn;
  }, []);

  const seek = React.useCallback((sec: number) => {
    fnRef.current?.(sec);
  }, []);

  const value = React.useMemo<SeekContextValue>(() => ({ register, seek }), [register, seek]);

  return <SeekContext.Provider value={value}>{children}</SeekContext.Provider>;
}

export function useSeekRegister(): SeekContextValue["register"] {
  return React.useContext(SeekContext)?.register ?? (() => {});
}

export function useSeek(): SeekFn {
  return React.useContext(SeekContext)?.seek ?? (() => {});
}
