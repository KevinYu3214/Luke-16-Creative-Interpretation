export type HighlightRange = { verse: number; start: number; end: number };

export type HighlightState = {
  tokens?: string[];
  ranges?: HighlightRange[];
  label?: string;
};

export type EvidenceSnippet = { verse: number; text: string };

export type Citation = {
  id: string;
  label: string;
  verses: number[];
  tokens?: string[];
  phrases?: string[];
  snippets: EvidenceSnippet[];
};

export type Claim = {
  id: string;
  type: "Key takeaways";
  text: string;
  citations: Citation[];
};
