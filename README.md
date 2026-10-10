# Team1 Türkiye Doğum Günü Takvimi

Avalanche Team1 Türkiye üyeleri için doğum günü takvimi. Üyeler mailleriyle
giriş yapıp ad/soyad, doğum günü, sosyal medya bağlantıları, ilgi
alanları ve bir not girer; panel bunu herkese açık listeler. Doğum günü
yaklaşan/bugün olan üyeler panelde görünür ve isteyen üyelere 7/3 gün
kala ve gün geldiğinde e-posta ile hatırlatılır.

## Nasıl çalışıyor

- **Next.js (App Router) + Tailwind** — tüm frontend ve tek backend katmanı.
- **Supabase (Postgres + Auth)** — tek tablo (`members`) + bir bildirim
  log tablosu (`birthday_notifications`). Sahiplik gerçek bir hesaba
  (magic-link login) bağlı; RLS `auth.uid()` üzerinden kontrol ediyor.
- **Resend** — (a) admin'e günlük özet (bugün + 3 gün sonra olanlar) ve
  (b) bildirimi açan üyelere, bir teammate'in doğum günü 7/3/0 gün
  kala kişiye özel hatırlatma.
- **Vercel Cron** — her ikisini de her gün tetikler (`vercel.json`).

### Giriş sistemi

Şifre yok. `/giris` sayfasında mailini girersin; sunucu (`/api/auth/login`)
Supabase Admin API ile tek kullanımlık bir giriş linki üretir ve tasarlanmış
giriş mailini Resend ile gönderir. Linke tıklayınca `/auth/confirm` token'ı
oturuma çevirir. Link, isteğin geldiği alan adına kurulur, yani Supabase'deki
Site URL ayarına bağlı değildir (localhost'a yönlenme sorunu burada yaşanmaz).
Kötüye kullanımı sınırlamak için e-posta başına 15 dakikada 3, toplamda saatte
120 giriş maili izni vardır (`login_email_log` tablosu). Sunucu tarafı mail
kurulamazsa form, Supabase'in yerleşik magic link'ine (`/auth/callback`) düşer.

Panel (`/`) herkese açık kalır; sadece kayıt (`/kayit`) ve kaydını düzenleme
(`/kaydim`) giriş ister. Önceden Member Portal ID ile (login yokken) kaydolmuş
üyeler `/kaydim`'de o ID'yi girerek eski kayıtlarını yeni hesaplarına
bağlayabilir (`claim_legacy_member`).

Tüm mailler (giriş, hatırlatma, kutlama, yönetici özeti) `src/lib/emailLayout.ts`
içindeki ortak tasarımdan üretilir.

### Bildirimler

"Bana e-posta ile hatırlat" kutusunu işaretli bırakan üyeler (yeni kayıtta varsayılan
olarak işaretli gelir, `/kaydim`'den kapatılır),
kendileri hariç her teammate'in doğum günü 7 ve 3 gün kala ve gün
geldiğinde bir mail alır — mailde ilgi alanları/not da görünür (hediye
fikri için). Aynı hatırlatmanın bir yılda birden fazla gitmemesi
`birthday_notifications` tablosuyla garanti edilir. Bu akış, `auth.users`
mailine ve tüm üyelerin bildirim tercihine erişmesi gerektiği için
`SUPABASE_SERVICE_ROLE_KEY` gerektirir — anahtar yoksa cron'un geri kalanı
(admin özeti) çalışmaya devam eder, sadece bu kısım atlanır.

### Yönetim paneli (yerel lider)

`/yonetim`, kayıt olan herkesi tam doğum tarihi (yıl dahil), yaş, hesap
e-postası, kayıt tarihi ve hatırlatma tercihiyle listeler. Sadece
`LEAD_EMAILS` listesindeki adreslerden biriyle (doğrulanmış e-posta, yani
normal magic-link girişiyle) açılır; girişsiz ziyaretçi giriş sayfasına
yönlenir, başka bir hesap 404 görür. Liste tarayıcıya anon key ile değil,
sunucuda `SUPABASE_SERVICE_ROLE_KEY` ile okunur. Lider girişliyse Profil
menüsünde "Yönetim paneli" bağlantısı görünür.

Herkese açık panel (`/`) geri sayım göstermez: ana sayfadaki büyük alan
sadece bir doğum günü geldiğinde o kişinin adını yazar.

### Güvenlik modeli

Anon key public repo'da ve tarayıcı paketinde açık — bu tasarım gereği
(Supabase anon key'ler bunun için var). Bunu güvenli kılan şey:

- `members` tablosunda RLS açık; `portal_id`, `user_id`, `notify_opt_in`
  **hiçbir zaman** anon/authenticated'e toplu okunabilir değil (kolon
  bazlı `GRANT SELECT` ile engelleniyor — kendi ayarını okumak için
  `get_my_member()` kullanılır).
- Ekleme/güncelleme/silme gerçek RLS politikalarıyla kontrol ediliyor:
  bir satırı sadece `user_id = auth.uid()` olan hesap değiştirebilir/
  silebilir. Portal ID artık bir "şifre" değil, sadece eski kayıtları
  bağlamak için tek seferlik bir anahtar.
- `SUPABASE_SERVICE_ROLE_KEY` sadece cron route'unda, sunucu tarafında
  kullanılır — asla `NEXT_PUBLIC_` değil, tarayıcıya hiç gitmez.
- Tam şema: [`supabase/schema.sql`](./supabase/schema.sql).

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
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` — sadece 7/3/0 gün üye bildirimleri için, yoksa o kısım atlanır |
| `CRON_SECRET` | Rastgele bir string üret (`openssl rand -hex 24`) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys ("Sending access") — boş bırakılırsa mailler sessizce atlanır |
| `MAIL_FROM_EMAIL` | Resend → Domains'te doğruladığın bir alan adındaki adres olmalı (ör. `team1turkiye@edutask.app`) |
| `MAIL_FROM_NAME` | Kozmetik, boş bırakılırsa `Team1 Türkiye` kullanılır |
| `NEXT_PUBLIC_SITE_URL` | İsteğe bağlı. Cron mailleri ve görseller için kanonik adres (ör. `https://team1-turkiye-takvim.vercel.app`); boşsa Vercel'in production alan adı kullanılır |
| `ADMIN_NOTIFY_EMAILS` | Günlük özeti alacak adres(ler), virgülle ayrılmış |
| `LEAD_EMAILS` | `/yonetim` yönetim panelini açabilecek adres(ler) (yerel lider), virgülle ayrılmış. `SUPABASE_SERVICE_ROLE_KEY` de gerekir |

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
4. Supabase Dashboard → Authentication → URL Configuration'da Site URL'i
   ve Redirect URLs listesine `https://<deploy-domain>/auth/callback`'i
   ekle — eklenmezse magic-link login'deki yönlendirme başarısız olur.

## Katkı

Team1 Türkiye üyesi değilsen bile PR'lara açığız — bug, tipografi, erişilebilirlik
düzeltmeleri her zaman memnuniyetle karşılanır.
