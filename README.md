# Luke 16:1-8 Data-Driven Storytelling

An evidence-linked interactive interface for Luke 16:1–8 (The Shrewd Manager). Every claim and visualization traces back to the passage text.

## Stack
- Vite + React + TypeScript
- Tailwind CSS
- Custom SVG (no heavy chart libraries)

## Run
```bash
npm install
npm run dev
```

## Project Structure
- `src/passage.ts` — KJV passage text as verse array
- `src/analysis/tokenize.ts` — tokenization rules, stopwords
- `src/analysis/metrics.ts` — scoring + phrase matching
- `src/components/*` — interactive panels
- `src/App.tsx` — orchestration + evidence linking

## Acceptance Checks
1) Clicking a theme bar highlights exact tokens in text.
2) Clicking a verse bar highlights contributing tokens and opens breakdown.
3) Clicking any claim citation scrolls to verse(s) and highlights evidence.
4) All visible panels remain evidence-linked to the passage.
