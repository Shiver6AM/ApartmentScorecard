"use client";
import { BEDROOM_BUCKETS, UNIT_TYPES } from "@/lib/scoring";

export function FilterBar({ filterBedrooms, filterTypes, onToggleBedroom, onToggleType }: {
  filterBedrooms: Set<string>;
  filterTypes: Set<string>;
  onToggleBedroom: (key: string) => void;
  onToggleType: (key: string) => void;
}) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="fg-label">Bedrooms</span>
        {BEDROOM_BUCKETS.map((b) => (
          <button
            key={b.key}
            type="button"
            className={`filter-chip${filterBedrooms.has(b.key) ? " active" : ""}`}
            onClick={() => onToggleBedroom(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className="filter-group">
        <span className="fg-label">Unit type</span>
        {UNIT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`filter-chip${filterTypes.has(t) ? " active" : ""}`}
            onClick={() => onToggleType(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
