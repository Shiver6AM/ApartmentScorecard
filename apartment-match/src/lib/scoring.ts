import { Factor, FactorKey, Flag, Listing, Weights } from "./types";
import { HOOD_BY_ID } from "./neighbourhoods";

/* ---------------- reference benchmarks ---------------- */

export const BENCH: Record<string, number> = { studio: 1746, "1br": 2097, "2br": 2762, "3br": 3625 };
export const BENCH_LABEL: Record<string, string> = { studio: "studio", "1br": "one-bedroom", "2br": "two-bedroom", "3br": "three-bedroom+" };
export const RENT_CUTOFF_YEAR = 2018;
export const BUY_BENCH_PSF = 878; // Toronto average condo/apartment $/sqft, mid-2026

export const UNIT_TYPES = [
  "Condo apartment", "Loft", "House (whole)", "House (upper/main floor unit)",
  "Basement apartment", "Semi-detached / townhouse", "Low-rise apartment (walk-up)",
  "Room in a shared home", "Other",
];
export const BEDROOM_BUCKETS = [
  { key: "0", label: "Studio" },
  { key: "1", label: "1" },
  { key: "2", label: "2" },
  { key: "3plus", label: "3+" },
];

export const FACTORS: Factor[] = [
  { key: "value", label: "Value for price" },
  { key: "commute", label: "Commute to work" },
  { key: "transit", label: "Transit access" },
  { key: "walkability", label: "Walkability" },
  { key: "safety", label: "Neighbourhood safety" },
  { key: "grocery", label: "Grocery & errands" },
  { key: "noise", label: "Quiet / low noise" },
  { key: "restaurants", label: "Restaurants" },
  { key: "entertainment", label: "Nightlife & entertainment" },
  { key: "parks", label: "Parks & green space" },
  { key: "dog", label: "Dog-friendliness" },
  { key: "unit", label: "Unit quality" },
];

export const DEFAULT_WEIGHTS: Weights = {
  value: 70, commute: 50, transit: 60, walkability: 55, safety: 45, grocery: 35,
  noise: 35, restaurants: 40, entertainment: 35, parks: 40, dog: 20, unit: 55,
};

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/* ---------------- land transfer tax ---------------- */

function bracketTax(price: number, brackets: [number, number][]) {
  let tax = 0, prev = 0;
  for (const [cap, rate] of brackets) {
    if (price > prev) { tax += (Math.min(price, cap) - prev) * rate; prev = cap; }
    if (price <= cap) break;
  }
  return tax;
}
export function provincialLTT(price: number) {
  return bracketTax(price, [[55000, .005], [250000, .01], [400000, .015], [2000000, .02], [Infinity, .025]]);
}
export function torontoLTT(price: number) {
  return bracketTax(price, [[55000, .005], [250000, .01], [400000, .015], [3000000, .02], [4000000, .044], [5000000, .0545], [10000000, .065], [20000000, .0755], [Infinity, .086]]);
}
export function landTransferTax(price: number | null, firstTimeBuyer: boolean) {
  if (!price) return null;
  const prov = provincialLTT(price), tor = torontoLTT(price);
  const provRebate = firstTimeBuyer ? Math.min(prov, 4000) : 0;
  const torRebate = firstTimeBuyer ? Math.min(tor, 4475) : 0;
  const total = prov + tor, rebate = provRebate + torRebate;
  return { provincial: prov, toronto: tor, total, rebate, net: Math.max(0, total - rebate) };
}

/* ---------------- cost ---------------- */

export function effectiveMonthly(l: Listing) {
  return (l.rent || 0) + (l.parkingCost || 0) + (l.lockerCost || 0) + (l.utilEstMonthly || 0);
}
export function monthlyCarrying(l: Listing) {
  return (l.condoFees || 0) + (l.propertyTaxAnnual || 0) / 12;
}

export function costCompare(l: Listing) {
  if (l.listingType === "buy") {
    if (!l.price || !l.sqft) return null;
    const psf = l.price / l.sqft;
    const pct = Math.round(((psf - BUY_BENCH_PSF) / BUY_BENCH_PSF) * 100);
    const level = pct <= -8 ? "good" : pct >= 8 ? "warn" : "neutral";
    const dir = pct > 0 ? "above" : pct < 0 ? "below" : "at";
    return { pct, level, bench: BUY_BENCH_PSF,
      text: `${pct === 0 ? "Right at" : Math.abs(pct) + "% " + dir} the Toronto average price/sqft for condos ($${BUY_BENCH_PSF}/sqft)` };
  }
  const bench = BENCH[l.bedroomType];
  if (!bench || !l.rent) return null;
  const eff = effectiveMonthly(l);
  const pct = Math.round(((eff - bench) / bench) * 100);
  const level = pct <= -8 ? "good" : pct >= 8 ? "warn" : "neutral";
  const dir = pct > 0 ? "above" : pct < 0 ? "below" : "at";
  return { pct, level, bench,
    text: `${pct === 0 ? "Right at" : Math.abs(pct) + "% " + dir} the Toronto average for a ${BENCH_LABEL[l.bedroomType]} ($${bench.toLocaleString("en-CA")})` };
}

/* ---------------- flags ---------------- */

export function rentControl(l: Listing): Flag {
  const y = Number(l.occupancyYear);
  if (!l.occupancyYear || !y) return { level: "neutral", text: "Rent control status unknown — ask when the unit was first occupied." };
  if (y > RENT_CUTOFF_YEAR) return { level: "warn", text: `Not rent-controlled — first occupied ${y}, after the Nov 15, 2018 cutoff. Rent can rise by any amount with 90 days' notice.` };
  if (y === RENT_CUTOFF_YEAR) return { level: "warn", text: "Borderline — occupied in 2018. Check the exact date against the Nov 15, 2018 cutoff." };
  return { level: "good", text: `Rent-controlled — first occupied ${y}. Annual increases are capped at the provincial guideline.` };
}

export function money(n: number | null | undefined) {
  return n || n === 0 ? "$" + Math.round(n).toLocaleString("en-CA") : "—";
}

export function depositFlags(l: Listing): Flag[] {
  const flags: Flag[] = [];
  if (l.rent && l.lastMonthDeposit && l.lastMonthDeposit > l.rent * 1.02) {
    flags.push({ level: "bad", text: `Last month's deposit asked (${money(l.lastMonthDeposit)}) is more than one month's rent — the legal max in Ontario is one month's rent.` });
  }
  if (l.otherDepositAmount) {
    flags.push({ level: "bad", text: `Also asking for ${money(l.otherDepositAmount)}${l.otherDepositDesc ? ` ("${l.otherDepositDesc}")` : ""} — only last month's rent + a refundable key deposit are allowed in Ontario.` });
  }
  if (l.applicationFeeAsked) {
    flags.push({ level: "warn", text: "An application or holding fee was requested — Ontario landlords generally can't charge this. Ask before paying." });
  }
  return flags;
}

export function scamCount(l: Listing) {
  return (["scPayBeforeView", "scNoMeet", "scWireCryptoGift", "scBelowMarket", "scPressure", "scNoStandardLease"] as const)
    .reduce((n, k) => n + (l[k] ? 1 : 0), 0);
}
export function buySafetyCount(l: Listing) {
  return (["byWireToIndividual", "byUnverifiedWireChange", "byPressuredWaiveConditions", "byNoLawyer"] as const)
    .reduce((n, k) => n + (l[k] ? 1 : 0), 0);
}

export function buyFlags(l: Listing): Flag[] {
  const flags: Flag[] = [];
  const ltt = landTransferTax(l.price, l.firstTimeBuyer);
  if (ltt) {
    flags.push({
      level: "neutral",
      text: `Estimated land transfer tax (provincial + Toronto): ${money(ltt.total)}${ltt.rebate ? ` minus ${money(ltt.rebate)} first-time buyer rebate = ${money(ltt.net)} net` : ""}. Confirm the exact figure with your lawyer.`,
    });
  }
  if (l.depositPct != null && (l.depositPct < 5 || l.depositPct > 10)) {
    flags.push({ level: "neutral", text: `Deposit asked is ${l.depositPct}% of price — typical Ontario deposits run 5–10%. Not illegal to differ, just worth understanding why.` });
  }
  if (l.buildingType && /condo/i.test(l.buildingType)) {
    if (!l.reviewedStatusCertificate) flags.push({ level: "warn", text: "Status certificate not yet reviewed — request it before waiving conditions (the corporation must provide it within 10 days, for up to $100)." });
    if (l.specialAssessmentRecent) flags.push({ level: "warn", text: "A recent special assessment was disclosed — ask why, and whether more are expected." });
    if (l.reserveFundConcern) flags.push({ level: "warn", text: "Reserve fund flagged as a concern — a poorly funded reserve often leads to a special assessment down the road." });
  }
  const bsc = buySafetyCount(l);
  if (bsc >= 2) flags.push({ level: "bad", text: `${bsc} wire-fraud/pressure signs are checked below — verify any payment instructions by phone before sending money.` });
  else if (bsc === 1) flags.push({ level: "warn", text: "One wire-fraud/pressure sign is checked below — worth a second look." });
  return flags;
}

export function commonInfoFlags(l: Listing, workNeighborhood: string): Flag[] {
  const out: Flag[] = [];
  const ci = commuteInfo(l, workNeighborhood);
  if (ci) out.push(ci);
  if (l.buildingType && /house|duplex|semi|town|row|low-rise|basement/i.test(l.buildingType)) {
    out.push({ level: "neutral", text: 'Ground-level/house-style unit — worth checking the city\'s <a href="https://www.toronto.ca/services-payments/water-environment/managing-rain-melted-snow/basement-flooding/basement-flooding-protection-program/basement-flooding-protection-program-map/" target="_blank" rel="noopener">basement flooding map</a> for this address.' });
  }
  if (l.listingType === "buy") {
    out.push({ level: "neutral", text: "Toronto requires short-term-rental (Airbnb-style) operators to register and only rent out their principal residence — a condo bought purely as a short-term-rental investment likely won't qualify, and the condo corporation may restrict it further regardless." });
  }
  if (l.listedDaysAgo != null) {
    const d = Number(l.listedDaysAgo);
    if (d >= 60) out.push({ level: "neutral", text: `Listed ${d} days ago — sitting a while; may be room to negotiate, or worth asking why.` });
    else if (d <= 3) out.push({ level: "neutral", text: `Listed ${d} day${d === 1 ? "" : "s"} ago — fresh, expect more competition if it's priced well.` });
    else out.push({ level: "neutral", text: `Listed ${d} days ago.` });
  }
  return out;
}

export function allFlags(l: Listing, workNeighborhood: string): Flag[] {
  const out: Flag[] = [];
  const cc = costCompare(l);
  if (cc) out.push(cc as unknown as Flag);
  if (l.listingType === "buy") {
    return [...out, ...buyFlags(l), ...commonInfoFlags(l, workNeighborhood)];
  }
  out.push(rentControl(l));
  out.push(...depositFlags(l));
  const sc = scamCount(l);
  if (sc >= 2) out.push({ level: "bad", text: `${sc} common scam signs are checked below — verify the listing and landlord in person before paying anything.` });
  else if (sc === 1) out.push({ level: "warn", text: "One scam sign is checked below — worth a second look." });
  out.push(...commonInfoFlags(l, workNeighborhood));
  return out;
}
export function flagBadgeCount(l: Listing, workNeighborhood: string) {
  return allFlags(l, workNeighborhood).filter((f) => f.level === "bad" || f.level === "warn").length;
}

/* ---------------- factor scoring ---------------- */

export function tierScore(t: number | undefined) {
  return t ? t * 20 - 10 : 50;
}

export function isSubwayLine(k: string) {
  return k === "line1" || k === "line2" || k === "line5";
}

export function commuteScore(l: Listing, workNeighborhood: string) {
  if (!workNeighborhood || !l.neighborhood) return 50;
  if (l.neighborhood === workNeighborhood) return 95;
  const lh = HOOD_BY_ID[l.neighborhood], wh = HOOD_BY_ID[workNeighborhood];
  if (!lh || !wh) return 50;
  const sharedSubway = lh.lines.some((x) => isSubwayLine(x) && wh.lines.includes(x));
  if (sharedSubway) return 85;
  const lhSubway = lh.lines.some(isSubwayLine), whSubway = wh.lines.some(isSubwayLine);
  if (lhSubway && whSubway) return 60;
  if (lhSubway || whSubway) return 45;
  return 30;
}

export function commuteInfo(l: Listing, workNeighborhood: string): Flag | null {
  if (!workNeighborhood || !l.neighborhood) return null;
  const workHood = HOOD_BY_ID[workNeighborhood];
  if (!workHood) return null;
  const score = commuteScore(l, workNeighborhood);
  let text: string;
  if (l.neighborhood === workNeighborhood) text = "Same neighbourhood as work — about as short a commute as it gets.";
  else if (score === 85) text = "Shares a subway/LRT line with your work neighbourhood — likely no transfer.";
  else if (score === 60) text = "Both near subway/LRT, but different lines — likely one transfer.";
  else if (score === 45) text = "Only one side has direct subway/LRT access — expect a longer, mixed commute.";
  else text = "Neither area has direct subway/LRT access — expect a streetcar/bus-based commute.";
  return { level: "neutral", text: `Commute vs. ${workHood.name}: ${text}` };
}

export function amenityCount(l: Listing) {
  return (["amGym", "amPool", "amConcierge", "amPackage", "amBike", "amVisitorParking", "amRooftop", "amDishwasher", "amLocker"] as const)
    .reduce((n, k) => n + (l[k] ? 1 : 0), 0);
}

export function factorScores(l: Listing, workNeighborhood: string): Record<FactorKey, number> {
  const hood = HOOD_BY_ID[l.neighborhood];
  const cc = costCompare(l);
  const valueScore = cc ? clamp(50 - cc.pct * 1.5, 0, 100) : 50;

  let unit = 40
    + (l.laundry === "in-unit" ? 15 : l.laundry === "shared in building" ? 5 : 0)
    + (l.ac ? 10 : 0) + (l.elevator ? 3 : 0)
    + Math.min(amenityCount(l) * 3, 20);
  if (l.sqft && l.bedrooms) unit += clamp((l.sqft / Math.max(l.bedrooms, 1) - 450) / 10, -15, 12);
  unit = clamp(unit, 0, 100);

  let noiseScore = tierScore(hood?.q);
  if (l.busyRoadFacing) noiseScore = clamp(noiseScore - 25, 0, 100);

  return {
    value: Math.round(valueScore),
    commute: Math.round(commuteScore(l, workNeighborhood)),
    transit: Math.round(tierScore(hood?.t)),
    walkability: Math.round(tierScore(hood?.w)),
    safety: Math.round(tierScore(hood?.s)),
    grocery: Math.round(tierScore(hood?.g)),
    noise: Math.round(noiseScore),
    restaurants: Math.round(tierScore(hood?.f)),
    entertainment: Math.round(tierScore(hood?.fun)),
    parks: Math.round(tierScore(hood?.p)),
    dog: Math.round(tierScore(hood?.d)),
    unit: Math.round(unit),
  };
}

export function overallScore(l: Listing, weights: Weights, workNeighborhood: string) {
  const fs = factorScores(l, workNeighborhood);
  let sumW = 0, sumWS = 0;
  FACTORS.forEach((f) => {
    const w = Math.max(0, Number(weights[f.key]) || 0);
    sumW += w; sumWS += w * fs[f.key];
  });
  return sumW > 0 ? Math.round(sumWS / sumW) : 50;
}

export function bedroomBucketOf(l: Listing): string | null {
  const n = l.bedrooms;
  if (n === null || n === undefined) return null;
  if (n <= 0) return "0";
  if (n === 1) return "1";
  if (n === 2) return "2";
  return "3plus";
}

export function matchesFilters(l: Listing, filterBedrooms: Set<string>, filterTypes: Set<string>) {
  if (filterBedrooms.size) {
    const b = bedroomBucketOf(l);
    if (!b || !filterBedrooms.has(b)) return false;
  }
  if (filterTypes.size) {
    if (!l.buildingType || !filterTypes.has(l.buildingType)) return false;
  }
  return true;
}
