"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Listing, Weights } from "@/lib/types";
import { DEFAULT_WEIGHTS, matchesFilters, overallScore } from "@/lib/scoring";
import { blankListing, seedExamples } from "@/lib/exampleListings";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { deleteListingRow, fetchListings, insertListing, subscribeToListings, updateListing } from "@/lib/listingsApi";
import { WeightSliders } from "@/components/WeightSliders";
import { WorkPanel } from "@/components/WorkPanel";
import { CheatSheet } from "@/components/CheatSheet";
import { FilterBar } from "@/components/FilterBar";
import { SummaryCard } from "@/components/SummaryCard";
import { DetailCard } from "@/components/DetailCard";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // Reading localStorage has to happen post-mount (it doesn't exist during SSR), so this
    // one-time hydration on mount is the correct pattern here, not the cascading-render case
    // the lint rule is meant to catch.
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value, loaded]);
  return [value, setValue] as const;
}

export default function Home() {
  const examples = useMemo(() => seedExamples(), []);
  const [listings, setListings] = useState<Listing[]>([]);
  const [weights, setWeights] = useLocalStorage<Weights>("apartment-match-weights", DEFAULT_WEIGHTS);
  const [workNeighborhood, setWorkNeighborhood] = useLocalStorage<string>("apartment-match-work", "");
  const [filterBedroomsArr, setFilterBedroomsArr] = useLocalStorage<string[]>("apartment-match-filter-bedrooms", []);
  const [filterTypesArr, setFilterTypesArr] = useLocalStorage<string[]>("apartment-match-filter-types", []);
  const filterBedrooms = useMemo(() => new Set(filterBedroomsArr), [filterBedroomsArr]);
  const filterTypes = useMemo(() => new Set(filterTypesArr), [filterTypesArr]);

  const [activeView, setActiveView] = useState<"grid" | "map">("grid");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // isSupabaseConfigured is a module-level constant (fixed at build/env time), so this can be
  // the initial state directly rather than set inside an effect.
  const [dbError, setDbError] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchListings().then((rows) => { if (!cancelled) setListings(rows); }).catch(() => setDbError(true));
    const unsub = subscribeToListings(() => {
      fetchListings().then((rows) => { if (!cancelled) setListings(rows); }).catch(() => setDbError(true));
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  const allRows = useMemo(() => examples.concat(listings), [examples, listings]);

  const visibleRows = useMemo(() => {
    const rows = allRows
      .filter((l) => matchesFilters(l, filterBedrooms, filterTypes) || l.id === expandedId)
      .map((l) => ({ l, score: overallScore(l, weights, workNeighborhood) }));
    rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [allRows, filterBedrooms, filterTypes, expandedId, weights, workNeighborhood]);

  async function handleSave(data: Listing) {
    const isExample = examples.some((x) => x.id === data.id);
    const existing = listings.some((x) => x.id === data.id);
    try {
      if (existing) {
        const updated = await updateListing(data.id, data);
        setListings((ls) => ls.map((x) => (x.id === data.id ? updated : x)));
      } else {
        const { id: _drop, ...rest } = data;
        void _drop;
        const created = await insertListing({ ...rest, id: "" } as Listing);
        setListings((ls) => ls.concat([created]));
      }
    } catch {
      // Supabase not configured / offline — fall back to local-only state
      if (existing) {
        setListings((ls) => ls.map((x) => (x.id === data.id ? data : x)));
      } else {
        const localId = "local-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        setListings((ls) => ls.concat([{ ...data, id: isExample ? localId : data.id || localId }]));
      }
    }
    setExpandedId(null);
  }

  async function handleDelete(id: string) {
    try { await deleteListingRow(id); } catch {}
    setListings((ls) => ls.filter((x) => x.id !== id));
    setExpandedId(null);
  }

  function toggleSet(arr: string[], key: string) {
    const s = new Set(arr);
    if (s.has(key)) s.delete(key); else s.add(key);
    return Array.from(s);
  }

  return (
    <div className="wrap">
      <div className="eyebrow">Toronto apartment hunting</div>
      <h1 className="title">Apartment Match</h1>
      <p className="lede">
        Set how much you care about each thing, and every listing — rentals or resale — gets ranked to fit.
        Cost and legal checks come from the listing itself; neighbourhood-level transit, walkability, food,
        nightlife, parks and dog-friendliness come from a built-in Toronto profile, since exact per-address
        data isn&rsquo;t modeled here.
      </p>

      <div className="howto">
        <b>Add a listing</b> with the button below — paste in details from a realtor.ca or rentals.ca page.
      </div>
      {dbError && (
        <div className="banner">
          {isSupabaseConfigured
            ? "Couldn't reach the database — listings you add will only be saved in this browser tab."
            : "No database connected yet — listings you add will only be saved in this browser tab until you set up Supabase (see the README)."}
          <button onClick={() => setDbError(false)}>dismiss</button>
        </div>
      )}

      <div className="layout">
        <div className="rail">
          <WeightSliders weights={weights} onChange={setWeights} onReset={() => setWeights({ ...DEFAULT_WEIGHTS })} />
          <WorkPanel value={workNeighborhood} onChange={setWorkNeighborhood} />
          <CheatSheet />
        </div>

        <div className="main-col">
          <div className="toolbar">
            <button className="btn btn-primary" onClick={() => setExpandedId("new")}>+ Add a listing</button>
            <div className="view-toggle" role="tablist" aria-label="View">
              <button type="button" className={`view-toggle-btn${activeView === "grid" ? " active" : ""}`} onClick={() => setActiveView("grid")}>List</button>
              <button type="button" className={`view-toggle-btn${activeView === "map" ? " active" : ""}`} onClick={() => setActiveView("map")}>Map</button>
            </div>
            <span className="count">{listings.length} listing{listings.length === 1 ? "" : "s"}</span>
          </div>
          <div className="toolbar-note">
            {activeView === "map" ? "Click a marker for details. Real OpenStreetMap tiles — pan and zoom like any map." : "Ranked by your weights above — highest match first."}
          </div>

          <FilterBar
            filterBedrooms={filterBedrooms}
            filterTypes={filterTypes}
            onToggleBedroom={(k) => setFilterBedroomsArr((arr) => toggleSet(arr, k))}
            onToggleType={(k) => setFilterTypesArr((arr) => toggleSet(arr, k))}
          />

          {activeView === "map" ? (
            <MapView
              listings={allRows}
              weights={weights}
              workNeighborhood={workNeighborhood}
              filterBedrooms={filterBedrooms}
              filterTypes={filterTypes}
              onViewListing={(id) => { setExpandedId(id); setActiveView("grid"); }}
              onSetWork={(id) => setWorkNeighborhood(id)}
            />
          ) : (
            <div className="listings-grid">
              {expandedId === "new" && (
                <DetailCard
                  listing={blankListing()}
                  isNew
                  workNeighborhood={workNeighborhood}
                  weights={weights}
                  onSave={handleSave}
                  onDelete={() => {}}
                  onClose={() => setExpandedId(null)}
                />
              )}
              {visibleRows.length === 0 && expandedId !== "new" && (
                <div className="empty">
                  {filterBedrooms.size || filterTypes.size
                    ? "No listings match the selected filters. Try clearing a filter above."
                    : "No listings yet. Add one above."}
                </div>
              )}
              {visibleRows.map(({ l, score }) =>
                l.id === expandedId ? (
                  <DetailCard
                    key={l.id}
                    listing={l}
                    isNew={false}
                    workNeighborhood={workNeighborhood}
                    weights={weights}
                    onSave={handleSave}
                    onDelete={() => handleDelete(l.id)}
                    onClose={() => setExpandedId(null)}
                  />
                ) : (
                  <SummaryCard
                    key={l.id}
                    l={l}
                    score={score}
                    workNeighborhood={workNeighborhood}
                    onClick={() => setExpandedId(l.id)}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>

      <p className="footnote">
        Average-rent benchmarks are Toronto-wide figures from September 2026 (studio $1,746 &middot; 1BR $2,097 &middot; 2BR $2,762 &middot; 3BR $3,625);
        the resale benchmark is $878/sqft, also mid-2026. Both drift over time. Transit/walkability/safety/grocery/noise/food/nightlife/parks/dog-friendliness
        are neighbourhood-level estimates from general knowledge of Toronto, not measured from the exact address or block — treat close scores as roughly tied.
        The safety score in particular is a rough general estimate, not a crime statistic; for the real published numbers see the{" "}
        <a href="https://data.tps.ca/" target="_blank" rel="noopener noreferrer">Toronto Police Public Safety Data Portal</a>.
        Deposit, rent-control and land-transfer-tax figures reflect Ontario/Toronto rules as of the same date and are estimates only; confirm anything
        time-sensitive with the Landlord and Tenant Board or your real estate lawyer. Neighbourhood coordinates on the map are approximate centroids, not
        surveyed boundaries.
      </p>
    </div>
  );
}
