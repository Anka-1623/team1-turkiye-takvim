import type { MetadataRoute } from "next";

// The calendar lists members' names and birthdays; it is for the community, not for search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
