/** Click-to-chat link (https://wa.me/<digits>?text=…). Returns null when no valid number is set. */
export function whatsappLink(number: string | null | undefined, message?: string): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  const text = message?.trim() ? `?text=${encodeURIComponent(message.trim().slice(0, 200))}` : "";
  return `https://wa.me/${digits}${text}`;
}
