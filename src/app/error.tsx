"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="shell statuspage" role="alert">
      <p className="eyebrow">Hata</p>
      <h1 className="display">Bir şeyler ters gitti</h1>
      <p>Sayfa yüklenemedi. Bir süre sonra tekrar denersen düzelmiş olabilir.</p>
      <button type="button" onClick={reset} className="btn btn-primary">
        Tekrar dene
      </button>
    </div>
  );
}
