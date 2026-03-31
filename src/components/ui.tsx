// src/components/ui.tsx
"use client";
import React from "react";

export const C = {
  bg: "#f7f5f0", surface: "#ffffff", border: "#e5e1d8",
  text: "#1a1814", textMid: "#6b6660", textLight: "#a09b94",
  accent: "#2d6a4f", accentLight: "#d8ede4", accentMid: "#52b788",
  warn: "#c0392b", warnLight: "#fdecea", gold: "#b8860b", goldLight: "#fdf6e3",
};

export const selectStyle: React.CSSProperties = {
  padding:"10px 12px", borderRadius:8, fontSize:14, fontFamily:"inherit",
  background:"#fff", borderStyle:"solid", borderWidth:1.5, color:"#1a1814",
  outline:"none", cursor:"pointer", appearance:"none",
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a09b94' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center",
  paddingRight:32,
};

type BtnVariant = "primary"|"ghost"|"outline";
export function Btn({ children, onClick, variant="primary", disabled=false, style={} }: {
  children: React.ReactNode; onClick?: ()=>void; variant?: BtnVariant;
  disabled?: boolean; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    padding:"12px 22px", borderRadius:10, fontSize:14, fontWeight:600,
    cursor:disabled?"not-allowed":"pointer", border:"none", fontFamily:"inherit",
    transition:"all .15s",
  };
  const v: Record<BtnVariant, React.CSSProperties> = {
    primary: { background:C.accent, color:"#fff", opacity:disabled?.45:1 },
    ghost:   { background:"transparent", color:C.textMid, border:`1.5px solid ${C.border}`, opacity:disabled?.45:1 },
    outline: { background:"transparent", color:C.accent, border:`1.5px solid ${C.accent}`, opacity:disabled?.45:1 },
  };
  return <button style={{...base,...v[variant],...style}} onClick={disabled?undefined:onClick}>{children}</button>;
}

export function Card({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px", ...style }}>{children}</div>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.textLight, marginBottom:10 }}>{children}</div>;
}
