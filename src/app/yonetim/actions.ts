"use server";

import { revalidatePath } from "next/cache";
import { isLeadUser, leadEmails } from "@/lib/lead";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LeadActionResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN: LeadActionResult = { ok: false, error: "Bu işlem için yetkin yok." };
const FAILED: LeadActionResult = { ok: false, error: "İşlem tamamlanamadı, tekrar dener misin?" };

/**
 * Server actions are plain POST endpoints anyone can call, so every one re-checks that the caller is a
 * lead before it touches anything with the service-role client.
 */
async function leadContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();
  return user && admin && isLeadUser(user) ? { admin, user } : null;
}

function refresh() {
  revalidatePath("/yonetim");
  revalidatePath("/");
}

/** Lets a waiting registration onto the public list (and into the reminder mails). */
export async function approveMember(memberId: string): Promise<LeadActionResult> {
  const ctx = await leadContext();
  if (!ctx) return FORBIDDEN;

  const { error } = await ctx.admin.from("members").update({ approved: true }).eq("id", memberId);
  if (error) {
    console.error("[yonetim] approve failed:", error.message);
    return FAILED;
  }
  refresh();
  return { ok: true };
}

/**
 * Removes a member from the system. A member with an account loses the account as well (the row goes
 * with it, cascading), so no orphaned address or e-mail is left behind; a legacy row without an account
 * is just deleted. Leads cannot remove themselves or each other here.
 */
export async function deleteMember(memberId: string): Promise<LeadActionResult> {
  const ctx = await leadContext();
  if (!ctx) return FORBIDDEN;
  const { admin, user } = ctx;

  const { data: member, error: readError } = await admin
    .from("members")
    .select("id, user_id")
    .eq("id", memberId)
    .maybeSingle();
  if (readError) {
    console.error("[yonetim] delete lookup failed:", readError.message);
    return FAILED;
  }
  if (!member) return { ok: false, error: "Kayıt bulunamadı." };

  if (member.user_id) {
    if (member.user_id === user.id) {
      return { ok: false, error: "Kendi kaydını buradan silemezsin; 'Kaydımı Yönet' sayfasını kullan." };
    }
    const { data: target } = await admin.auth.admin.getUserById(member.user_id);
    const targetEmail = target.user?.email?.trim().toLowerCase();
    if (targetEmail && leadEmails().includes(targetEmail)) {
      return { ok: false, error: "Başka bir yerel liderin kaydı buradan silinemez." };
    }
    const { error } = await admin.auth.admin.deleteUser(member.user_id);
    if (error) {
      console.error("[yonetim] delete user failed:", error.message);
      return FAILED;
    }
  } else {
    const { error } = await admin.from("members").delete().eq("id", memberId);
    if (error) {
      console.error("[yonetim] delete member failed:", error.message);
      return FAILED;
    }
  }

  refresh();
  return { ok: true };
}
