/** Confirmation shown in place of a submitted form: an animated check, a title and the server's message. */
export function FormSuccess({ title, message, children }: { title: string; message: string; children?: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center px-4 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-success-soft motion-safe:animate-[check-in_520ms_var(--ease-snap)_both]">
        <svg aria-hidden viewBox="0 0 24 24" className="size-8 text-success" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <p className="mt-5 text-xl font-semibold tracking-tight">{title}</p>
      <p className="mt-2 max-w-sm text-muted">{message}</p>
      {children}
    </div>
  );
}
