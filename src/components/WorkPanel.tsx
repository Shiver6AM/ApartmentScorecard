"use client";
import { NEIGHBOURHOODS } from "@/lib/neighbourhoods";

export function WorkPanel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="panel weights">
      <h2>Your commute</h2>
      <div className="sub">Set where you&rsquo;re commuting to — listings get an estimated commute complexity based on shared transit lines.</div>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="f-work-neighborhood">Work neighbourhood</label>
        <select id="f-work-neighborhood" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">— not set —</option>
          {NEIGHBOURHOODS.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
