"use client";
import { NEIGHBOURHOODS, LINES } from "@/lib/neighbourhoods";

export function TransitChips({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((k) => {
        const L = LINES[k];
        if (!L) return null;
        return (
          <span className="chip chip-transit" key={k}>
            <span className="chip-dot" style={{ background: L.color }} />
            {L.label}
          </span>
        );
      })}
    </>
  );
}

export function CheatSheet() {
  return (
    <details className="panel cheat" open>
      <summary>Toronto cheat sheet <span className="car">&rsaquo;</span></summary>
      <div className="cheat-body">
        <details className="cheat-sec" open>
          <summary>Know your rights</summary>
          <div className="rule"><b>Deposits.</b> A landlord can legally ask for two things: last month&rsquo;s rent (capped at exactly one month&rsquo;s rent) and a key/fob deposit (capped at the actual replacement cost, refunded when you hand the keys back). Interest is owed on the rent deposit every year, at that year&rsquo;s rent-increase guideline rate.</div>
          <div className="rule"><b>No other deposit.</b> A &ldquo;damage deposit,&rdquo; &ldquo;security deposit,&rdquo; or non-refundable application/holding fee isn&rsquo;t part of Ontario&rsquo;s rules — treat a request for one as a question to ask, not a fee to just pay.</div>
          <div className="rule"><b>Rent control.</b> Units first occupied on or after <b>November 15, 2018</b> are exempt from the province&rsquo;s annual rent-increase cap. Ask for the occupancy certificate, or check whether the increase notice is a Form N1 (capped) or N2 (exempt).</div>
        </details>
        <details className="cheat-sec">
          <summary>Spot a scam early</summary>
          <div className="rule">Common signs: being asked to pay before you&rsquo;ve seen the place, a &ldquo;landlord&rdquo; who won&rsquo;t meet or video-call, requests for wire transfers / e-transfer to a stranger / crypto / gift cards, rent noticeably below similar units nearby, pressure to sign or pay right now, and no standard Ontario lease being offered. One alone isn&rsquo;t damning — several together is. See the Safety tab on each listing.</div>
        </details>
        <details className="cheat-sec">
          <summary>Buying a home</summary>
          <div className="rule"><b>Land transfer tax.</b> Toronto buyers pay both the provincial tax and a matching municipal tax on top — roughly double what buyers elsewhere in Ontario pay. First-time buyers get up to $4,000 back provincially and up to $4,475 back from the city. The tool estimates this automatically once you enter a price.</div>
          <div className="rule"><b>Deposit protection.</b> Deposits must sit in a brokerage&rsquo;s or lawyer&rsquo;s segregated trust account, never a personal account — that&rsquo;s Ontario law (TRESA). A late email &ldquo;changing&rdquo; the wire instructions is one of the most common closing-day frauds; always confirm by phone before sending money.</div>
          <div className="rule"><b>Status certificate.</b> For any condo, request and read the status certificate before waiving conditions — it discloses the reserve fund&rsquo;s health, any special assessments, and fee arrears. The corporation must provide it within 10 days for up to $100. A thin reserve fund is often a preview of a special assessment.</div>
        </details>
        <details className="cheat-sec">
          <summary>Neighbourhoods at a glance</summary>
          <div>
            {NEIGHBOURHOODS.map((h) => (
              <div className="hood-row" key={h.id}>
                <div className="hn">{h.name} <span className="tier">{h.tier}</span></div>
                <div className="hv">{h.note}</div>
                {h.caution && <div className="hood-caution">{h.caution}</div>}
                <div style={{ marginTop: 5, display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <TransitChips lines={h.lines} />
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </details>
  );
}
