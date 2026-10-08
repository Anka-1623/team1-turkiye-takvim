import type { CSSProperties, ReactNode } from "react";

/** Shared shell for the login / register / manage pages: heading on the left, form on the right. */
export function FormPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shell grid gap-10 pb-20 pt-10 md:pt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <header className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <h1 className="page-title rise">{title}</h1>
        <div
          className="rise mt-5 max-w-[44ch] leading-relaxed text-ink-2"
          style={{ "--i": 1 } as CSSProperties}
        >
          {lead}
        </div>
      </header>
      <div className="rise min-w-0 max-w-xl" style={{ "--i": 2 } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}
