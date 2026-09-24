"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** Accessible 1–5 star rating (native radio group, keyboard friendly). */
export function StarRatingInput({ name = "rating", defaultValue = 0, error }: { name?: string; defaultValue?: number; error?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const labels = ["Poor", "Fair", "Good", "Very good", "Excellent"];
  return (
    <fieldset>
      <legend className="text-sm font-medium">Your rating</legend>
      <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-control p-1 has-focus-visible:outline-2 has-focus-visible:outline-accent" onMouseEnter={() => setHover(n)}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => setValue(n)} className="sr-only" aria-label={`${n} star${n > 1 ? "s" : ""} — ${labels[n - 1]}`} />
            <Star aria-hidden className={cn("size-8 transition-colors", n <= shown ? "fill-warning text-warning" : "text-border-strong")} />
          </label>
        ))}
        <span className="ml-2 text-sm text-muted" aria-live="polite">{shown ? labels[shown - 1] : "Choose 1–5 stars"}</span>
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </fieldset>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={cn("size-4", n <= Math.round(rating) ? "fill-warning text-warning" : "text-border-strong")} />
      ))}
    </span>
  );
}
