import { serializeJsonLd } from "@/lib/jsonld";

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // Safe: serializeJsonLd escapes <, >, & so the payload cannot break out of the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
