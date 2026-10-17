import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendEmail, buildDigest, createAdminClient } = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  buildDigest: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/email", () => ({ sendEmail }));
vi.mock("@/lib/digest", () => ({ buildDigest, renderDigestEmailHtml: () => "<p>digest</p>" }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

import { GET } from "./route";

const call = () => GET(new NextRequest("http://localhost/api/cron/birthday-digest"));
const subjects = () => sendEmail.mock.calls.map(([mail]) => (mail as { subject: string }).subject);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  delete process.env.CRON_SECRET;
  process.env.ADMIN_NOTIFY_EMAILS = "admin@example.com";
  sendEmail.mockResolvedValue({ sent: true, ids: ["1"] });
  buildDigest.mockResolvedValue({ today: [{ id: "m1" }], soon: [] });
  createAdminClient.mockReturnValue(null); // no service-role key: member notifications are skipped
});

describe("birthday-digest cron", () => {
  it("succeeds with 200 and sends only the digest when nothing is wrong", async () => {
    const res = await call();

    expect(res.status).toBe(200);
    expect(subjects()).toEqual(["Bugün doğum günü olan 1 kişi var - Team1 Türkiye"]);
  });

  it("still sends the admin digest when the member notifications throw, and reports the failure", async () => {
    createAdminClient.mockReturnValue({
      from: () => ({ select: () => ({ eq: async () => ({ data: null, error: new Error("boom") }) }) }),
    });

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.errors).toEqual(["member notifications: boom"]);
    expect(subjects()).toEqual([
      "Bugün doğum günü olan 1 kişi var - Team1 Türkiye",
      "Doğum günü cron'u hata verdi - Team1 Türkiye",
    ]);
  });

  it("only reads approved members for the reminders, so waiting registrations get and cause none", async () => {
    const eq = vi.fn().mockResolvedValue({ data: [], error: null });
    createAdminClient.mockReturnValue({ from: () => ({ select: () => ({ eq }) }) });

    const res = await call();

    expect(res.status).toBe(200);
    expect(eq).toHaveBeenCalledWith("approved", true);
  });

  it("still tries the member notifications when the digest throws", async () => {
    buildDigest.mockRejectedValue(new Error("db down"));

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.errors).toEqual(["digest: db down"]);
    expect(body.memberNotifications).toMatchObject({ ran: false });
    expect(subjects()).toEqual(["Doğum günü cron'u hata verdi - Team1 Türkiye"]);
  });

  it("does not crash when the failure notice cannot be sent either", async () => {
    buildDigest.mockRejectedValue(new Error("db down"));
    sendEmail.mockRejectedValue(new Error("resend quota"));

    const res = await call();

    expect(res.status).toBe(500);
  });

  it("rejects calls without the cron secret", async () => {
    process.env.CRON_SECRET = "s3cret";

    const res = await call();

    expect(res.status).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
