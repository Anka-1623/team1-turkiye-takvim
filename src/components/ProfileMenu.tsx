"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";

/** Signed-in entry point in the navbar: the account's own pages and sign-out live here. */
export function ProfileMenu({ email, isLead = false }: { email: string; isLead?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = (email.trim()[0] ?? "?").toLocaleUpperCase("tr-TR");

  return (
    <div ref={rootRef} className="profile">
      <button
        ref={triggerRef}
        type="button"
        className="navlink profile-trigger"
        aria-label="Profil"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="profile-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="hidden sm:inline">Profil</span>
        <svg
          className="profile-chevron"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div id={panelId} className="profile-panel">
          <p className="profile-email" title={email}>
            <span className="profile-email-label">Giriş yapılan hesap</span>
            {email}
          </p>
          <Link
            href="/kaydim"
            className="profile-item"
            aria-current={pathname.startsWith("/kaydim") ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            Kaydımı yönet
          </Link>
          {isLead && (
            <Link
              href="/yonetim"
              className="profile-item"
              aria-current={pathname.startsWith("/yonetim") ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Yönetim paneli
            </Link>
          )}
          <SignOutButton className="profile-item" />
        </div>
      )}
    </div>
  );
}
