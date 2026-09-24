import "server-only";

import { z } from "zod";

import { fail, type ActionResult } from "@/lib/action-result";

import { AuthError, ForbiddenError, UserFacingError } from "./errors";

/**
 * Wraps a server action body: converts auth/validation/user errors into an
 * ActionResult and hides unexpected errors (logged server-side only).
 */
export async function runAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthError || error instanceof ForbiddenError || error instanceof UserFacingError) {
      return fail(error.message);
    }
    if (error instanceof z.ZodError) {
      return fail("Please correct the highlighted fields.", z.flattenError(error).fieldErrors as Record<string, string[]>);
    }
    // Next.js control-flow errors (redirect/notFound) must propagate.
    if (error && typeof error === "object" && "digest" in error && typeof error.digest === "string" && /^NEXT_/.test(error.digest)) {
      throw error;
    }
    const pgCode = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
    if (pgCode === "23505") return fail("That value is already in use (for example the slug). Choose another.");
    if (pgCode === "23503") return fail("This item is referenced elsewhere and cannot be changed that way.");
    if (pgCode === "23514") return fail("A value is not allowed (for example an invalid URL or slug).");
    console.error("[action] unexpected error", error);
    return fail("Something went wrong. Please try again.");
  }
}

/** Parse FormData/object input with a zod schema (throws ZodError). */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  return schema.parse(input);
}
