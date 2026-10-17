import { describe, expect, it } from "vitest";
import { portalKey, portalStatus } from "./portal";

const roster = new Set(["t1-099-001", "t1-099-002"]);

describe("portalKey", () => {
  it("trims and lower-cases, like the database does", () => {
    expect(portalKey("  T1-099-001 ")).toBe("t1-099-001");
  });
});

describe("portalStatus", () => {
  it("is listed for an ID on the roster, whatever its case or padding", () => {
    expect(portalStatus("T1-099-001", roster)).toBe("listed");
    expect(portalStatus(" t1-099-002  ", roster)).toBe("listed");
  });

  it("is unlisted for an ID that is not on the roster", () => {
    expect(portalStatus("T1-099-777", roster)).toBe("unlisted");
  });

  it("is missing for no ID at all", () => {
    expect(portalStatus(null, roster)).toBe("missing");
    expect(portalStatus("   ", roster)).toBe("missing");
  });
});
