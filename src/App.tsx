import { useEffect, useMemo, useRef, useState } from "react";
import passage from "./passage";
import TextPanel from "./components/TextPanel";
import PressureTimeline from "./components/PressureTimeline";
import ThemeMap from "./components/ThemeMap";
import Claims from "./components/Claims";
import {
 buildVerseData,
 computeFeatureMetrics,
 computeThemeAggregate,
 findPhraseMatches,
 PRESSURE_FEATURES,
 THEME_CONFIG,
} from "./analysis/metrics";
import type { HighlightRange, HighlightState, Claim, Citation } from "./types";
import { tokenize } from "./analysis/tokenize";

const defaultWeights = {
 audit: 1.2,
 urgency: 1.4,
 agency: 1.1,
 welcome: 1.0,
};

const claims: Claim[] = [
  {
    id: "i1",
    type: "Key takeaways",
    text: "The master demands an account and says he will no longer be steward.",
 citations: [
 {
 id: "i1a",
 label: "[v2]",
 verses: [2],
 phrases: ["give an account", "no longer steward"],
 snippets: [{ verse: 2, text: "give an account of thy stewardship" }],
 },
 ],
 },
 {
 id: "i2",
 type: "Key takeaways",
 text: "The manager is described as dishonest, yet is praised for acting shrewdly.",
 citations: [
 {
 id: "i2a",
 label: "[v8]",
 verses: [8],
 phrases: ["unjust steward", "the lord commended", "had done wisely"],
 snippets: [{ verse: 8, text: "the lord commended the unjust steward" }],
 },
 ],
 },
 {
 id: "i3",
 type: "Key takeaways",
 text: "He is too weak to dig and too ashamed to beg.",
 citations: [
 {
 id: "i3a",
 label: "[v3–4]",
 verses: [3, 4],
 phrases: ["I cannot dig", "I am resolved"],
 snippets: [
 { verse: 3, text: "I cannot dig; to beg I am ashamed" },
 { verse: 4, text: "I am resolved what to do" },
 ],
 },
 ],
 },
 {
 id: "i4",
 type: "Key takeaways",
 text: "The manager acts to be welcomed into homes.",
 citations: [
 {
 id: "i4a",
 label: "[v4]",
 verses: [4],
 phrases: ["receive me into their houses"],
 snippets: [{ verse: 4, text: "receive me into their houses" }],
 },
 ],
 },
  {
    id: "i5",
    type: "Key takeaways",
    text: "He moves quickly because his time is short.",
    citations: [
      {
        id: "i5a",
        label: "[v2, v6]",
        verses: [2, 6],
        phrases: ["no longer steward", "sit down quickly"],
        snippets: [
          { verse: 2, text: "thou mayest be no longer steward" },
          { verse: 6, text: "sit down quickly, and write fifty" },
        ],
      },
    ],
  },
];

export default function App() {
 const verseData = useMemo(() => buildVerseData(passage), []);
 const weights = defaultWeights;
 const [highlight, setHighlight] = useState<HighlightState | null>(null);
 const [activeVerse, setActiveVerse] = useState<number | null>(1);
 const [activeThemeKey, setActiveThemeKey] = useState<string | null>(null);
 const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});

 const safeClaims = useMemo(() => {
 return claims.filter(
 (claim) => claim.citations.length > 0 && claim.citations.every((citation) => citation.verses.length > 0)
 );
 }, []);

 const featureMetrics = useMemo(
 () => computeFeatureMetrics(verseData, PRESSURE_FEATURES, weights),
 [verseData, weights]
 );

 const themeAggregates = useMemo(() => computeThemeAggregate(verseData, THEME_CONFIG), [verseData]);

 const themeMapByKey = useMemo(() => {
 return themeAggregates.reduce((acc, theme) => {
 acc[theme.key] = theme;
 return acc;
 }, {} as Record<string, (typeof themeAggregates)[number]>);
 }, [themeAggregates]);

 const themeHighlightVerses = useMemo(() => {
 if (!activeThemeKey) return new Set<number>();
 const theme = themeMapByKey[activeThemeKey];
 if (!theme) return new Set<number>();
 const verses = theme.occurrences
 .filter((occ) => occ.indices.length || occ.phraseRanges.length)
 .map((occ) => occ.verse);
 return new Set(verses);
 }, [activeThemeKey, themeMapByKey]);

 const clearHighlight = () => setHighlight(null);

 const indicesToRanges = (verse: number, indices: number[]): HighlightRange[] => {
 const sorted = Array.from(new Set(indices)).sort((a, b) => a - b);
 const ranges: HighlightRange[] = [];
 let start = sorted[0];
 let prev = sorted[0];
 sorted.slice(1).forEach((value) => {
 if (value === prev + 1) {
 prev = value;
 } else {
 ranges.push({ verse, start, end: prev });
 start = value;
 prev = value;
 }
 });
 if (sorted.length) {
 ranges.push({ verse, start, end: prev });
 }
 return ranges;
 };

 const highlightTokensAcrossVerses = (tokens: string[], verses?: number[]) => {
 const ranges: HighlightRange[] = [];
 verseData.forEach((verse) => {
 if (verses && !verses.includes(verse.verse)) return;
 tokens.forEach((token) => {
 const indices = verse.tokenIndices[token] ?? [];
 ranges.push(...indicesToRanges(verse.verse, indices));
 });
 });
 setHighlight({ tokens: verses ? undefined : tokens, ranges });
 };

 const highlightPhrasesAcrossVerses = (phrases: string[], verses?: number[]) => {
 const ranges: HighlightRange[] = [];
 verseData.forEach((verse) => {
 if (verses && !verses.includes(verse.verse)) return;
 phrases.forEach((phrase) => {
 const phraseTokens = tokenize(phrase);
 const matches = findPhraseMatches(verse.tokens, phraseTokens);
 matches.forEach(([start, end]) => ranges.push({ verse: verse.verse, start, end }));
 });
 });
 setHighlight({ ranges });
 };

 const scrollToVerse = (verse: number) => {
 const ref = verseRefs.current[verse];
 if (ref) {
 ref.scrollIntoView({ behavior: "smooth", block: "center" });
 }
 };

 const handleCitationClick = (citation: Citation) => {
 if (citation.phrases?.length) {
 highlightPhrasesAcrossVerses(citation.phrases, citation.verses);
 } else if (citation.tokens?.length) {
 highlightTokensAcrossVerses(citation.tokens, citation.verses);
 }
 if (citation.verses[0]) {
 setActiveVerse(citation.verses[0]);
 scrollToVerse(citation.verses[0]);
 }
 };

 const handleWordClick = (token: string) => {
 setHighlight({ tokens: [token] });
 };

 const handlePhraseSelect = (phraseTokens: string[]) => {
 const ranges: HighlightRange[] = [];
 verseData.forEach((verse) => {
 const matches = findPhraseMatches(verse.tokens, phraseTokens);
 matches.forEach(([start, end]) => ranges.push({ verse: verse.verse, start, end }));
 });
 setHighlight({ ranges });
 };

 const handleBarClick = (verse: number, indices: number[]) => {
 setActiveVerse(verse);
 scrollToVerse(verse);
 setHighlight({ ranges: indicesToRanges(verse, indices) });
 };

 const handleThemeClick = (key: string) => {
 setActiveThemeKey(key);
 const theme = themeMapByKey[key];
 if (!theme) return;
 const ranges: HighlightRange[] = [];
 let firstVerse: number | null = null;
 theme.occurrences.forEach((occ) => {
 ranges.push(...indicesToRanges(occ.verse, occ.indices));
 occ.phraseRanges.forEach(([start, end]) => ranges.push({ verse: occ.verse, start, end }));
 if (firstVerse === null && (occ.indices.length || occ.phraseRanges.length)) {
 firstVerse = occ.verse;
 }
 });
 setHighlight({ ranges });
 if (firstVerse) {
 setActiveVerse(firstVerse);
 scrollToVerse(firstVerse);
 }
 };

 useEffect(() => {
 if (activeVerse) {
 scrollToVerse(activeVerse);
 }
 }, [activeVerse]);

 return (
 <div className="min-h-screen">
 <header className="px-6 py-10 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-inkMuted">New Testament Creative Interpretation</p>
        <h1 className="font-display text-4xl md:text-5xl text-inkText mt-3">Luke 16:1-8 · The Shrewd Manager</h1>
 </header>

 <main className="px-6 pb-16 max-w-6xl mx-auto space-y-8">
 <section className=" border border-slate-200 bg-panel p-6">
 <h2 className="font-display text-2xl text-inkText">How to Read This</h2>
          <div className="mt-3 text-sm text-inkMuted space-y-2">
            <p>1) Text panel is the source. Click words or phrases for exact matches.</p>
            <p>2) Charts and claims link to verses. Click a bar or citation.</p>
            <p>3) Theme scores use token hits plus phrase hits.</p>
          </div>
        </section>

 <TextPanel
 passage={passage}
 verseData={verseData}
 highlight={highlight}
 activeVerse={activeVerse}
 onWordClick={handleWordClick}
 onPhraseSelect={handlePhraseSelect}
 onClearHighlight={clearHighlight}
 verseRefs={verseRefs}
 />

 <PressureTimeline
 metrics={featureMetrics}
 features={PRESSURE_FEATURES}
 weights={weights}
 activeVerse={activeVerse}
 onBarClick={handleBarClick}
 themeHighlightVerses={themeHighlightVerses}
 />

 <ThemeMap
 themes={themeAggregates}
 activeVerse={activeVerse}
 onThemeClick={handleThemeClick}
 activeThemeKey={activeThemeKey}
 />

 <Claims claims={safeClaims} onCitationClick={(citation) => handleCitationClick(citation)} />

 </main>

 </div>
 );
}
