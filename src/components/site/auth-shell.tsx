import Link from "next/link";

/**
 * Centered sign-in surface shared by staff login, client portal login and
 * password setup: one glass panel floating over the ambient background.
 */
export function AuthShell({
  brand,
  title,
  description,
  footer,
  children,
}: {
  brand?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="page-enter grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-[25rem]">
        <div className="glass-panel rounded-[2rem] p-7 sm:p-9">
          {brand ? (
            <Link href="/" className="pressable mb-8 inline-block rounded-full">
              {brand}
            </Link>
          ) : null}
          <h1 className="text-[1.75rem]">{title}</h1>
          {description ? <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{description}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
        {footer ? <div className="mt-6 px-4 text-center text-xs leading-relaxed text-subtle">{footer}</div> : null}
      </div>
    </main>
  );
}
