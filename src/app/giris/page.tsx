import type { Metadata } from "next";
import { FormPage } from "@/components/FormPage";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Giriş yap",
};

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <FormPage
      title="Mailinle giriş yap"
      lead="Doğum günü kaydını eklemek veya düzenlemek için giriş yapman gerekiyor. Panel herkese açık kalıyor."
    >
      <LoginForm next={next && next.startsWith("/") ? next : "/kaydim"} />
    </FormPage>
  );
}
