import { useMemo, useState } from "react";
import type { ThemeAggregate } from "../analysis/metrics";

interface ThemeMapProps {
 themes: ThemeAggregate[];
 activeVerse: number | null;
 onThemeClick: (key: string) => void;
 activeThemeKey: string | null;
}

export default function ThemeMap({ themes, activeVerse, onThemeClick, activeThemeKey }: ThemeMapProps) {
 const [selectedKey, setSelectedKey] = useState<string>(themes[0]?.key ?? "");

 const maxScore = useMemo(() => Math.max(...themes.map((theme) => theme.score), 1), [themes]);
 const selectedTheme = themes.find((theme) => theme.key === selectedKey) ?? themes[0];

 return (
 <section className=" border border-slate-200 bg-panel p-6">
 <div className="mb-4">
 <h2 className="font-display text-2xl text-inkText">Theme Map</h2>
 <p className="text-inkMuted text-sm max-w-xl">
 Theme scores use token hits plus two phrase hits. Click to trace evidence.
 </p>
 </div>
 <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
 <div className="space-y-3">
 {themes.map((theme) => {
 const isActive = activeThemeKey === theme.key;
 const isSelected = selectedKey === theme.key;
 const hasActiveVerse = activeVerse
 ? theme.occurrences.some((occ) => occ.verse === activeVerse && (occ.indices.length || occ.phraseRanges.length))
 : false;
 return (
 <button
 key={theme.key}
 type="button"
 onClick={() => {
 setSelectedKey(theme.key);
 onThemeClick(theme.key);
 }}
 className={`w-full text-left border p-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
 isSelected ? "border-accent" : "border-slate-200"
 } ${isActive ? "bg-accentSoft" : "bg-panel2"}`}
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-inkText">{theme.label}</span>
 <span className="text-xs text-inkMuted">{theme.score}</span>
 </div>
 <div className="h-2 w-full bg-slate-200 border border-slate-200 overflow-hidden">
 <div
 className={`h-full ${isActive ? "bg-accent" : "bg-accentSoft"} transition-all duration-300 ${
 hasActiveVerse ? "pulse" : ""
 }`}
 style={{ width: `${(theme.score / maxScore) * 100}%` }}
 />
 </div>
 <div className="text-xs text-inkMuted mt-2">
 {theme.tokenHits} token hits · {theme.phraseHits} phrase hits
 </div>
 </button>
 );
 })}
 </div>

 <div className=" border border-slate-200 bg-panel2 p-4">
 <div className="flex items-center justify-between mb-3">
 <p className="text-xs uppercase tracking-[0.2em] text-inkMuted">Theme Detail</p>
 <span className="text-inkText text-sm">{selectedTheme?.label}</span>
 </div>
 <div className="text-sm text-inkMuted space-y-3">
 <div>
 <p className="text-xs uppercase tracking-[0.2em] text-inkMuted mb-1">Words</p>
 <p>{selectedTheme?.tokens.length ? selectedTheme.tokens.join(", ") : "—"}</p>
 </div>
 <div>
 <p className="text-xs uppercase tracking-[0.2em] text-inkMuted mb-1">Phrases</p>
 <p>
 {selectedTheme?.phrases.length
 ? selectedTheme.phrases.map((phrase) => phrase.phrase).join(" · ")
 : "—"}
 </p>
 </div>
 <div>
 <p className="text-xs uppercase tracking-[0.2em] text-inkMuted mb-1">Raw Counts</p>
 <p>
 {selectedTheme?.tokenHits ?? 0} token hits + 2×{selectedTheme?.phraseHits ?? 0} phrase hits
 </p>
 </div>
 </div>
 </div>
 </div>
 </section>
 );
}
