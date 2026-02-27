export const STOPWORDS = [
  "the",
  "and",
  "of",
  "to",
  "a",
  "in",
  "that",
  "he",
  "his",
  "him",
  "unto",
  "for",
  "this",
  "is",
  "it",
  "i",
  "am",
  "be",
  "was",
  "are",
  "an",
  "as",
  "with",
  "from",
  "me",
  "my",
  "their",
  "they",
  "what",
  "how",
  "when",
  "so",
  "then",
  "than",
  "or",
  "no",
  "not",
];

export type Segment = {
  text: string;
  norm: string;
  isWord: boolean;
};

export function normalizeToken(token: string): string {
  const lower = token.toLowerCase();
  const cleaned = lower.replace(/[^a-z0-9']/g, "");
  return cleaned.replace(/'s$/g, "").replace(/^'+|'+$/g, "");
}

export function tokenize(text: string): string[] {
  const parts = text.match(/[A-Za-z0-9']+/g) ?? [];
  return parts.map((part) => normalizeToken(part)).filter(Boolean);
}

export function segmentText(text: string): Segment[] {
  const parts = text.match(/[A-Za-z0-9']+|[^A-Za-z0-9']+/g) ?? [];
  return parts.map((part) => {
    const isWord = /[A-Za-z0-9']+/.test(part);
    return {
      text: part,
      isWord,
      norm: isWord ? normalizeToken(part) : "",
    };
  });
}

export function isStopword(token: string): boolean {
  return STOPWORDS.includes(token);
}
