/**
 * Canonical origin for links and images inside e-mails.
 * Order: explicit env, the request's own origin (so a login started on a
 * preview or localhost links back to it), Vercel's production domain, the
 * deployment URL, then localhost. The cron has no request, so it lands on
 * the production domain.
 */
export function siteUrl(req?: Request): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (req) return new URL(req.url).origin;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;
  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;
  return "http://localhost:3000";
}
