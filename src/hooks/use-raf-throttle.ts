"use client";

import { useCallback, useEffect, useRef } from "react";

export function useRafThrottle<T extends (...args: never[]) => void>(callback: T): T {
  const tickingRef = useRef(false);
  const savedCallback = useRef(callback);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    pendingArgsRef.current = args;
    if (tickingRef.current) return;
    tickingRef.current = true;
    window.requestAnimationFrame(() => {
      tickingRef.current = false;
      const pending = pendingArgsRef.current;
      pendingArgsRef.current = null;
      if (pending) savedCallback.current(...pending);
    });
  }, []) as T;
}
