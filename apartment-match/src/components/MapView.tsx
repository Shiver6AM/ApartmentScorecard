"use client";
import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { NEIGHBOURHOODS, HOOD_BY_ID } from "@/lib/neighbourhoods";
import { Listing, Weights } from "@/lib/types";
import { effectiveMonthly, money, overallScore, matchesFilters } from "@/lib/scoring";
import { hoodLabel } from "./SummaryCard";

function gmapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function pinIcon(color: string, dashed: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid ${dashed ? "transparent" : "white"};box-shadow:0 1px 3px rgba(0,0,0,.4);${dashed ? "outline:2px dashed white;outline-offset:-1px;" : ""}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

// deterministic small offset so multiple listings in one neighbourhood don't stack exactly
function jitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i) | 0;
  const jx = ((h % 200) - 100) / 100000; // ~ +/- 0.001 deg
  const jy = (((h >> 5) % 200) - 100) / 100000;
  return { jx, jy };
}

export default function MapView({
  listings, weights, workNeighborhood, filterBedrooms, filterTypes, onViewListing, onSetWork,
}: {
  listings: Listing[];
  weights: Weights;
  workNeighborhood: string;
  filterBedrooms: Set<string>;
  filterTypes: Set<string>;
  onViewListing: (id: string) => void;
  onSetWork: (id: string) => void;
}) {
  const filtered = useMemo(
    () => listings.filter((l) => matchesFilters(l, filterBedrooms, filterTypes)),
    [listings, filterBedrooms, filterTypes]
  );
  const unmapped = filtered.filter((l) => !l.neighborhood || !HOOD_BY_ID[l.neighborhood]).length;

  return (
    <div className="map-wrap">
      <MapContainer center={[43.71, -79.4]} zoom={11} style={{ width: "100%", height: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {NEIGHBOURHOODS.map((h) => {
          const isWork = workNeighborhood === h.id;
          const count = filtered.filter((l) => l.neighborhood === h.id).length;
          const r = 6 + (h.tier.length - 1) * 1.6;
          return (
            <CircleMarker
              key={h.id}
              center={[h.lat, h.lng]}
              radius={r}
              pathOptions={{
                color: isWork ? "#2E7D4F" : "#5B6B64",
                weight: isWork ? 3 : 1,
                fillColor: "#5B6B64",
                fillOpacity: 0.5,
              }}
            >
              <Popup>
                <div className="map-popover-body">
                  <h4>{h.name}</h4>
                  <div className="mp-sub">{h.tier} &middot; {count} listing{count === 1 ? "" : "s"} here</div>
                  <div className="mp-note">{h.note.length > 200 ? h.note.slice(0, 200) + "…" : h.note}</div>
                  <a className="mp-gmaps" target="_blank" rel="noopener noreferrer" href={gmapsUrl(`${h.name}, Toronto, Ontario`)}>
                    Open in Google Maps ↗
                  </a>
                  <div className="mp-actions">
                    <button type="button" className="btn" onClick={() => onSetWork(h.id)}>Set as work neighbourhood</button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {filtered.map((l) => {
          const hood = HOOD_BY_ID[l.neighborhood];
          if (!hood) return null;
          const { jx, jy } = jitter(l.id || l.name);
          const color = l.listingType === "buy" ? "#97650A" : "#1D5C6B";
          const score = overallScore(l, weights, workNeighborhood);
          const priceLine = l.listingType === "buy" ? money(l.price) : `${money(effectiveMonthly(l))}/mo`;
          return (
            <Marker key={l.id} position={[hood.lat + jy, hood.lng + jx]} icon={pinIcon(color, Boolean(l.isExample))}>
              <Popup>
                <div className="map-popover-body">
                  <h4>{l.name || "Untitled listing"}</h4>
                  <div className="mp-sub">{hoodLabel(l.neighborhood)} &middot; {priceLine} &middot; {score} match</div>
                  <div className="mp-note">
                    {l.bedrooms ?? "?"} bd &middot; {l.bathrooms ?? "?"} ba{l.sqft ? ` · ${l.sqft} sqft` : ""}{l.buildingType ? ` · ${l.buildingType}` : ""}
                  </div>
                  <a className="mp-gmaps" target="_blank" rel="noopener noreferrer" href={gmapsUrl(`${l.name || hoodLabel(l.neighborhood)}, Toronto, Ontario`)}>
                    Open in Google Maps ↗
                  </a>
                  <div className="mp-actions">
                    <button type="button" className="btn btn-primary" onClick={() => onViewListing(l.id)}>View details</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className="map-legend">
        <div><span className="legend-dot legend-hood" />Neighbourhood</div>
        <div><span className="legend-dot legend-rent" />Rental listing</div>
        <div><span className="legend-dot legend-buy" />For-sale listing</div>
        <div><span className="legend-dot legend-work" />Your work neighbourhood</div>
      </div>
      {unmapped > 0 && (
        <p className="map-caveat">
          {unmapped} listing{unmapped === 1 ? "" : "s"} without a matching neighbourhood aren&rsquo;t shown on the map.
        </p>
      )}
    </div>
  );
}
