import { useEffect, useState, useCallback } from "react";

export type ScrollyConfig = {
  frameCount: number;
  zoomFactor: number;
  scrollMultiplier: number; // higher = finish animation sooner relative to scroll
  eagerCount: number; // frames preloaded before ready
};

export const DEFAULT_CONFIG: ScrollyConfig = {
  frameCount: 181,
  zoomFactor: 1.35,
  scrollMultiplier: 1,
  eagerCount: 30,
};

const KEY = "veil.scrolly.config.v1";
const EVT = "veil:scrolly-config-change";

function read(): ScrollyConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useScrollyConfig() {
  const [config, setConfig] = useState<ScrollyConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setConfig(read());
    const onChange = () => setConfig(read());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = useCallback((patch: Partial<ScrollyConfig>) => {
    const next = { ...read(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVT));
    setConfig(next);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVT));
    setConfig(DEFAULT_CONFIG);
  }, []);

  return { config, update, reset };
}
