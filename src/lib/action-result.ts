export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export const ok = <T,>(data?: T, message?: string): ActionResult<T> => ({ ok: true, data, message });
export const fail = (error: string, fieldErrors?: FieldErrors): ActionResult<never> => ({ ok: false, error, fieldErrors });
