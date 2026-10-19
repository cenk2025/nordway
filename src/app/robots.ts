import type { MetadataRoute } from "next";
import { flags } from "@/lib/flags";

// Pre-launch: block all crawlers until NEXT_PUBLIC_ALLOW_INDEXING=true.
export default function robots(): MetadataRoute.Robots {
  if (!flags.allowIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/*/admin", "/*/account", "/*/dashboard"] } };
}
