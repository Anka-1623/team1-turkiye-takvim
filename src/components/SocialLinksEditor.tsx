"use client";

import { MAX_SOCIAL_LINKS, SOCIAL_PLATFORMS } from "@/lib/socials";
import type { SocialLink } from "@/lib/types";

type Props = {
  value: SocialLink[];
  onChange: (next: SocialLink[]) => void;
};

export function SocialLinksEditor({ value, onChange }: Props) {
  function update(i: number, patch: Partial<SocialLink>) {
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    if (value.length >= MAX_SOCIAL_LINKS) return;
    onChange([...value, { platform: SOCIAL_PLATFORMS[0].value, url: "" }]);
  }

  return (
    <div className="space-y-2.5">
      {value.map((s, i) => (
        <div key={i} className="flex gap-2">
          <select
            value={s.platform}
            onChange={(e) => update(i, { platform: e.target.value })}
            className="field w-36 shrink-0"
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="url"
            required
            placeholder="https://..."
            value={s.url}
            onChange={(e) => update(i, { url: e.target.value })}
            className="field flex-1"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Bağlantıyı kaldır"
            className="btn btn-ghost shrink-0 px-3.5"
          >
            ✕
          </button>
        </div>
      ))}
      {value.length === 0 && (
        <button
          type="button"
          onClick={add}
          className="field w-full text-left text-ink-3"
        >
          + Bağlantı ekle
        </button>
      )}
      {value.length > 0 && value.length < MAX_SOCIAL_LINKS && (
        <button
          type="button"
          onClick={add}
          className="link-btn"
        >
          + Bağlantı ekle
        </button>
      )}
    </div>
  );
}
