"use client";

import { Toaster } from "sonner";

import { useTheme } from "./theme-toggle";

/** Toasts that follow the site's theme toggle (not the OS setting). */
export function AppToaster() {
  const theme = useTheme();
  return <Toaster theme={theme} position="top-center" richColors closeButton toastOptions={{ className: "!rounded-2xl" }} />;
}
