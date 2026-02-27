import { useMemo, useState } from "react";
import type { Claim, Citation } from "../types";

interface ClaimsProps {
 claims: Claim[];
 onCitationClick: (citation: Citation, claim?: Claim) => void;
}

export default function Claims({ claims, onCitationClick }: ClaimsProps) {
 const [openClaimId, setOpenClaimId] = useState<string | null>(null);

 const filteredClaims = useMemo(() => {
 return claims.filter(
 (claim) =>
 claim.citations.length > 0 && claim.citations.every((citation) => citation.verses.length > 0)
 );
 }, [claims]);

 const renderClaim = (claim: Claim) => {
 const isOpen = openClaimId === claim.id;
 return (
 <div key={claim.id} className="border border-slate-200 p-4 bg-panel2">
 <p className="text-sm text-inkText">{claim.text}</p>
 <div className="flex flex-wrap gap-2 mt-3">
 {claim.citations.map((citation) => (
 <button
 key={citation.id}
 type="button"
 className="text-xs uppercase tracking-[0.2em] text-accent border border-accent/50 px-2 py-1 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
 onClick={() => {
 setOpenClaimId(claim.id);
 onCitationClick(citation, claim);
 }}
 >
 {citation.label}
 </button>
 ))}
 </div>
 {isOpen && (
 <div className="mt-3 border border-slate-200 p-3 bg-slate-50">
 <p className="text-xs uppercase tracking-[0.2em] text-inkMuted">Evidence</p>
 <ul className="mt-2 space-y-2 text-sm text-inkMuted">
 {claim.citations.flatMap((citation) =>
 citation.snippets.map((snippet, index) => (
 <li key={`${citation.id}-${index}`}>
 <span className="text-accent">v{snippet.verse}</span> · “{snippet.text}”
 </li>
 ))
 )}
 </ul>
 </div>
 )}
 </div>
 );
 };

 return (
 <section className=" border border-slate-200 bg-panel p-6">
      <div className="mb-4">
        <h2 className="font-display text-2xl text-inkText">My Reading</h2>
        <p className="text-inkMuted text-sm max-w-xl">
          These lines show how I understand the passage. Click a citation to see the verse.
        </p>
      </div>
 <div className="space-y-3">{filteredClaims.map(renderClaim)}</div>
 </section>
 );
}
