import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Public pages are ISR-cached. The site is small, so any CMS change simply
 * invalidates the whole public layout tree (plus sitemap).
 */
export function revalidatePublicSite() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}
