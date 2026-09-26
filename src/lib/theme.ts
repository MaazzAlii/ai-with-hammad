export type Theme = "light" | "dark";

/** Browser chrome colour per theme (matches --color-bg). */
export const THEME_COLORS: Record<Theme, string> = { light: "#f2f3f6", dark: "#05090e" };

/** Runs in <head> before first paint (root layout) so a saved dark choice never flashes light. */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("theme")==="dark"){document.documentElement.dataset.theme="dark";var m=document.querySelector('meta[name="theme-color"]');if(m)m.content="${THEME_COLORS.dark}"}}catch(e){}`;
