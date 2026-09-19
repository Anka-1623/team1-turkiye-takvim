# Kozalak Takvim

Avalanche Team1 Türkiye üyeleri için doğum günü takvimi. Üyeler ad/soyad,
doğum günü, sosyal medya bağlantıları ve Team1 member portal ID'lerini
girerek panelde görünür; yaklaşan/bugünkü doğum günleri panelde listelenir
ve günlük bir e-posta özeti ile hatırlatılır.

## Nasıl çalışıyor

- **Next.js (App Router) + Tailwind** — tüm frontend ve tek backend katmanı.
- **Supabase (Postgres)** — tek tablo (`members`), sadece anon/publishable
  key ile çalışır. Gerçek bir login sistemi yok; sahiplik kontrolü Member
  Portal ID üzerinden yapılıyor.
- **Resend** — günlük doğum günü özeti e-postası (bugün olanlar + 3 gün
  sonra olanlar).
- **Vercel Cron** — özet e-postasını her gün tetikler (`vercel.json`).

### Güvenlik modeli

Anon key public repo'da ve tarayıcı paketinde açık — bu tasarım gereği
(Supabase anon key'ler bunun için var). Bunu güvenli kılan şey:

- `members` tablosunda RLS açık; `portal_id` **hiçbir zaman** dışarı
  okunabilir değil (kolon bazlı `GRANT SELECT` ile engelleniyor).
- Ekleme/güncelleme/silme sadece `SECURITY DEFINER` Postgres fonksiyonları
  (`create_member`, `update_member`, `delete_member`, `lookup_member`)
  üzerinden yapılıyor — bu fonksiyonlar çağıranın verdiği `portal_id`'nin
  ilgili satırla eşleştiğini veritabanı içinde doğruluyor. Yani biri anon
  key'i alıp REST API'ye elle istek atsa bile, doğru `portal_id`'yi
  bilmeden başka birinin kaydını değiştiremez/silemez.
- Tam şema: [`supabase/schema.sql`](./supabase/schema.sql).

Bu gerçek bir kimlik doğrulama değil, hafif bir "sahiplik" kontrolü —
Team1 içi, düşük riskli bir topluluk aracı için bilinçli bir tercih.

## Yerel geliştirme

```bash
npm install
cp .env.example .env.local   # değerleri doldur, bkz. aşağı
npm run dev
```

### Ortam değişkenleri (`.env.local`)

| Değişken | Nereden |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `CRON_SECRET` | Rastgele bir string üret (`openssl rand -hex 24`) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) — boş bırakılırsa özet e-postası sessizce atlanır |
| `RESEND_FROM_EMAIL` | Doğrulanmış bir alan adın yoksa varsayılan `onboarding@resend.dev` çalışır |
| `ADMIN_NOTIFY_EMAILS` | Günlük özeti alacak adres(ler), virgülle ayrılmış |

`.env*` dosyaları `.gitignore`'da (`.env.example` hariç) — gerçek key'ler
asla repoya girmez.

### Veritabanını sıfırdan kurmak

Yeni bir Supabase projesinde SQL Editor'den [`supabase/schema.sql`](./supabase/schema.sql)
dosyasını çalıştırman yeterli.

## Deploy (Vercel)

1. Repoyu Vercel'e bağla.
2. Yukarıdaki ortam değişkenlerini proje ayarlarından ekle (aynı isimlerle).
3. `vercel.json` içindeki cron (`/api/cron/birthday-digest`, her gün
   05:00 UTC ≈ 08:00 İstanbul) otomatik aktif olur — `CRON_SECRET` set
   edildiğinde Vercel isteği otomatik olarak bu secret ile imzalar.

## Katkı

Team1 Türkiye üyesi değilsen bile PR'lara açığız — bug, tipografi, erişilebilirlik
düzeltmeleri her zaman memnuniyetle karşılanır.
