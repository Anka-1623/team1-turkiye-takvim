import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/Icons";

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
    <div className="shell formpage">
      <header className="formpage__head">
        <Link href="/" className="back rise">
          <ArrowLeftIcon />
          Panele dön
        </Link>
        <h1 className="rise" style={{ "--i": 1 } as CSSProperties}>
          {title}
        </h1>
        <div className="formpage__lead rise" style={{ "--i": 2 } as CSSProperties}>
          {lead}
        </div>
      </header>
      <div className="formpage__body rise" style={{ "--i": 3 } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}
