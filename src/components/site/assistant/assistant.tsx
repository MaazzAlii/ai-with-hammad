"use client";

import { ArrowUp, Bot, ExternalLink, Mic, Pause, RotateCcw, Square, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

import { AssistantLeadForm, type ChatMessage } from "./lead-form";
import { createRecognition, recognitionSupported, speak, speechSupported, stopSpeaking, type Recognition } from "./voice";

const LEAD_MARKER = "[[LEAD_FORM]]";

function cleanAssistantText(text: string): string {
  return text
    .replace(/\[\[LEAD_FORM\]\]/g, "")
    .replace(/\$\{siteUrl\}/g, "")
    .replace(/\$\{site\}/g, "")
    .replace(/\(\/case-studies\b/g, "(/projects")
    .replace(/\(\/tutorials\b/g, "(/content")
    .trim();
}

const SUGGESTIONS = [
  "What services do you offer?",
  "What AI case studies have you built?",
  "How do we start a project?",
  "Can brands sponsor your content?",
];

export type ExtendedChatMessage = ChatMessage & {
  citations?: Array<{ title: string; url: string }>;
};

/**
 * Site assistant: a floating "Ask us" launcher that opens a native "Liquid Glass"
 * agentic RAG chat panel. Answers are strictly grounded in published website content
 * with clickable citations, voice recognition, speech synthesis, and lead capture.
 */
export function Assistant({
  greeting,
  siteName,
  hasWhatsapp,
}: {
  greeting: string;
  siteName: string;
  hasWhatsapp: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [hasLeadInvite, setHasLeadInvite] = useState(false);
  const [leadDone, setLeadDone] = useState<string | null>(null);
  const [speakOn, setSpeakOn] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [voiceIn, setVoiceIn] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognition = useRef<Recognition | null>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);
  const handsFreeRef = useRef(false);
  const messagesRef = useRef<ExtendedChatMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    const t = setTimeout(() => {
      setVoiceIn(recognitionSupported());
      const hasSpeech = speechSupported();
      setVoiceOut(hasSpeech);
      try {
        const userTurnedOn = sessionStorage.getItem("assistant_speak") === "1";
        setSpeakOn(userTurnedOn && hasSpeech);
      } catch {
        setSpeakOn(false);
      }
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
    if (recognition.current) {
      try {
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.onend = null;
        recognition.current.abort();
      } catch {
        // ignore
      }
      recognition.current = null;
    }
    setListening(false);
  }, []);

  const playMessage = (index: number, text: string) => {
    if (speakingIdx === index) {
      stopSpeaking();
      setSpeakingIdx(null);
      return;
    }
    stopSpeaking();
    setSpeakingIdx(index);
    speak(
      cleanAssistantText(text),
      () => setSpeakingIdx((cur) => (cur === index ? null : cur)),
      () => setSpeakingIdx(index),
    );
  };

  const close = () => {
    setOpen(false);
    handsFreeRef.current = false;
    setHandsFree(false);
    stopListening();
    stopSpeaking();
    setSpeakingIdx(null);
    abortCurrentRequest();
  };

  const abortCurrentRequest = () => {
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
      abortCtrlRef.current = null;
    }
  };

  const clearChat = () => {
    abortCurrentRequest();
    stopSpeaking();
    setSpeakingIdx(null);
    setMessages([]);
    setError(null);
    setLeadOpen(false);
    setHasLeadInvite(false);
    setLeadDone(null);
  };

  const startListening = useCallback(() => {
    stopSpeaking();
    setSpeakingIdx(null);
    stopListening();

    const r = createRecognition({
      onInterim: (t) => setInput(t),
      onFinal: (t) => {
        stopListening();
        setInput("");
        if (t) void send(t);
      },
      onError: (e) => {
        stopListening();
        if (e === "not-allowed" || e === "service-not-allowed") {
          setError("Microphone access is blocked. Allow it in your browser, or type instead.");
        } else if (e !== "no-speech" && e !== "aborted") {
          setError("I couldn't hear that — please try again or type.");
        }
      },
      onEnd: () => {
        stopListening();
      },
    });
    if (!r) return;
    recognition.current = r;
    setError(null);

    try {
      r.start();
      setListening(true);
    } catch (err) {
      // Mobile browsers (Android Chrome / iOS Safari) might require a brief delay to release audio
      setTimeout(() => {
        if (recognition.current !== r) return;
        try {
          r.start();
          setListening(true);
        } catch (retryErr) {
          console.warn("Speech recognition failed to start:", retryErr);
          stopListening();
          setError("Microphone was busy. Please tap again.");
        }
      }, 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send reads refs
  }, [stopListening]);

  async function send(text: string) {
    const content = text.trim().slice(0, 1500);
    if (!content) return;
    if (busy) {
      abortCurrentRequest();
    }
    stopListening();
    stopSpeaking();
    setSpeakingIdx(null);
    setError(null);
    setInput("");
    setLeadOpen(false);
    setHasLeadInvite(false);

    const history: ExtendedChatMessage[] = [...messagesRef.current, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);

    const abortCtrl = new AbortController();
    abortCtrlRef.current = abortCtrl;

    let reply = "";
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: cleanAssistantText(m.content) || "…",
          })).slice(-12),
        }),
        signal: abortCtrl.signal,
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "The assistant is unavailable right now.");
      }

      // Read citations from header
      let citations: Array<{ title: string; url: string }> = [];
      const rawCitations = res.headers.get("x-citations");
      if (rawCitations) {
        try {
          citations = JSON.parse(decodeURIComponent(rawCitations));
        } catch {
          // Ignore parse errors
        }
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const shown = reply;
        setMessages((m) => [
          ...m.slice(0, -1),
          { role: "assistant", content: shown, citations },
        ]);
      }

      if (!reply.trim()) throw new Error("No reply — please try again.");
      if (reply.includes(LEAD_MARKER)) {
        setHasLeadInvite(true);
      }
      if (speakOn) {
        const assistantIdx = history.length;
        playMessage(assistantIdx, reply);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages((m) => (m.at(-1)?.role === "assistant" && !m.at(-1)?.content ? m.slice(0, -1) : m));
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
      stopListening();
    } finally {
      setBusy(false);
      abortCtrlRef.current = null;
    }
  }

  const toggleMic = () => {
    if (listening) {
      const pending = input.trim();
      stopListening();
      if (pending) {
        setInput("");
        void send(pending);
      }
      return;
    }
    stopSpeaking();
    setSpeakingIdx(null);
    startListening();
  };

  const bottom = hasWhatsapp
    ? "bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.75rem)] lg:bottom-[5.25rem]"
    : "bottom-[max(1rem,env(safe-area-inset-bottom))] lg:bottom-6";

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn(
            "no-print glass-float pressable fixed right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full pr-4 pl-1.5 text-sm font-medium text-fg hover:scale-[1.03] lg:right-6",
            bottom,
          )}
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
            "inset-x-2 bottom-2 h-[min(88dvh,42rem)] rounded-[1.75rem] border border-(--glass-line) shadow-panel",
            "sm:inset-x-auto sm:right-4 sm:w-[26rem] lg:right-6 lg:bottom-6",
          )}
        >
          {/* Header */}
          <header className="flex items-center gap-2.5 border-b border-(--glass-line) px-4 py-3 bg-surface/50 backdrop-blur-md">
            <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-accent text-accent-fg shadow-xs">
              <Bot aria-hidden className="size-[1.1rem]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-tight text-fg">Ask {siteName}</p>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" />
                <p className="truncate text-[0.6875rem] text-subtle">AI assistant · Grounded in site data</p>
              </div>
            </div>

            {messages.length > 0 ? (
              <button
                type="button"
                onClick={clearChat}
                aria-label="Clear chat"
                title="Clear conversation"
                className="pressable grid size-8 place-items-center rounded-full text-subtle hover:bg-fg/[0.06] hover:text-fg"
              >
                <RotateCcw aria-hidden className="size-3.5" />
              </button>
            ) : null}

            {voiceOut && speakingIdx !== null ? (
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setSpeakingIdx(null);
                }}
                className="pressable flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[0.6875rem] font-medium text-accent-fg shadow-xs hover:opacity-90"
                title="Stop audio playback"
              >
                <Square aria-hidden className="size-2.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : null}

            {voiceOut ? (
              <button
                type="button"
                onClick={() => {
                  if (speakOn || speakingIdx !== null) {
                    stopSpeaking();
                    setSpeakingIdx(null);
                  }
                  setSpeakOn((v) => {
                    const next = !v;
                    try {
                      if (next) sessionStorage.setItem("assistant_speak", "1");
                      else sessionStorage.removeItem("assistant_speak");
                    } catch {
                      // ignore
                    }
                    return next;
                  });
                }}
                aria-pressed={speakOn}
                aria-label={speakOn ? "Mute voice replies" : "Enable voice replies"}
                title={speakOn ? "Voice audio replies: On (click to mute)" : "Voice audio replies: Off (click to enable speech)"}
                className={cn(
                  "pressable grid size-8 place-items-center rounded-full transition-colors",
                  speakOn ? "bg-accent-soft text-accent" : "text-subtle hover:bg-fg/[0.06] hover:text-fg",
                )}
              >
                {speakOn ? <Volume2 aria-hidden className="size-4" /> : <VolumeX aria-hidden className="size-4" />}
              </button>
            ) : null}

            <button
              type="button"
              onClick={close}
              aria-label="Close chat"
              className="pressable grid size-8 place-items-center rounded-full text-subtle hover:bg-fg/[0.06] hover:text-fg"
            >
              <X aria-hidden className="size-4" />
            </button>
          </header>

          {/* Conversation messages */}
          <div ref={listRef} className="flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
            <div className="glass-card max-w-[88%] rounded-[1.25rem] rounded-bl-md p-3.5 text-sm leading-relaxed text-fg border border-(--glass-line) space-y-2">
              <p>{greeting}</p>
              {voiceOut ? (
                <button
                  type="button"
                  onClick={() => playMessage(-1, greeting)}
                  aria-label={speakingIdx === -1 ? "Stop reading greeting" : "Listen to greeting"}
                  className={cn(
                    "pressable inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium transition-colors",
                    speakingIdx === -1
                      ? "bg-accent text-accent-fg shadow-xs"
                      : "bg-surface/75 text-subtle hover:text-fg border border-(--glass-line)",
                  )}
                >
                  {speakingIdx === -1 ? (
                    <>
                      <span className="flex items-center gap-0.5">
                        <span className="size-1 rounded-full bg-accent-fg animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-1 rounded-full bg-accent-fg animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-1 rounded-full bg-accent-fg animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      <span>Speaking…</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-3 shrink-0" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              ) : null}
            </div>

            {!messages.length ? (
              <div className="space-y-2 pt-1">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-subtle">Suggested topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="pressable rounded-full border border-(--glass-line) bg-surface/80 px-3 py-1.5 text-xs text-fg hover:border-accent/40 hover:bg-accent-soft hover:text-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-[1.25rem] rounded-br-md bg-accent px-3.5 py-2.5 text-sm leading-relaxed text-accent-fg shadow-xs"
                >
                  {m.content}
                </div>
              ) : (
                <div
                  key={i}
                  className="glass-card max-w-[90%] rounded-[1.25rem] rounded-bl-md p-3.5 text-sm leading-relaxed border border-(--glass-line) space-y-2.5"
                >
                  {m.content ? (
                    <div
                      className="prose-site text-sm text-fg space-y-1.5 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-4 [&>pre]:rounded-md [&>pre]:bg-bg [&>pre]:p-2.5 [&>pre]:text-xs [&>code]:rounded-sm [&>code]:bg-fg/[0.06] [&>code]:px-1 [&>code]:py-0.5 [&>code]:text-xs"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(cleanAssistantText(m.content)),
                      }}
                    />
                  ) : (
                    <span className="inline-flex gap-1 py-1" aria-label="Typing">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="size-1.5 rounded-full bg-subtle motion-safe:animate-[breathe_1s_ease-in-out_infinite]"
                          style={{ animationDelay: `${d * 150}ms` }}
                        />
                      ))}
                    </span>
                  )}

                  {/* Grounded Citation links */}
                  {m.citations && m.citations.length > 0 ? (
                    <div className="pt-2 border-t border-(--glass-line)/60 space-y-1.5">
                      <p className="text-[0.6875rem] font-semibold text-subtle">Sources:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.citations.map((c, ci) => (
                          <a
                            key={ci}
                            href={c.url}
                            target={c.url.startsWith("http") ? "_blank" : undefined}
                            rel={c.url.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="inline-flex items-center gap-1 rounded-md border border-(--glass-line) bg-surface/70 px-2 py-0.5 text-[0.6875rem] font-medium text-accent hover:border-accent hover:underline"
                          >
                            <span className="truncate max-w-[12rem]">{c.title}</span>
                            <ExternalLink className="size-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Audio Playback Status & Listen Button */}
                  {voiceOut && m.content ? (
                    <div className="pt-2 border-t border-(--glass-line)/50 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => playMessage(i, m.content)}
                        aria-label={speakingIdx === i ? "Stop reading reply" : "Listen to reply"}
                        className={cn(
                          "pressable inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium transition-colors",
                          speakingIdx === i
                            ? "bg-accent text-accent-fg shadow-xs"
                            : "bg-surface/75 text-subtle hover:text-fg hover:bg-surface border border-(--glass-line)",
                        )}
                      >
                        {speakingIdx === i ? (
                          <>
                            <span className="flex items-center gap-0.5">
                              <span className="size-1 rounded-full bg-accent-fg animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="size-1 rounded-full bg-accent-fg animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="size-1 rounded-full bg-accent-fg animate-bounce" style={{ animationDelay: "300ms" }} />
                            </span>
                            <span>Speaking… (tap to stop)</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="size-3 shrink-0" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>
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
                  setHasLeadInvite(false);
                }}
                onCancel={() => setLeadOpen(false)}
              />
            ) : hasLeadInvite ? (
              <div className="glass-card flex items-center justify-between gap-3 rounded-[1.25rem] border border-accent/40 bg-accent-soft/30 p-3.5 shadow-xs">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-fg">Ready to discuss your project?</p>
                  <p className="text-[0.6875rem] text-subtle">Connect directly with our team.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLeadOpen(true)}
                  className="pressable shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg shadow-xs transition-opacity hover:opacity-90"
                >
                  Share details
                </button>
              </div>
            ) : !busy && !leadDone && messages.length >= 2 ? (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setLeadOpen(true)}
                  className="text-xs font-medium text-accent hover:underline opacity-80 hover:opacity-100 transition-opacity"
                >
                  Want the team to follow up? Share your details
                </button>
              </div>
            ) : null}

            {error ? <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs text-fg">{error}</p> : null}
          </div>

          {/* Active Listening Status Bar with Pause & Send */}
          {listening ? (
            <div className="flex items-center justify-between gap-2 border-t border-danger/30 bg-danger/10 px-4 py-2.5 text-xs backdrop-blur-sm animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-danger" />
                </span>
                <span className="font-semibold text-danger">Listening:</span>
                <span className="truncate text-fg font-medium">
                  {input.trim() ? `"${input}"` : "Speak now…"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={stopListening}
                  className="pressable inline-flex items-center gap-1 rounded-full border border-(--glass-line) bg-surface px-2.5 py-1 text-xs font-medium text-fg shadow-xs hover:bg-fg/[0.06]"
                  title="Pause listening"
                >
                  <Pause className="size-3" />
                  <span>Pause</span>
                </button>
                {input.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      const text = input.trim();
                      stopListening();
                      if (text) void send(text);
                    }}
                    className="pressable inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-fg shadow-xs hover:opacity-90"
                  >
                    <span>Send</span>
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Input & Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2 border-t border-(--glass-line) p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-surface/40 backdrop-blur-md"
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
              placeholder={listening ? "Listening…" : "Ask anything…"}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-[1.25rem] bg-fg/[0.045] px-4 py-2.5 text-sm leading-snug text-fg shadow-[inset_0_0_0_1px_var(--glass-line)] placeholder:text-subtle focus-visible:bg-surface focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent),0_0_0_4px_var(--color-accent-soft)] focus-visible:outline-none"
            />

            {voiceIn ? (
              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={listening || handsFree}
                aria-label={listening || handsFree ? "Stop voice conversation" : "Talk to the assistant"}
                title={listening || handsFree ? "Stop" : "Talk"}
                className={cn(
                  "pressable relative grid size-11 shrink-0 place-items-center rounded-full transition-transform",
                  listening
                    ? "bg-danger text-white dark:text-bg"
                    : handsFree
                      ? "bg-accent-soft text-accent"
                      : "bg-fg/[0.06] text-fg hover:bg-fg/[0.09]",
                )}
              >
                {listening ? (
                  <span aria-hidden className="absolute inset-0 rounded-full bg-danger/40 motion-safe:animate-ping" />
                ) : null}
                {listening || handsFree ? (
                  <Square aria-hidden className="relative size-4 fill-current" />
                ) : (
                  <Mic aria-hidden className="size-[1.1rem]" />
                )}
              </button>
            ) : null}

            {busy ? (
              <button
                type="button"
                onClick={abortCurrentRequest}
                aria-label="Stop generating"
                title="Stop generation"
                className="pressable grid size-11 shrink-0 place-items-center rounded-full bg-fg/[0.08] text-fg hover:bg-fg/[0.12]"
              >
                <Square aria-hidden className="size-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message"
                className="pressable grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg disabled:opacity-40"
              >
                <ArrowUp aria-hidden className="size-[1.1rem]" />
              </button>
            )}
          </form>
        </section>
      ) : null}
    </>
  );
}
