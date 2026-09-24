import { MessageCircle } from "lucide-react";

/** Floating click-to-chat button (plain link: no third-party script, no JS). */
export function WhatsAppButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="no-print fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3 text-sm font-semibold text-[#03240f] shadow-[0_10px_30px_-8px_rgb(37_211_102/0.6)] transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6"
    >
      <MessageCircle aria-hidden className="size-5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
