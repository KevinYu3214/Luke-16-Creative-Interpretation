import { normalizeToken, tokenize } from "./tokenize";
import type { Verse } from "../passage";

export type VerseData = {
  verse: number;
  text: string;
  tokens: string[];
  tokenIndices: Record<string, number[]>;
};

export type PhraseHit = { phrase: string; start: number; end: number };

export type FeatureConfig = {
  key: string;
  label: string;
  tokens: string[];
  phrases?: string[];
};

export type FeatureHit = {
  tokenHits: number;
  phraseHits: number;
  tokens: string[];
  phrases: PhraseHit[];
  indices: number[];
  phraseRanges: Array<[number, number]>;
  score: number;
};

export type VerseFeatureMetrics = {
  verse: number;
  totalScore: number;
  features: Record<string, FeatureHit>;
  contributingIndices: number[];
  contributingTokens: string[];
};

export type ThemeConfig = {
  key: string;
  label: string;
  tokens: string[];
  phrases: string[];
};

export type ThemeAggregate = {
  key: string;
  label: string;
  tokenHits: number;
  phraseHits: number;
  score: number;
  tokens: string[];
  phrases: PhraseHit[];
  occurrences: Array<{ verse: number; indices: number[]; phraseRanges: Array<[number, number]> }>;
};

const normalizeList = (items: string[]) => items.map((item) => normalizeToken(item)).filter(Boolean);

export const PRESSURE_FEATURES: FeatureConfig[] = [
  {
    key: "audit",
    label: "Audit / Accounting",
    tokens: normalizeList([
      "steward",
      "stewardship",
      "account",
      "bill",
      "debtors",
      "owest",
      "measures",
      "write",
    ]),
    phrases: ["give an account", "take thy bill"],
  },
  {
    key: "urgency",
    label: "Urgency / Time",
    tokens: normalizeList(["quickly", "away", "put", "out"]),
    phrases: ["no longer steward", "taketh away", "sit down quickly", "put out"],
  },
  {
    key: "agency",
    label: "Agency / Action",
    tokens: normalizeList([
      "called",
      "said",
      "give",
      "resolved",
      "do",
      "take",
      "sit",
      "write",
      "receive",
      "commended",
    ]),
    phrases: ["I am resolved", "take thy bill"],
  },
  {
    key: "welcome",
    label: "Social Future",
    tokens: normalizeList(["receive", "houses", "lord", "debtors"]),
    phrases: ["receive me into their houses"],
  },
];

export const THEME_CONFIG: ThemeConfig[] = [
  {
    key: "accountability",
    label: "Accountability",
    tokens: normalizeList(["accused", "account", "stewardship", "steward"]),
    phrases: ["give an account", "no longer steward"],
  },
  {
    key: "urgency",
    label: "Urgency",
    tokens: normalizeList(["quickly", "away", "put", "out"]),
    phrases: ["taketh away", "sit down quickly", "no longer steward"],
  },
  {
    key: "limits",
    label: "Limits",
    tokens: normalizeList(["cannot", "dig", "beg", "ashamed"]),
    phrases: ["I cannot dig", "to beg I am ashamed"],
  },
  {
    key: "foresight",
    label: "Foresight",
    tokens: normalizeList(["resolved", "receive", "do"]),
    phrases: ["I am resolved", "when I am put out"],
  },
  {
    key: "welcome",
    label: "Welcome",
    tokens: normalizeList(["receive", "houses"]),
    phrases: ["receive me into their houses"],
  },
  {
    key: "risk",
    label: "Risk",
    tokens: normalizeList(["unjust", "wasted", "accused"]),
    phrases: ["unjust steward"],
  },
  {
    key: "reputation",
    label: "Reputation",
    tokens: normalizeList(["commended", "wisely", "wiser", "accused", "hear"]),
    phrases: ["the lord commended"],
  },
];

export function buildVerseData(passage: Verse[]): VerseData[] {
  return passage.map((verse) => {
    const tokens = tokenize(verse.t);
    const tokenIndices: Record<string, number[]> = {};
    tokens.forEach((token, index) => {
      if (!tokenIndices[token]) tokenIndices[token] = [];
      tokenIndices[token].push(index);
    });
    return { verse: verse.v, text: verse.t, tokens, tokenIndices };
  });
}

export function findPhraseMatches(tokens: string[], phraseTokens: string[]): Array<[number, number]> {
  if (phraseTokens.length === 0) return [];
  const matches: Array<[number, number]> = [];
  for (let i = 0; i <= tokens.length - phraseTokens.length; i += 1) {
    let isMatch = true;
    for (let j = 0; j < phraseTokens.length; j += 1) {
      if (tokens[i + j] !== phraseTokens[j]) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      matches.push([i, i + phraseTokens.length - 1]);
    }
  }
  return matches;
}

function getTokenHits(verseData: VerseData, tokenSet: Set<string>) {
  const indices: number[] = [];
  const matchedTokens: string[] = [];
  Object.entries(verseData.tokenIndices).forEach(([token, idxs]) => {
    if (tokenSet.has(token)) {
      matchedTokens.push(token);
      indices.push(...idxs);
    }
  });
  return {
    count: indices.length,
    tokens: matchedTokens,
    indices,
  };
}

function getPhraseHits(verseData: VerseData, phrases: string[]) {
  const phraseHits: PhraseHit[] = [];
  const phraseRanges: Array<[number, number]> = [];
  phrases.forEach((phrase) => {
    const phraseTokens = tokenize(phrase);
    const matches = findPhraseMatches(verseData.tokens, phraseTokens);
    matches.forEach(([start, end]) => {
      phraseHits.push({ phrase, start, end });
      phraseRanges.push([start, end]);
    });
  });
  return {
    count: phraseHits.length,
    phrases: phraseHits,
    phraseRanges,
  };
}

export function computeFeatureMetrics(
  verseData: VerseData[],
  featureConfigs: FeatureConfig[],
  weights: Record<string, number>,
  phraseWeight = 2
): VerseFeatureMetrics[] {
  return verseData.map((verse) => {
    const features: Record<string, FeatureHit> = {};
    let totalScore = 0;
    const contributingIndices: number[] = [];
    const contributingTokens: string[] = [];

    const expandRanges = (ranges: Array<[number, number]>) => {
      const expanded: number[] = [];
      ranges.forEach(([start, end]) => {
        for (let i = start; i <= end; i += 1) {
          expanded.push(i);
        }
      });
      return expanded;
    };

    featureConfigs.forEach((feature) => {
      const tokenSet = new Set(feature.tokens.map((token) => normalizeToken(token)));
      const tokenHits = getTokenHits(verse, tokenSet);
      const phraseHits = getPhraseHits(verse, feature.phrases ?? []);
      const weight = weights[feature.key] ?? 1;
      const score = weight * (tokenHits.count + phraseWeight * phraseHits.count);
      totalScore += score;
      contributingIndices.push(...tokenHits.indices, ...expandRanges(phraseHits.phraseRanges));
      contributingTokens.push(...tokenHits.tokens);

      features[feature.key] = {
        tokenHits: tokenHits.count,
        phraseHits: phraseHits.count,
        tokens: tokenHits.tokens,
        phrases: phraseHits.phrases,
        indices: tokenHits.indices,
        phraseRanges: phraseHits.phraseRanges,
        score,
      };
    });

    return {
      verse: verse.verse,
      totalScore,
      features,
      contributingIndices: Array.from(new Set(contributingIndices)).sort((a, b) => a - b),
      contributingTokens: Array.from(new Set(contributingTokens)).sort(),
    };
  });
}

export function computeThemeAggregate(
  verseData: VerseData[],
  themes: ThemeConfig[],
  phraseWeight = 2
): ThemeAggregate[] {
  return themes.map((theme) => {
    let tokenHits = 0;
    let phraseHits = 0;
    const tokens: string[] = [];
    const phrases: PhraseHit[] = [];
    const occurrences: Array<{ verse: number; indices: number[]; phraseRanges: Array<[number, number]> }> = [];
    const tokenSet = new Set(theme.tokens.map((token) => normalizeToken(token)));

    verseData.forEach((verse) => {
      const tokenHit = getTokenHits(verse, tokenSet);
      const phraseHit = getPhraseHits(verse, theme.phrases);
      tokenHits += tokenHit.count;
      phraseHits += phraseHit.count;
      tokens.push(...tokenHit.tokens);
      phrases.push(...phraseHit.phrases);
      occurrences.push({
        verse: verse.verse,
        indices: tokenHit.indices,
        phraseRanges: phraseHit.phraseRanges,
      });
    });

    return {
      key: theme.key,
      label: theme.label,
      tokenHits,
      phraseHits,
      score: tokenHits + phraseWeight * phraseHits,
      tokens: Array.from(new Set(tokens)).sort(),
      phrases,
      occurrences,
    };
  });
}
