import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell statuspage">
      <p className="eyebrow">404</p>
      <h1 className="display">Sayfa bulunamadı</h1>
      <p>Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link href="/" className="btn btn-primary">
        Panele dön
      </Link>
    </div>
  );
}
