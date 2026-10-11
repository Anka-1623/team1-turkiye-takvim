import type { Metadata } from "next";
import Link from "next/link";
import { ClaimLegacyForm } from "@/components/ClaimLegacyForm";
import { FormPage } from "@/components/FormPage";
import { ManageForm } from "@/components/ManageForm";
import { createClient } from "@/lib/supabase/server";
import type { MyMember } from "@/lib/types";

export const metadata: Metadata = {
  title: "Kaydımı Yönet",
};

export default async function KaydimPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <FormPage
        title="Önce giriş yapmalısın"
        lead="Kaydını düzenlemek veya silmek için mailinle giriş yapman gerekiyor."
      >
        <Link href="/giris?next=/kaydim" className="btn btn-primary">
          Giriş yap
        </Link>
      </FormPage>
    );
  }

  const { data } = await supabase.rpc("get_my_member");
  const row = (data?.[0] ?? null) as Omit<MyMember, "wish"> | null;

  // get_my_member() predates the wish column; it is public, so read it straight from the table.
  let member: MyMember | null = null;
  if (row) {
    const { data: extra } = await supabase.from("members").select("wish").eq("id", row.id).maybeSingle();
    member = { ...row, wish: (extra as { wish: string | null } | null)?.wish ?? null };
  }

  return (
    <FormPage
      title="Bilgilerini düzenle"
      lead="Giriş yaptığın hesaba bağlı kaydını burada düzenleyebilir veya silebilirsin."
    >
      {member ? <ManageForm initial={member} /> : <ClaimLegacyForm />}
    </FormPage>
  );
}
