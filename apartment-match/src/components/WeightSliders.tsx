"use client";
import { FACTORS } from "@/lib/scoring";
import { Weights } from "@/lib/types";

export function WeightSliders({ weights, onChange, onReset }: {
  weights: Weights;
  onChange: (w: Weights) => void;
  onReset: () => void;
}) {
  const sumW = FACTORS.reduce((s, f) => s + Math.max(0, Number(weights[f.key]) || 0), 0) || 1;
  return (
    <div className="panel weights">
      <h2>What matters to you</h2>
      <div className="sub">Drag to set relative priorities — listings re-rank instantly.</div>
      <div>
        {FACTORS.map((f) => {
          const w = Math.max(0, Number(weights[f.key]) || 0);
          const pct = Math.round((w / sumW) * 100);
          return (
            <div className="slider-row" key={f.key}>
              <div className="sr-top">
                <span className="lbl">{f.label}</span>
                <span className="pct mono">{pct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={w}
                onChange={(e) => onChange({ ...weights, [f.key]: Number(e.target.value) })}
              />
            </div>
          );
        })}
      </div>
      <div className="weights-actions">
        <button className="btn" onClick={onReset}>Reset to equal</button>
      </div>
    </div>
  );
}
