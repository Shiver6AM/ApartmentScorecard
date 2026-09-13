"use client";
import { useState } from "react";
import { Listing, Weights } from "@/lib/types";
import { HOOD_BY_ID, NEIGHBOURHOODS } from "@/lib/neighbourhoods";
import {
  BENCH_LABEL, BUY_BENCH_PSF, FACTORS, UNIT_TYPES, allFlags, factorScores, overallScore,
} from "@/lib/scoring";
import { Checkbox, Field, FlagIcon, SelectInput, TextInput } from "./ui";
import { TransitChips } from "./CheatSheet";

type Tab = "cost" | "location" | "unit" | "amenities" | "safety";

function numOrNull(v: string): number | null {
  return v === "" ? null : Number(v);
}

export function DetailCard({ listing, isNew, workNeighborhood, weights, onSave, onDelete, onClose }: {
  listing: Listing;
  isNew: boolean;
  workNeighborhood: string;
  weights: Weights;
  onSave: (l: Listing) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Listing>(listing);
  const [tab, setTab] = useState<Tab>("cost");
  const [pendingDelete, setPendingDelete] = useState(false);

  function set<K extends keyof Listing>(key: K, value: Listing[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const flags = isNew ? [] : allFlags(draft, workNeighborhood);
  const fs = factorScores(draft, workNeighborhood);
  const score = isNew ? null : overallScore(draft, weights, workNeighborhood);
  const hood = HOOD_BY_ID[draft.neighborhood];
  const isBuy = draft.listingType === "buy";

  return (
    <div className="card expanded">
      <div className="card-head">
        <div>
          <div className="card-name">
            {isNew ? "New listing" : draft.name || "Untitled listing"}
            {draft.isExample && <span className="example-tag"> Example</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {score !== null && (
            <div className="match-badge"><span className="mv mono">{score}</span><span className="ml">match</span></div>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button type="button" className={`btn${!isBuy ? " btn-primary" : ""}`} onClick={() => set("listingType", "rent")}>For rent</button>
        <button type="button" className={`btn${isBuy ? " btn-primary" : ""}`} onClick={() => set("listingType", "buy")}>For sale</button>
      </div>

      {flags.length > 0 && (
        <div className="flags-summary">
          {flags.map((f, i) => (
            <div className={`flag-line ${f.level}`} key={i}>
              <FlagIcon level={f.level} />
              <span dangerouslySetInnerHTML={{ __html: f.text }} />
            </div>
          ))}
        </div>
      )}

      {!isNew && (
        <div className="breakdown">
          {FACTORS.map((f) => {
            const v = fs[f.key];
            return (
              <div className="bd-row" key={f.key}>
                <span className="bd-label">{f.label}</span>
                <div className="bd-track"><div className="bd-fill" style={{ width: `${v}%` }} /></div>
                <span className="bd-val mono">{v}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="tabs">
        {(["cost", "location", "unit", "amenities", "safety"] as Tab[]).map((t) => (
          <button key={t} type="button" className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {{ cost: "Cost", location: "Neighbourhood", unit: "Unit", amenities: "Amenities", safety: "Safety check" }[t]}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(draft); }}>
        <div style={{ display: tab === "cost" ? "" : "none" }}>
          {isBuy ? (
            <CostTabBuy draft={draft} set={set} />
          ) : (
            <CostTabRent draft={draft} set={set} />
          )}
        </div>

        <div style={{ display: tab === "location" ? "" : "none" }}>
          <div className="field-grid">
            <Field label="Neighbourhood" htmlFor="f-neighborhood">
              <SelectInput id="f-neighborhood" value={draft.neighborhood} onChange={(v) => set("neighborhood", v)}
                options={[{ value: "", label: "— choose —" }, ...NEIGHBOURHOODS.map((h) => ({ value: h.id, label: `${h.name} (${h.tier})` }))]} />
            </Field>
            <Field label="Closest station / stop" htmlFor="f-closestStop"><TextInput id="f-closestStop" value={draft.closestStop} onChange={(v) => set("closestStop", v)} /></Field>
            <Field label="Commute destination (e.g. work)" htmlFor="f-commuteLabel"><TextInput id="f-commuteLabel" value={draft.commuteLabel} onChange={(v) => set("commuteLabel", v)} /></Field>
            <Field label="Commute time (minutes)" htmlFor="f-commuteMinutes"><TextInput id="f-commuteMinutes" type="number" value={draft.commuteMinutes} onChange={(v) => set("commuteMinutes", numOrNull(v))} /></Field>
            <Field label="Listed how many days ago? (if known)" htmlFor="f-listedDaysAgo"><TextInput id="f-listedDaysAgo" type="number" value={draft.listedDaysAgo} onChange={(v) => set("listedDaysAgo", numOrNull(v))} /></Field>
          </div>
          <div className="subgrid" style={{ marginTop: 14 }}>
            <Checkbox id="f-busyRoadFacing" checked={draft.busyRoadFacing} onChange={(v) => set("busyRoadFacing", v)} label="Faces a major road/highway, or streetcar/train tracks" />
          </div>
          {hood ? (
            <div className="hood-preview">
              Lifestyle scores for <b>{hood.name}</b> come from the cheat sheet profile — transit, walkability, safety, grocery access, noise, food, nightlife, parks and dog-friendliness all feed the match score automatically.
              {hood.caution && <><br /><b>Note:</b> {hood.caution}</>}
              <div style={{ marginTop: 6, display: "flex", gap: 5, flexWrap: "wrap" }}><TransitChips lines={hood.lines} /></div>
            </div>
          ) : (
            <div className="hood-preview">Pick a neighbourhood to pull in its full lifestyle profile (transit, walkability, safety, groceries, noise, food, nightlife, parks, dogs).</div>
          )}
        </div>

        <div style={{ display: tab === "unit" ? "" : "none" }}>
          <div className="field-grid">
            <Field label="Bedrooms" htmlFor="f-bedrooms"><TextInput id="f-bedrooms" type="number" value={draft.bedrooms} onChange={(v) => set("bedrooms", numOrNull(v))} /></Field>
            <Field label="Bathrooms" htmlFor="f-bathrooms"><TextInput id="f-bathrooms" type="number" value={draft.bathrooms} onChange={(v) => set("bathrooms", numOrNull(v))} /></Field>
            <Field label="Size (sqft)" htmlFor="f-sqft"><TextInput id="f-sqft" type="number" value={draft.sqft} onChange={(v) => set("sqft", numOrNull(v))} /></Field>
            <Field label="Floor" htmlFor="f-floor"><TextInput id="f-floor" type="number" value={draft.floor} onChange={(v) => set("floor", numOrNull(v))} /></Field>
            <Field label="Unit type" htmlFor="f-buildingType">
              <SelectInput id="f-buildingType" value={draft.buildingType} onChange={(v) => set("buildingType", v)}
                options={[{ value: "", label: "— choose —" }, ...UNIT_TYPES.map((t) => ({ value: t, label: t }))]} />
            </Field>
            <Field label="Year first occupied (rent control)" htmlFor="f-occupancyYear"><TextInput id="f-occupancyYear" type="number" value={draft.occupancyYear} onChange={(v) => set("occupancyYear", numOrNull(v))} /></Field>
            <Field label="Heating type" htmlFor="f-heating"><TextInput id="f-heating" value={draft.heating} onChange={(v) => set("heating", v)} /></Field>
            <Field label="Laundry" htmlFor="f-laundry">
              <SelectInput id="f-laundry" value={draft.laundry} onChange={(v) => set("laundry", v)}
                options={["in-unit", "shared in building", "none nearby"].map((o) => ({ value: o, label: o }))} />
            </Field>
          </div>
          <div className="subgrid" style={{ marginTop: 14 }}>
            <Checkbox id="f-ac" checked={draft.ac} onChange={(v) => set("ac", v)} label="Air conditioning" />
            <Checkbox id="f-elevator" checked={draft.elevator} onChange={(v) => set("elevator", v)} label="Elevator (n/a for houses)" />
          </div>
        </div>

        <div style={{ display: tab === "amenities" ? "" : "none" }}>
          <div className="subgrid">
            <Checkbox id="f-amGym" checked={draft.amGym} onChange={(v) => set("amGym", v)} label="Gym" />
            <Checkbox id="f-amPool" checked={draft.amPool} onChange={(v) => set("amPool", v)} label="Pool" />
            <Checkbox id="f-amConcierge" checked={draft.amConcierge} onChange={(v) => set("amConcierge", v)} label="Concierge / security desk" />
            <Checkbox id="f-amPackage" checked={draft.amPackage} onChange={(v) => set("amPackage", v)} label="Package room" />
            <Checkbox id="f-amBike" checked={draft.amBike} onChange={(v) => set("amBike", v)} label="Bike storage" />
            <Checkbox id="f-amVisitorParking" checked={draft.amVisitorParking} onChange={(v) => set("amVisitorParking", v)} label="Visitor parking" />
            <Checkbox id="f-amRooftop" checked={draft.amRooftop} onChange={(v) => set("amRooftop", v)} label="Rooftop / patio" />
            <Checkbox id="f-amDishwasher" checked={draft.amDishwasher} onChange={(v) => set("amDishwasher", v)} label="Dishwasher" />
            <Checkbox id="f-amLocker" checked={draft.amLocker} onChange={(v) => set("amLocker", v)} label="Storage locker available" />
            <Checkbox id="f-amPetFriendly" checked={draft.amPetFriendly} onChange={(v) => set("amPetFriendly", v)} label="Pet friendly" />
          </div>
          <div className="field-grid" style={{ marginTop: 14 }}>
            <Field label="Pet fee, if any ($)" htmlFor="f-petFee"><TextInput id="f-petFee" type="number" value={draft.petFee} onChange={(v) => set("petFee", numOrNull(v))} /></Field>
          </div>
        </div>

        <div style={{ display: tab === "safety" ? "" : "none" }}>
          {isBuy ? <SafetyTabBuy draft={draft} set={set} /> : <SafetyTabRent draft={draft} set={set} />}
        </div>

        <Field label="Notes" htmlFor="f-notes" wide>
          <textarea id="f-notes" value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>

        <div className="form-actions">
          <label className="field" style={{ maxWidth: 160 }}>
            <label htmlFor="f-status">Status</label>
            <select id="f-status" value={draft.status} onChange={(e) => set("status", e.target.value as Listing["status"])}>
              {["researching", "toured", "applied", "offer received", "rejected"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <span className="spacer" />
          {!isNew && (
            <button type="button" className="btn btn-danger" onClick={() => { if (pendingDelete) onDelete(); else setPendingDelete(true); }}>
              {pendingDelete ? "Really delete?" : "Delete"}
            </button>
          )}
          <button type="submit" className="btn btn-primary">Save listing</button>
        </div>
      </form>
    </div>
  );
}

function CostTabRent({ draft, set }: { draft: Listing; set: <K extends keyof Listing>(k: K, v: Listing[K]) => void }) {
  return (
    <>
      <div className="field-grid">
        <Field label="Listing name / address" htmlFor="f-name" wide><TextInput id="f-name" value={draft.name} onChange={(v) => set("name", v)} /></Field>
        <Field label="Listing URL (optional)" htmlFor="f-sourceUrl" wide><TextInput id="f-sourceUrl" value={draft.sourceUrl} onChange={(v) => set("sourceUrl", v)} /></Field>
        <Field label="Rent ($/month)" htmlFor="f-rent"><TextInput id="f-rent" type="number" value={draft.rent} onChange={(v) => set("rent", numOrNull(v))} /></Field>
        <Field label="Unit type (for benchmark)" htmlFor="f-bedroomType">
          <SelectInput id="f-bedroomType" value={draft.bedroomType} onChange={(v) => set("bedroomType", v)}
            options={Object.keys(BENCH_LABEL).map((k) => ({ value: k, label: BENCH_LABEL[k] }))} />
        </Field>
        <Field label="Parking ($/month, blank if none)" htmlFor="f-parkingCost"><TextInput id="f-parkingCost" type="number" value={draft.parkingCost} onChange={(v) => set("parkingCost", numOrNull(v))} /></Field>
        <Field label="Locker ($/month, blank if none)" htmlFor="f-lockerCost"><TextInput id="f-lockerCost" type="number" value={draft.lockerCost} onChange={(v) => set("lockerCost", numOrNull(v))} /></Field>
        <Field label="Last month's rent deposit asked ($)" htmlFor="f-lastMonthDeposit"><TextInput id="f-lastMonthDeposit" type="number" value={draft.lastMonthDeposit} onChange={(v) => set("lastMonthDeposit", numOrNull(v))} /></Field>
        <Field label="Key / fob deposit asked ($)" htmlFor="f-keyDeposit"><TextInput id="f-keyDeposit" type="number" value={draft.keyDeposit} onChange={(v) => set("keyDeposit", numOrNull(v))} /></Field>
        <Field label="Any other deposit asked ($)" htmlFor="f-otherDepositAmount"><TextInput id="f-otherDepositAmount" type="number" value={draft.otherDepositAmount} onChange={(v) => set("otherDepositAmount", numOrNull(v))} /></Field>
        <Field label="...what did they call it?" htmlFor="f-otherDepositDesc"><TextInput id="f-otherDepositDesc" value={draft.otherDepositDesc} onChange={(v) => set("otherDepositDesc", v)} /></Field>
      </div>
      <div className="subgrid" style={{ marginTop: 14 }}>
        <Checkbox id="f-utilHeat" checked={draft.utilHeat} onChange={(v) => set("utilHeat", v)} label="Heat included" />
        <Checkbox id="f-utilWater" checked={draft.utilWater} onChange={(v) => set("utilWater", v)} label="Water included" />
        <Checkbox id="f-utilHydro" checked={draft.utilHydro} onChange={(v) => set("utilHydro", v)} label="Hydro/electricity included" />
        <Checkbox id="f-utilInternet" checked={draft.utilInternet} onChange={(v) => set("utilInternet", v)} label="Internet included" />
        <Checkbox id="f-applicationFeeAsked" checked={draft.applicationFeeAsked} onChange={(v) => set("applicationFeeAsked", v)} label="An application / holding fee was requested" />
      </div>
      <div className="field-grid" style={{ marginTop: 14 }}>
        <Field label="Est. cost of utilities NOT included ($/month)" htmlFor="f-utilEstMonthly"><TextInput id="f-utilEstMonthly" type="number" value={draft.utilEstMonthly} onChange={(v) => set("utilEstMonthly", numOrNull(v))} /></Field>
      </div>
      <p style={{ marginTop: 10, color: "var(--ink-muted)", fontSize: ".78rem" }}>Added to the all-in monthly cost so a unit with nothing included doesn&rsquo;t look artificially cheap next to one that bundles utilities in.</p>
    </>
  );
}

function CostTabBuy({ draft, set }: { draft: Listing; set: <K extends keyof Listing>(k: K, v: Listing[K]) => void }) {
  return (
    <>
      <div className="field-grid">
        <Field label="Listing name / address" htmlFor="f-name" wide><TextInput id="f-name" value={draft.name} onChange={(v) => set("name", v)} /></Field>
        <Field label="Listing URL (optional)" htmlFor="f-sourceUrl" wide><TextInput id="f-sourceUrl" value={draft.sourceUrl} onChange={(v) => set("sourceUrl", v)} /></Field>
        <Field label="Purchase price ($)" htmlFor="f-price"><TextInput id="f-price" type="number" value={draft.price} onChange={(v) => set("price", numOrNull(v))} /></Field>
        <Field label="Condo/maintenance fees ($/month, 0 if none)" htmlFor="f-condoFees"><TextInput id="f-condoFees" type="number" value={draft.condoFees} onChange={(v) => set("condoFees", numOrNull(v))} /></Field>
        <Field label="Property tax ($/year)" htmlFor="f-propertyTaxAnnual"><TextInput id="f-propertyTaxAnnual" type="number" value={draft.propertyTaxAnnual} onChange={(v) => set("propertyTaxAnnual", numOrNull(v))} /></Field>
        <Field label="Parking, if extra ($/month)" htmlFor="f-parkingCost"><TextInput id="f-parkingCost" type="number" value={draft.parkingCost} onChange={(v) => set("parkingCost", numOrNull(v))} /></Field>
        <Field label="Locker, if extra ($/month)" htmlFor="f-lockerCost"><TextInput id="f-lockerCost" type="number" value={draft.lockerCost} onChange={(v) => set("lockerCost", numOrNull(v))} /></Field>
        <Field label="Deposit asked (% of price)" htmlFor="f-depositPct"><TextInput id="f-depositPct" type="number" value={draft.depositPct} onChange={(v) => set("depositPct", numOrNull(v))} /></Field>
      </div>
      <div className="subgrid" style={{ marginTop: 14 }}>
        <Checkbox id="f-firstTimeBuyer" checked={draft.firstTimeBuyer} onChange={(v) => set("firstTimeBuyer", v)} label="I'm a first-time home buyer (for the land transfer tax rebate)" />
        <Checkbox id="f-reviewedStatusCertificate" checked={draft.reviewedStatusCertificate} onChange={(v) => set("reviewedStatusCertificate", v)} label="I've reviewed the status certificate (condos only)" />
        <Checkbox id="f-reserveFundConcern" checked={draft.reserveFundConcern} onChange={(v) => set("reserveFundConcern", v)} label="The reserve fund looks underfunded or was flagged as a concern" />
        <Checkbox id="f-specialAssessmentRecent" checked={draft.specialAssessmentRecent} onChange={(v) => set("specialAssessmentRecent", v)} label="A special assessment was disclosed" />
      </div>
      <p style={{ marginTop: 12, color: "var(--ink-muted)", fontSize: ".78rem" }}>Price &divide; size (entered in the Unit tab) is compared to the Toronto average condo price of ${BUY_BENCH_PSF}/sqft. Land transfer tax is estimated automatically after saving.</p>
    </>
  );
}

function SafetyTabRent({ draft, set }: { draft: Listing; set: <K extends keyof Listing>(k: K, v: Listing[K]) => void }) {
  return (
    <>
      <p style={{ color: "var(--ink-muted)", fontSize: ".85rem", margin: "0 0 12px" }}>Check anything that&rsquo;s true about this listing so far.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <Checkbox id="f-scPayBeforeView" checked={draft.scPayBeforeView} onChange={(v) => set("scPayBeforeView", v)} label="I was asked to pay before seeing the unit in person or on video" />
        <Checkbox id="f-scNoMeet" checked={draft.scNoMeet} onChange={(v) => set("scNoMeet", v)} label="The landlord won't meet in person or by video call" />
        <Checkbox id="f-scWireCryptoGift" checked={draft.scWireCryptoGift} onChange={(v) => set("scWireCryptoGift", v)} label="Payment requested by wire transfer, e-transfer to a stranger, crypto, or gift cards" />
        <Checkbox id="f-scBelowMarket" checked={draft.scBelowMarket} onChange={(v) => set("scBelowMarket", v)} label="Rent is noticeably below similar units nearby" />
        <Checkbox id="f-scPressure" checked={draft.scPressure} onChange={(v) => set("scPressure", v)} label="I'm being pressured to decide or pay right now" />
        <Checkbox id="f-scNoStandardLease" checked={draft.scNoStandardLease} onChange={(v) => set("scNoStandardLease", v)} label="No standard Ontario lease form is being offered" />
      </div>
    </>
  );
}

function SafetyTabBuy({ draft, set }: { draft: Listing; set: <K extends keyof Listing>(k: K, v: Listing[K]) => void }) {
  return (
    <>
      <p style={{ color: "var(--ink-muted)", fontSize: ".85rem", margin: "0 0 12px" }}>Deposit and closing wire fraud is the main real-money risk when buying — check anything that&rsquo;s true so far.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <Checkbox id="f-byWireToIndividual" checked={draft.byWireToIndividual} onChange={(v) => set("byWireToIndividual", v)} label="I was asked to wire the deposit to a person, not a lawyer's or brokerage's trust account" />
        <Checkbox id="f-byUnverifiedWireChange" checked={draft.byUnverifiedWireChange} onChange={(v) => set("byUnverifiedWireChange", v)} label="I got a late change to wire instructions by email that I haven't verified by phone" />
        <Checkbox id="f-byPressuredWaiveConditions" checked={draft.byPressuredWaiveConditions} onChange={(v) => set("byPressuredWaiveConditions", v)} label="I'm being pressured to waive conditions (inspection, financing, status certificate) quickly" />
        <Checkbox id="f-byNoLawyer" checked={draft.byNoLawyer} onChange={(v) => set("byNoLawyer", v)} label="No real estate lawyer is involved in this transaction" />
      </div>
    </>
  );
}
