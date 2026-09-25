import { MessageCircle } from "lucide-react";

/**
 * Floating click-to-chat control (plain link: no third-party script, no JS).
 * On phones it floats above the tab bar.
 */
export function WhatsAppButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="no-print glass-float pressable group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 inline-flex h-12 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-fg hover:scale-[1.03] lg:right-6 lg:bottom-6"
    >
      <span className="grid size-8 place-items-center rounded-full bg-whatsapp text-whatsapp-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]">
        <MessageCircle aria-hidden className="size-[1.05rem]" strokeWidth={2} />
      </span>
      <span className="hidden pr-1 sm:inline">WhatsApp</span>
    </a>
  );
}
