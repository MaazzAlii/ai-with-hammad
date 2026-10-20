/**
 * Browser voice helpers for the site assistant — the same approach as a Streamlit voice bot,
 * but native: Web Speech API for listening (Chrome/Edge; Safari partially) and the browser's
 * neural voices for speaking. Free, no audio leaves the browser except as recognised text.
 */

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };

export type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

export function recognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

export function createRecognition(handlers: {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}): Recognition | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = navigator.language || "en-US";
  r.interimResults = true;
  r.continuous = false;
  r.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i]!;
      if (res.isFinal) handlers.onFinal(res[0].transcript.trim());
      else interim += res[0].transcript;
    }
    if (interim) handlers.onInterim(interim);
  };
  r.onerror = (e) => handlers.onError(e.error);
  r.onend = () => handlers.onEnd();
  return r;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    // Prime voices cache for Chromium browsers
  };
}

/** Prefer natural/neural voices in the visitor's language. */
function pickVoice(): SpeechSynthesisVoice | undefined {
  if (!speechSupported()) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const lang = (navigator.language || "en-US").slice(0, 2).toLowerCase();
  const inLang = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
  const pool = inLang.length ? inLang : voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  return (
    pool.find((v) => /natural|neural|online/i.test(v.name)) ??
    pool.find((v) => /google|aria|jenny|samantha|daniel|serena/i.test(v.name)) ??
    pool.find((v) => v.default) ??
    pool[0]
  );
}

/** Text that reads well aloud: no URLs, markdown symbols or the lead marker. */
export function speakable(text: string): string {
  return text
    .replace(/\[\[LEAD_FORM\]\]/g, "")
    .replace(/\$\{siteUrl\}/g, "")
    .replace(/\$\{site\}/g, "")
    .replace(/https?:\/\/\S+/g, "the link in the chat")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSpeaking(): boolean {
  return speechSupported() && (window.speechSynthesis.speaking || Boolean(currentUtterance));
}

export function speak(
  text: string,
  onEnd?: () => void,
  onStart?: () => void,
): void {
  if (!speechSupported()) {
    onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const clean = speakable(text);
  if (!clean) {
    onEnd?.();
    return;
  }
  const u = new SpeechSynthesisUtterance(clean);
  currentUtterance = u;
  const voice = pickVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  u.rate = 1;
  u.pitch = 1;
  u.onstart = () => {
    onStart?.();
  };
  const finish = () => {
    currentUtterance = null;
    onEnd?.();
  };
  u.onend = finish;
  u.onerror = finish;
  if (synth.paused) synth.resume();
  synth.speak(u);
}

export function stopSpeaking(): void {
  currentUtterance = null;
  if (speechSupported()) window.speechSynthesis.cancel();
}

