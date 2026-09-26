"use client";

import { ArrowUp, Bot, Mic, Square, Volume2, VolumeX, X } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { AssistantLeadForm, type ChatMessage } from "./lead-form";
import { createRecognition, recognitionSupported, speak, speechSupported, stopSpeaking, type Recognition } from "./voice";

const LEAD_MARKER = "[[LEAD_FORM]]";
const SUGGESTIONS = ["What do you build?", "How do we start a project?", "Can brands sponsor your content?"];

/** Render assistant text with https links made clickable (nothing else is interpreted). */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https:\/\//.test(p) ? (
          <a key={i} href={p} className="break-all font-medium text-accent underline underline-offset-2" {...(p.startsWith(window.location.origin) ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
            {p.replace(/^https:\/\/(www\.)?/, "")}
          </a>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * Site assistant: a floating "Ask us" button that opens a chat panel (bottom sheet on phones).
 * Type or talk — replies stream in and can be read aloud. Interested visitors get a short
 * lead form that files an inquiry. Answers come only from published site content (server).
 */
export function Assistant({ greeting, siteName, hasWhatsapp }: { greeting: string; siteName: string; hasWhatsapp: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadDone, setLeadDone] = useState<string | null>(null);
  const [speakOn, setSpeakOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [voiceIn, setVoiceIn] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognition = useRef<Recognition | null>(null);
  const handsFreeRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    const t = setTimeout(() => {
      setVoiceIn(recognitionSupported());
      setVoiceOut(speechSupported());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, leadOpen, leadDone, busy]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close is stable enough for this listener
  }, [open]);

  const stopListening = useCallback(() => {
    recognition.current?.abort();
    recognition.current = null;
    setListening(false);
  }, []);

  const close = () => {
    setOpen(false);
    handsFreeRef.current = false;
    setHandsFree(false);
    stopListening();
    stopSpeaking();
  };

  const startListening = useCallback(() => {
    stopSpeaking();
    const r = createRecognition({
      onInterim: (t) => setInput(t),
      onFinal: (t) => {
        setInput("");
        if (t) void send(t);
      },
      onError: (e) => {
        if (e === "not-allowed" || e === "service-not-allowed") setError("Microphone access is blocked. Allow it in your browser, or type instead.");
        else if (e !== "no-speech" && e !== "aborted") setError("I couldn't hear that — please try again or type.");
        handsFreeRef.current = false;
        setHandsFree(false);
      },
      onEnd: () => setListening(false),
    });
    if (!r) return;
    recognition.current = r;
    setError(null);
    setListening(true);
    r.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send reads refs
  }, []);

  async function send(text: string) {
    const content = text.trim().slice(0, 1500);
    if (!content || busy) return;
    setError(null);
    setInput("");
    const history: ChatMessage[] = [...messagesRef.current, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    let reply = "";
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.content.replace(LEAD_MARKER, "").trim() || "…" })).slice(-12) }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "The assistant is unavailable right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const shown = reply;
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: shown }]);
      }
      if (!reply.trim()) throw new Error("No reply — please try again.");
      if (reply.includes(LEAD_MARKER)) setLeadOpen(true);
      if (speakOn) speak(reply, () => handsFreeRef.current && startListening());
      else if (handsFreeRef.current) startListening();
    } catch (e) {
      setMessages((m) => (m.at(-1)?.role === "assistant" && !m.at(-1)?.content ? m.slice(0, -1) : m));
      setError(e instanceof Error ? e.message : "Something went wrong.");
      handsFreeRef.current = false;
      setHandsFree(false);
    } finally {
      setBusy(false);
    }
  }

  const toggleMic = () => {
    if (listening || handsFree) {
      handsFreeRef.current = false;
      setHandsFree(false);
      stopListening();
      stopSpeaking();
      return;
    }
    // Talking to the assistant implies hearing it back: hands-free conversation until stopped.
    handsFreeRef.current = true;
    setHandsFree(true);
    if (voiceOut) setSpeakOn(true);
    startListening();
  };

  const bottom = hasWhatsapp ? "bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.75rem)] lg:bottom-[5.25rem]" : "bottom-[max(1rem,env(safe-area-inset-bottom))] lg:bottom-6";

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn("no-print glass-float pressable fixed right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full pr-4 pl-1.5 text-sm font-medium text-fg hover:scale-[1.03] lg:right-6", bottom)}
        >
          <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]">
            <Bot aria-hidden className="size-[1.1rem]" />
          </span>
          Ask us
        </button>
      ) : null}

      {open ? (
        <section
          role="dialog"
          aria-label={`Chat with ${siteName}`}
          className={cn(
            "no-print glass-sheet fixed z-50 flex flex-col overflow-hidden motion-safe:animate-[drop-in_320ms_var(--ease-spring)]",
            "inset-x-2 bottom-2 h-[min(85dvh,40rem)] rounded-[1.75rem]",
            "sm:inset-x-auto sm:right-4 sm:w-[25rem] lg:right-6 lg:bottom-6",
          )}
        >
          <header className="flex items-center gap-3 border-b border-(--glass-line) px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-accent text-accent-fg">
              <Bot aria-hidden className="size-[1.1rem]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-tight">Ask {siteName}</p>
              <p className="truncate text-xs text-subtle">AI assistant · can make mistakes</p>
            </div>
            {voiceOut ? (
              <button
                type="button"
                onClick={() => {
                  if (speakOn) stopSpeaking();
                  setSpeakOn((v) => !v);
                }}
                aria-pressed={speakOn}
                aria-label={speakOn ? "Stop reading replies aloud" : "Read replies aloud"}
                title={speakOn ? "Voice replies on" : "Voice replies off"}
                className={cn("pressable grid size-9 place-items-center rounded-full", speakOn ? "bg-accent-soft text-accent" : "text-muted hover:bg-fg/[0.05]")}
              >
                {speakOn ? <Volume2 aria-hidden className="size-4" /> : <VolumeX aria-hidden className="size-4" />}
              </button>
            ) : null}
            <button type="button" onClick={close} aria-label="Close chat" className="pressable grid size-9 place-items-center rounded-full text-muted hover:bg-fg/[0.05]">
              <X aria-hidden className="size-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
            <p className="glass-card max-w-[85%] rounded-[1.25rem] rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed">{greeting}</p>
            {!messages.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} className="pressable rounded-full bg-fg/[0.05] px-3 py-1.5 text-xs text-fg hover:bg-fg/[0.08]">
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <p key={i} className="ml-auto max-w-[85%] rounded-[1.25rem] rounded-br-md bg-accent px-3.5 py-2.5 text-sm leading-relaxed text-accent-fg">
                  {m.content}
                </p>
              ) : (
                <p key={i} className="glass-card max-w-[85%] rounded-[1.25rem] rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                  {m.content ? (
                    <Linkified text={m.content.replace(LEAD_MARKER, "").trim()} />
                  ) : (
                    <span className="inline-flex gap-1 py-1" aria-label="Typing">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="size-1.5 rounded-full bg-subtle motion-safe:animate-[breathe_1s_ease-in-out_infinite]" style={{ animationDelay: `${d * 150}ms` }} />
                      ))}
                    </span>
                  )}
                </p>
              ),
            )}
            {leadDone ? (
              <p className="rounded-[1.25rem] bg-success-soft px-3.5 py-2.5 text-sm text-fg">{leadDone}</p>
            ) : leadOpen ? (
              <AssistantLeadForm
                messages={messages}
                onDone={(msg) => {
                  setLeadDone(msg);
                  setLeadOpen(false);
                }}
              />
            ) : messages.length >= 2 ? (
              <button type="button" onClick={() => setLeadOpen(true)} className="text-xs font-medium text-accent hover:underline">
                Want the team to follow up? Share your details
              </button>
            ) : null}
            {error ? <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs text-fg">{error}</p> : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2 border-t border-(--glass-line) p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Message
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              maxLength={1500}
              placeholder={listening ? "Listening…" : "Ask a question…"}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-[1.25rem] bg-fg/[0.045] px-4 py-3 text-sm text-fg shadow-[inset_0_0_0_1px_var(--glass-line)] placeholder:text-subtle focus-visible:bg-surface focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent),0_0_0_4px_var(--color-accent-soft)] focus-visible:outline-none"
            />
            {voiceIn ? (
              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={listening || handsFree}
                aria-label={listening || handsFree ? "Stop voice conversation" : "Talk to the assistant"}
                title={listening || handsFree ? "Stop" : "Talk"}
                className={cn(
                  "pressable relative grid size-11 shrink-0 place-items-center rounded-full",
                  listening ? "bg-danger text-white dark:text-bg" : handsFree ? "bg-accent-soft text-accent" : "bg-fg/[0.06] text-fg hover:bg-fg/[0.09]",
                )}
              >
                {listening ? <span aria-hidden className="absolute inset-0 rounded-full bg-danger/40 motion-safe:animate-ping" /> : null}
                {listening || handsFree ? <Square aria-hidden className="relative size-4 fill-current" /> : <Mic aria-hidden className="size-[1.1rem]" />}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="pressable grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg disabled:opacity-40"
            >
              <ArrowUp aria-hidden className="size-[1.1rem]" />
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
