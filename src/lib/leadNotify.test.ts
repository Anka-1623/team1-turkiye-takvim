import { describe, expect, it } from "vitest";
import { renderPendingRegistrationHtml } from "./leadNotify";

describe("renderPendingRegistrationHtml", () => {
  it("shows the name, the typed ID and the account e-mail, with a link to the panel", () => {
    const html = renderPendingRegistrationHtml(
      { name: "Ayşe Yılmaz", portalId: "T1-040-999", email: "ayse@example.com" },
      "https://takvim.example"
    );

    expect(html).toContain("Ayşe Yılmaz");
    expect(html).toContain("T1-040-999");
    expect(html).toContain("ayse@example.com");
    expect(html).toContain('href="https://takvim.example/yonetim"');
  });

  it("escapes what the registrant typed, since it lands in the lead's inbox", () => {
    const html = renderPendingRegistrationHtml(
      { name: "<img src=x onerror=alert(1)>", portalId: '"><script>alert(1)</script>', email: "a@b.co" },
      "https://takvim.example"
    );

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });
});
