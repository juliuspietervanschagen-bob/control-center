import {
  BANNED_PHRASES,
  MAX_BODY_WORDS,
  MAX_SUBJECT_WORDS,
  MIN_BODY_WORDS,
} from "../config/constants";

export function wordCount(text: string): number {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

export function containsBannedPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

export function assertBodyConstraints(body: string): void {
  const count = wordCount(body);
  if (count < MIN_BODY_WORDS || count > MAX_BODY_WORDS) {
    throw new Error(
      `Email body must be ${MIN_BODY_WORDS}-${MAX_BODY_WORDS} words (got ${count}).`,
    );
  }
  const banned = containsBannedPhrase(body);
  if (banned) {
    throw new Error(`Email body contains banned phrase: "${banned}".`);
  }
}

export function assertSubjectConstraints(subject: string): void {
  const cleaned = subject.replace(/^["']|["']$/g, "").trim();
  const count = wordCount(cleaned);
  if (count === 0 || count > MAX_SUBJECT_WORDS) {
    throw new Error(
      `Subject must be 1-${MAX_SUBJECT_WORDS} words (got ${count}): "${subject}"`,
    );
  }
  if (/[!?]{2,}|free|act now|limited|urgent/i.test(cleaned)) {
    throw new Error(`Subject looks clickbaity: "${subject}"`);
  }
}

export function sanitizeSubject(subject: string): string {
  return subject.replace(/^subject:\s*/i, "").replace(/^["']|["']$/g, "").trim();
}
