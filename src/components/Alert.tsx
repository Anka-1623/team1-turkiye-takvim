import type { ReactNode } from "react";
import { AlertIcon } from "@/components/Icons";

/** Error message. The icon and the words carry it; the red border is only a reinforcement. */
export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="alert">
      <AlertIcon size={20} />
      <span>{children}</span>
    </p>
  );
}
