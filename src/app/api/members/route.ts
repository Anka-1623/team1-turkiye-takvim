import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { leadEmails } from "@/lib/lead";
import { PENDING_REGISTRATION_SUBJECT, renderPendingRegistrationHtml } from "@/lib/leadNotify";
import { siteUrl } from "@/lib/siteUrl";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const optional = (value: unknown) => text(value) || null;

/**
 * Registers the signed-in account as a member. The insert still runs as the user (RLS and the
 * column grants apply, a database trigger decides whether the Member Portal ID gets them approved on
 * the spot), but it goes through here so that a registration whose ID is not on the roster can tell the
 * local lead right away. A failed notification never fails the registration: the lead panel lists
 * every waiting registration anyway.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const portalId = text(body.portal_id);
  if (!portalId) return NextResponse.json({ error: "portal_id_required" }, { status: 400 });

  const firstName = text(body.first_name);
  const lastName = text(body.last_name);

  const { error: insertError } = await supabase.from("members").insert({
    portal_id: portalId,
    first_name: firstName,
    last_name: lastName,
    birthday: text(body.birthday),
    socials: Array.isArray(body.socials) ? body.socials : [],
    interests: optional(body.interests),
    wish: optional(body.wish),
    note: optional(body.note),
    address: optional(body.address),
    notify_opt_in: body.notify_opt_in === true,
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  const { data: mine } = await supabase.rpc("get_my_member");
  const approved = (mine?.[0] as { approved?: boolean } | undefined)?.approved === true;

  if (!approved) {
    try {
      const to = leadEmails();
      if (to.length === 0) {
        console.error("[api/members] registration is waiting but LEAD_EMAILS is empty, nobody was told");
      } else {
        const result = await sendEmail({
          to,
          subject: PENDING_REGISTRATION_SUBJECT,
          html: renderPendingRegistrationHtml(
            { name: `${firstName} ${lastName}`, portalId, email: user.email ?? "" },
            siteUrl(req)
          ),
        });
        if (!result.sent) console.error("[api/members] lead not notified:", result.reason);
      }
    } catch (err) {
      console.error("[api/members] lead notification failed:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ ok: true, approved });
}
