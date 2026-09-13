"use client";
import { Listing } from "@/lib/types";
import { HOOD_BY_ID } from "@/lib/neighbourhoods";
import { costCompare, effectiveMonthly, flagBadgeCount, money, rentControl } from "@/lib/scoring";

export function hoodLabel(id: string) {
  const h = HOOD_BY_ID[id];
  return h ? h.name : id || "Neighbourhood not set";
}

export function SummaryCard({ l, score, workNeighborhood, onClick }: {
  l: Listing; score: number | null; workNeighborhood: string; onClick: () => void;
}) {
  const badgeCount = flagBadgeCount(l, workNeighborhood);
  const cc = costCompare(l);
  const isBuy = l.listingType === "buy";

  return (
    <div className="card" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <div className="card-head">
        <div>
          {l.isExample && <div className="example-tag">Example</div>}
          <div className="card-name">{l.name || "Untitled listing"}</div>
          <div className="card-hood">{hoodLabel(l.neighborhood)}</div>
        </div>
        <div className="match-badge">
          <span className="mv mono">{score === null ? "–" : score}</span>
          <span className="ml">match</span>
        </div>
      </div>

      {isBuy ? (
        <div className="card-price mono">
          {money(l.price)}
          <span style={{ fontSize: ".6rem", fontWeight: 500, color: "var(--ink-muted)" }}>
            {l.sqft ? ` · $${Math.round((l.price || 0) / l.sqft)}/sqft` : ""}
          </span>
        </div>
      ) : (
        <div className="card-price mono">
          {money(effectiveMonthly(l))}
          <span style={{ fontSize: ".6rem", fontWeight: 500, color: "var(--ink-muted)" }}>/mo all-in</span>
        </div>
      )}

      <div className="badge-row">
        {isBuy ? (
          <span className="chip chip-neutral">For sale</span>
        ) : (
          (() => {
            const rc = rentControl(l);
            return <span className={`chip chip-${rc.level}`}>{rc.level === "good" ? "Rent-controlled" : rc.level === "warn" ? "Not controlled" : "Control unknown"}</span>;
          })()
        )}
        {cc && <span className={`chip chip-${cc.level}`}>{cc.pct > 0 ? "+" : ""}{cc.pct}% vs avg</span>}
        {badgeCount ? <span className="chip chip-bad">{badgeCount} to check</span> : <span className="chip chip-good">No flags</span>}
      </div>

      <div className="card-specs">
        <span>{l.bedrooms ?? "?"} bd</span>
        <span>{l.bathrooms ?? "?"} ba</span>
        {l.sqft && <span>{l.sqft} sqft</span>}
      </div>
    </div>
  );
}
