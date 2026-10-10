import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound, redirect } from "next/navigation";
import { LeadMemberList, type LeadRow } from "@/components/LeadMemberList";
import { isLeadUser } from "@/lib/lead";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SocialLink } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yönetim paneli",
  robots: { index: false, follow: false },
};

type MemberRow = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  birthday: string;
  socials: SocialLink[];
  notify_opt_in: boolean;
  created_at: string;
};

export default async function YonetimPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris?next=/yonetim");
  // Anyone else gets the same 404 as a page that does not exist.
  if (!isLeadUser(user)) notFound();

  const admin = createAdminClient();
  let rows: LeadRow[] | null = null;

  if (admin) {
    const { data: members, error } = await admin
      .from("members")
      .select("id, user_id, first_name, last_name, birthday, socials, notify_opt_in, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const { data: userList, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;
    const emailByUserId = new Map(userList.users.map((u) => [u.id, u.email ?? null]));

    rows = (members as MemberRow[]).map((m) => ({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`,
      email: m.user_id ? (emailByUserId.get(m.user_id) ?? null) : null,
      birthday: m.birthday,
      socials: m.socials,
      notifyOptIn: m.notify_opt_in,
      createdAt: m.created_at,
    }));
  }

  return (
    <div className="shell pb-20 pt-10 md:pt-16">
      <header className="min-w-0">
        <h1 className="page-title rise">Yönetim paneli</h1>
        <p
          className="rise mt-5 max-w-[56ch] leading-relaxed text-ink-2"
          style={{ "--i": 1 } as CSSProperties}
        >
          Kayıt olan herkes, tam doğum tarihleri ve e-postalarıyla. Bu sayfayı yalnızca yerel lider
          görür; lütfen listeyi paylaşmayın.
        </p>
      </header>

      <div className="rise mt-10 md:mt-14" style={{ "--i": 2 } as CSSProperties}>
        {rows ? (
          <LeadMemberList rows={rows} />
        ) : (
          <p className="alert">
            Liste yüklenemedi: sunucuda <code>SUPABASE_SERVICE_ROLE_KEY</code> tanımlı değil.
          </p>
        )}
      </div>
    </div>
  );
}
