"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { THEME_COLORS, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { buttonVariants } from "./button";

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"),
    () => "light",
  );
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Private mode / blocked storage: the choice just won't persist.
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

/** Light ↔ dark switch. Same button in both themes; icons cross-fade and rotate. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative overflow-hidden", className)}
    >
      <Sun aria-hidden className={cn("absolute transition-[opacity,rotate,scale] duration-(--duration-slow) ease-spring", dark ? "scale-50 rotate-90 opacity-0" : "opacity-100")} />
      <Moon aria-hidden className={cn("absolute transition-[opacity,rotate,scale] duration-(--duration-slow) ease-spring", dark ? "opacity-100" : "scale-50 -rotate-90 opacity-0")} />
    </button>
  );
}
