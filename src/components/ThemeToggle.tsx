"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const getServerTheme = (): Theme => "dark";

/** Dark is the Team1 default; light is the documented alternate. The choice lives in this browser only. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  function choose(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // private mode or blocked storage: the choice just lasts for this visit
    }
  }

  return (
    <div role="group" aria-label="Tema" className="seg">
      <button type="button" className="seg__btn" aria-pressed={theme === "dark"} onClick={() => choose("dark")}>
        Koyu
      </button>
      <button type="button" className="seg__btn" aria-pressed={theme === "light"} onClick={() => choose("light")}>
        Açık
      </button>
    </div>
  );
}
