import { useEffect, useMemo, useState } from "react";
import type { FeatureConfig, VerseFeatureMetrics } from "../analysis/metrics";

interface PressureTimelineProps {
 metrics: VerseFeatureMetrics[];
 features: FeatureConfig[];
 weights: Record<string, number>;
 activeVerse: number | null;
 onBarClick: (verse: number, indices: number[], tokens: string[]) => void;
 themeHighlightVerses?: Set<number>;
}

export default function PressureTimeline({
 metrics,
 features,
 weights,
 activeVerse,
 onBarClick,
 themeHighlightVerses,
}: PressureTimelineProps) {
 const [selectedVerse, setSelectedVerse] = useState<number>(1);

 useEffect(() => {
 if (activeVerse) {
 setSelectedVerse(activeVerse);
 }
 }, [activeVerse]);

 const maxScore = useMemo(() => {
 return Math.max(...metrics.map((metric) => metric.totalScore), 1);
 }, [metrics]);

 const selectedMetric = metrics.find((metric) => metric.verse === selectedVerse) ?? metrics[0];

 return (
 <section className=" border border-slate-200 bg-panel p-6">
 <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
 <div>
 <h2 className="font-display text-2xl text-inkText">Narrative Intensity by Verse</h2>
          <p className="text-inkMuted text-sm max-w-xl">
            Each bar reflects how the verse pushes the story forward.
          </p>
 </div>
 </div>

 <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
 <div>
 <svg viewBox="0 0 520 180" className="w-full h-48">
 <defs>
 <linearGradient id="barGlow" x1="0" x2="0" y1="0" y2="1">
 <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
 <stop offset="100%" stopColor="#fdba74" stopOpacity="0.25" />
 </linearGradient>
 </defs>
 {metrics.map((metric, index) => {
 const barWidth = 40;
 const gap = 20;
 const x = 20 + index * (barWidth + gap);
 const height = (metric.totalScore / maxScore) * 120 + 8;
 const y = 150 - height;
 const isActive = activeVerse === metric.verse;
 const isSelected = selectedVerse === metric.verse;
 const isThemeHighlight = themeHighlightVerses?.has(metric.verse);
 const stroke = isActive ? "#f97316" : isThemeHighlight ? "#fb923c" : "none";
 return (
 <g key={metric.verse}>
 <rect
 x={x}
 y={y}
 width={barWidth}
 height={height}
 rx={10}
 fill="url(#barGlow)"
 stroke={stroke}
 strokeWidth={stroke === "none" ? 0 : 2}
 className={`transition-all duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}
 role="button"
 tabIndex={0}
 aria-label={`Verse ${metric.verse} pressure score`}
 onClick={() => {
 setSelectedVerse(metric.verse);
 onBarClick(metric.verse, metric.contributingIndices, metric.contributingTokens);
 }}
 onKeyDown={(event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 setSelectedVerse(metric.verse);
 onBarClick(metric.verse, metric.contributingIndices, metric.contributingTokens);
 }
 }}
 />
 <text x={x + barWidth / 2} y={165} textAnchor="middle" fill="#94a3b8" fontSize="12">
 v{metric.verse}
 </text>
 {isSelected && (
 <circle cx={x + barWidth / 2} cy={y - 6} r={4} fill="#fb923c" />
 )}
 </g>
 );
 })}
 </svg>

 <div className="mt-4 grid gap-3">
 <p className="text-xs uppercase tracking-[0.2em] text-inkMuted">Feature Legend</p>
 <p className="text-sm text-inkMuted">Audit & Accounting · Urgency & Time · Agency & Action · Future Welcome</p>
 </div>
 </div>

 <div className=" border border-slate-200 bg-panel2 p-4">
 <div className="flex items-center justify-between mb-3">
 <p className="text-xs uppercase tracking-[0.2em] text-inkMuted">Verse Breakdown</p>
 <span className="text-inkMuted text-sm">v{selectedMetric.verse}</span>
 </div>
 <p className="text-sm text-inkMuted mb-4">
 Weighted score is <span className="text-accent">{selectedMetric.totalScore.toFixed(2)}</span>
 </p>
 <div className="space-y-3">
 {features.map((feature) => {
 const detail = selectedMetric.features[feature.key];
 return (
 <div key={feature.key} className="border border-slate-200 p-3">
 <div className="flex items-center justify-between">
 <span className="text-sm text-inkText">{feature.label}</span>
 <span className="text-xs text-inkMuted">
 {detail.tokenHits} token hits · {detail.phraseHits} phrase hits
 </span>
 </div>
 <div className="text-xs text-inkMuted mt-2">
 Words {detail.tokens.length ? detail.tokens.join(", ") : "—"}
 </div>
 <div className="text-xs text-inkMuted mt-1">
 Phrases {detail.phrases.length ? detail.phrases.map((p) => p.phrase).join(" · ") : "—"}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </section>
 );
}
