import type { ChatMessage } from "@/server/ai/types";

const PRONOUN_REGEX = /\b(it|its|this|that|these|those|they|them|he|him|his|she|her|there)\b/i;
const FOLLOWUP_QUESTION_STARTS = /^(how\s+much|what\s+about|where\s+can\s+i|who\s+built|is\s+it|can\s+it|does\s+it|how\s+does\s+it)/i;

/**
 * Rewrites ambiguous conversational follow-ups into standalone search queries
 * by extracting key subject entities from recent turns.
 */
export function rewriteQuery(userQuery: string, history: ChatMessage[]): string {
  const trimmed = userQuery.trim();
  if (history.length === 0) return trimmed;

  const isFollowup = PRONOUN_REGEX.test(trimmed) || FOLLOWUP_QUESTION_STARTS.test(trimmed) || trimmed.length < 25;
  if (!isFollowup) return trimmed;

  // Scan recent history backwards for subject clues (nouns, titles, service names)
  let subject = "";
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === "user") {
      // Find capitalized words or noun phrases in previous user query
      const match = msg.content.match(/(?:about|for|is|on)\s+([A-Za-z0-9\s-]+?)(?:\?|$|\.)/i);
      if (match && match[1]) {
        subject = match[1].trim();
        break;
      }
    } else if (msg.role === "assistant") {
      // Find quoted terms, markdown bold terms, or heading lines
      const boldMatch = msg.content.match(/\*\*([^*]+)\*\*/);
      if (boldMatch && boldMatch[1]) {
        subject = boldMatch[1].trim();
        break;
      }
      const firstLine = msg.content.split("\n")[0];
      const match = firstLine.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (match && match[1] && match[1].length > 3) {
        subject = match[1].trim();
        break;
      }
    }
  }

  if (subject && !trimmed.toLowerCase().includes(subject.toLowerCase())) {
    return `${trimmed} (context: ${subject})`;
  }

  return trimmed;
}
