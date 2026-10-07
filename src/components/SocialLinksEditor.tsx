"use client";

import { XIcon } from "@/components/Icons";
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
    <div className="social-list">
      {value.map((s, i) => (
        <div key={i} className="social-row">
          <select
            value={s.platform}
            onChange={(e) => update(i, { platform: e.target.value })}
            className="field"
            aria-label={`${i + 1}. bağlantının platformu`}
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
            className="field"
            aria-label={`${i + 1}. bağlantının adresi`}
          />
          <button type="button" onClick={() => remove(i)} aria-label="Bağlantıyı kaldır" className="icon-btn">
            <XIcon />
          </button>
        </div>
      ))}
      {value.length < MAX_SOCIAL_LINKS && (
        <div>
          <button type="button" onClick={add} className="btn btn-secondary btn-sm">
            + Bağlantı ekle
          </button>
        </div>
      )}
    </div>
  );
}
