import "server-only";

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms / 1000}s`);
    this.name = "TimeoutError";
  }
}

/**
 * Reject if `promise` hasn't settled within `ms`. Used so a slow or stuck database
 * call degrades one widget instead of leaving a whole page on its loading state.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Settle with a fallback value on error/timeout, logging the reason (visible in Vercel logs). */
export async function settle<T>(promise: Promise<T>, fallback: T, label: string, ms = 8000): Promise<{ value: T; error: string | null }> {
  try {
    return { value: await withTimeout(promise, ms, label), error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[${label}]`, e);
    return { value: fallback, error: `${label}: ${message}` };
  }
}
