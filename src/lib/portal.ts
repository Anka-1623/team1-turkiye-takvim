/** "listed": the ID is on the roster. "unlisted": an ID was given but is not on it. "missing": none given. */
export type PortalStatus = "listed" | "unlisted" | "missing";

/** Same normalization as the database (lower(trim(...))), so both sides agree on what matches. */
export const portalKey = (portalId: string) => portalId.trim().toLowerCase();

export function portalStatus(portalId: string | null, roster: ReadonlySet<string>): PortalStatus {
  if (!portalId?.trim()) return "missing";
  return roster.has(portalKey(portalId)) ? "listed" : "unlisted";
}
