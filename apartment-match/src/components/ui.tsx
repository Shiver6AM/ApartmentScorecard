"use client";
import React from "react";

export function Field({ label, htmlFor, wide, children }: { label: string; htmlFor: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`field${wide ? " wide" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

export function TextInput({ id, value, onChange, type = "text" }: { id: string; value: string | number | null; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      id={id}
      type={type}
      value={value === null || value === undefined ? "" : value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function SelectInput({ id, value, onChange, options }: { id: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Checkbox({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="cb-row" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function FlagIcon({ level }: { level: "good" | "warn" | "bad" | "neutral" }) {
  const g: Record<string, string> = { good: "✓", warn: "!", bad: "×", neutral: "·" };
  return <b>{g[level]}</b>;
}
