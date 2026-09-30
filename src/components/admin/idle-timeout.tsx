"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WARN_AFTER_MS = 25 * 60 * 1000;
const SIGNOUT_AFTER_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

/** Only runs when the person unchecked "keep me signed in" at login (see the `aiwh_idle` cookie). */
function idleTimeoutEnabled(): boolean {
  return document.cookie.split("; ").some((c) => c === "aiwh_idle=1");
}

/** Signs the admin out after a period of inactivity, with a warning first. Opt-in via the login form. */
export function IdleTimeout() {
  const [warn, setWarn] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const signOutTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reset = useRef(() => {});

  useEffect(() => {
    if (!idleTimeoutEnabled()) return;
    reset.current = () => {
      setWarn(false);
      clearTimeout(warnTimer.current);
      clearTimeout(signOutTimer.current);
      warnTimer.current = setTimeout(() => setWarn(true), WARN_AFTER_MS);
      signOutTimer.current = setTimeout(() => formRef.current?.requestSubmit(), SIGNOUT_AFTER_MS);
    };
    reset.current();
    const onActivity = () => reset.current();
    for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, onActivity, { passive: true });
    return () => {
      clearTimeout(warnTimer.current);
      clearTimeout(signOutTimer.current);
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, onActivity);
    };
  }, []);

  return (
    <>
      <form ref={formRef} action="/auth/signout" method="post" className="hidden" />
      <Dialog open={warn} onOpenChange={setWarn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Still there?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>You&apos;ll be signed out in a few minutes due to inactivity.</DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button type="button" onClick={() => reset.current()}>Stay signed in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
