import { useMemo, useRef, useState } from "react";
import type { Verse } from "../passage";
import type { VerseData } from "../analysis/metrics";
import type { HighlightState } from "../types";
import { STOPWORDS, segmentText, tokenize } from "../analysis/tokenize";

const METHOD_TEXT = {
 tokenize:
 "Words are lowercased and punctuation is stripped. Possessives drop the trailing 's.",
 match:
 "Word matches are exact normalized words. Phrase matches are contiguous sequences of words.",
 stopwords:
 "Stopwords are ignored for summary counts, not for evidence highlighting.",
};

interface TextPanelProps {
 passage: Verse[];
 verseData: VerseData[];
 highlight: HighlightState | null;
 activeVerse: number | null;
 onWordClick: (token: string) => void;
 onPhraseSelect: (phraseTokens: string[]) => void;
 onClearHighlight: () => void;
 verseRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
}

export default function TextPanel({
 passage,
 verseData,
 highlight,
 activeVerse,
 onWordClick,
 onPhraseSelect,
 onClearHighlight,
 verseRefs,
}: TextPanelProps) {
 const [showMethod, setShowMethod] = useState(false);
 const containerRef = useRef<HTMLDivElement | null>(null);

 const verseTokenSegments = useMemo(() => {
 return passage.map((verse) => ({
 verse: verse.v,
 segments: segmentText(verse.t),
 }));
 }, [passage]);

 const handleMouseUp = () => {
 const selection = window.getSelection();
 if (!selection || selection.isCollapsed) return;
 const container = containerRef.current;
 if (!container) return;
 if (!container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) {
 return;
 }
 const raw = selection.toString().trim();
 if (!raw) return;
 const phraseTokens = tokenize(raw);
 if (phraseTokens.length >= 2) {
 onPhraseSelect(phraseTokens);
 } else if (phraseTokens.length === 1) {
 onWordClick(phraseTokens[0]);
 }
 };

 const isHighlighted = (verse: number, wordIndex: number, token: string) => {
 if (!highlight) return false;
 if (highlight.tokens?.includes(token)) return true;
 if (highlight.ranges?.some((range) => range.verse === verse && wordIndex >= range.start && wordIndex <= range.end)) {
 return true;
 }
 return false;
 };

 return (
 <section className=" border border-slate-200 bg-panel p-6">
 <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
 <div>
 <h2 className="font-display text-2xl text-inkText">Text Panel (Primary Text)</h2>
 <p className="text-inkMuted text-sm max-w-xl">Click a word or select a phrase to highlight exact matches.</p>
 </div>
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={() => setShowMethod((prev) => !prev)}
 className="text-xs uppercase tracking-[0.2em] text-accent border border-accent/40 px-3 py-2 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
 >
 Method
 </button>
 <button
 type="button"
 onClick={onClearHighlight}
 className="text-xs uppercase tracking-[0.2em] text-inkMuted border border-slate-300 px-3 py-2 hover:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
 >
 Clear Highlight
 </button>
 </div>
 </div>

 {showMethod && (
 <div className="mb-6 border border-slate-200 bg-panel2 p-4 text-sm text-inkMuted">
 <p className="text-xs uppercase tracking-[0.2em] text-inkMuted">Method</p>
 <ul className="mt-2 space-y-2">
 <li>{METHOD_TEXT.tokenize}</li>
 <li>{METHOD_TEXT.match}</li>
 <li>{METHOD_TEXT.stopwords}</li>
 <li>
 Stopwords include <span className="text-inkMuted">{STOPWORDS.join(", ")}</span>
 </li>
 </ul>
 </div>
 )}

 <div ref={containerRef} onMouseUp={handleMouseUp} className="space-y-4">
 {verseTokenSegments.map((verseSeg, verseIndex) => {
 const verseNum = verseSeg.verse;
 let wordIndex = -1;
 return (
 <div
 key={verseNum}
 ref={(el) => {
 verseRefs.current[verseNum] = el;
 }}
 className={` border border-slate-200 bg-panel2 p-4 transition ${
 activeVerse === verseNum ? "verse-active" : ""
 }`}
 >
 <div className="flex gap-3">
 <span className="text-accent text-sm font-semibold w-8">{verseNum}</span>
 <p className="text-inkText leading-relaxed">
 {verseSeg.segments.map((segment, idx) => {
 if (!segment.isWord) {
 return <span key={`${verseNum}-seg-${idx}`}>{segment.text}</span>;
 }
 wordIndex += 1;
 const highlighted = isHighlighted(verseNum, wordIndex, segment.norm);
 const onActivate = () => onWordClick(segment.norm);
 return (
 <span
 key={`${verseNum}-word-${idx}`}
 role="button"
 tabIndex={0}
 aria-label={`Highlight ${segment.text}`}
 onClick={onActivate}
 onKeyDown={(event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 onActivate();
 }
 }}
 className={`token ${highlighted ? "is-highlight" : ""} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
 >
 {segment.text}
 </span>
 );
 })}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 </section>
 );
}
