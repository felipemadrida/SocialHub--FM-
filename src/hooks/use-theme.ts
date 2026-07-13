"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "socialhub-theme";

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.style.colorScheme = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return "dark";
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mode = readStoredTheme();
    applyTheme(mode);
    setThemeState(mode);
    setReady(true);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    applyTheme(mode);
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return { theme, setTheme, toggleTheme, ready };
}
