import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormPage } from "@/components/FormPage";
import { RegisterForm } from "@/components/RegisterForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Kaydol",
};

export default async function KayitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <FormPage
        title="Önce giriş yapmalısın"
        lead="Doğum günü kaydı eklemek için mailinle giriş yapman gerekiyor."
      >
        <Link href="/giris?next=/kayit" className="btn btn-primary">
          Giriş yap
        </Link>
      </FormPage>
    );
  }

  const { data: existing } = await supabase.rpc("get_my_member");
  if (existing && existing.length > 0) {
    redirect("/kaydim");
  }

  return (
    <FormPage
      title="Doğum gününü ekle"
      lead={
        <>
          Bilgilerin Team1 Türkiye üyelerine açık şekilde panelde görünür. Daha önce Member Portal ID
          ile kaydolduysan, tekrar kayıt olmak yerine{" "}
          <Link href="/kaydim" className="link">
            Kaydımı Yönet
          </Link>{" "}
          sayfasından eski kaydını bağlayabilirsin.
        </>
      }
    >
      <RegisterForm />
    </FormPage>
  );
}
