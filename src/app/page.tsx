"use client";
// src/app/page.tsx — Landing + Create event

import { useState } from "react";
import { useRouter } from "next/navigation";
import { C, Btn, Card, SectionLabel, selectStyle } from "@/components/ui";
import { buildDurationOptions, durationLabel } from "@/lib/durationOptions";

const DURATION_OPTIONS = buildDurationOptions();

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<"landing"|"create">("landing");

  // Join
  const [code, setCode] = useState("");
  const [joinErr, setJoinErr] = useState("");

  async function join() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const res = await fetch(`/api/events/${c}`);
    if (!res.ok) { setJoinErr("Code introuvable. Vérifiez l'invitation."); return; }
    router.push(`/form/${c}`);
  }

  // Create
  const [title,     setTitle]     = useState("");
  const [organizer, setOrganizer] = useState("");
  const [pwd,       setPwd]       = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [tripMin,   setTripMin]   = useState(5);
  const [tripMax,   setTripMax]   = useState(7);
  const [creating,  setCreating]  = useState(false);
  const [createErr, setCreateErr] = useState("");

  function handleMinChange(v: number) { setTripMin(v); if (v>tripMax) setTripMax(v); }
  function handleMaxChange(v: number) { setTripMax(v); if (v<tripMin) setTripMin(v); }

  const isSameDay = tripMin === tripMax;
  const durationSummary = isSameDay
    ? `Exactement ${durationLabel(tripMin)}`
    : `Entre ${durationLabel(tripMin)} et ${durationLabel(tripMax)}`;

  const valid = title.trim() && organizer.trim() && pwd.trim() && startDate && endDate && startDate <= endDate;

  async function create() {
    if (!valid || creating) return;
    setCreating(true); setCreateErr("");
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, organizer, organizer_pwd: pwd, start_date: startDate, end_date: endDate, trip_min: tripMin, trip_max: tripMax }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateErr(data.error || "Erreur"); return; }
    router.push(`/results/${data.id}?organizer=1`);
  }

  if (view === "create") return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"48px 24px" }}>
      <div style={{ maxWidth:480, margin:"0 auto" }}>
        <div style={{ marginBottom:32 }}>
          <button onClick={()=>setView("landing")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, fontSize:13, fontFamily:"inherit", padding:0, marginBottom:16 }}>← Retour</button>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.accentMid, display:"block" }}>Nouvel événement</span>
          <h2 style={{ fontFamily:"Fraunces, serif", fontSize:32, fontWeight:900, color:C.text, margin:"8px 0 6px" }}>Créer le voyage</h2>
          <p style={{ color:C.textMid, fontSize:14, margin:0 }}>Définissez la durée souhaitée et la fenêtre de disponibilités.</p>
        </div>

        <Card style={{ marginBottom:14 }}>
          <SectionLabel>Nom du voyage</SectionLabel>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Aventure au Japon 🗾"
            style={{ width:"100%", padding:"11px 14px", borderRadius:8, fontSize:14, background:C.bg, border:`1.5px solid ${C.border}`, color:C.text, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
        </Card>

        <Card style={{ marginBottom:14 }}>
          <SectionLabel>Votre prénom</SectionLabel>
          <input value={organizer} onChange={e=>setOrganizer(e.target.value)} placeholder="Ex: Lucas"
            style={{ width:"100%", padding:"11px 14px", borderRadius:8, fontSize:14, background:C.bg, border:`1.5px solid ${C.border}`, color:C.text, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
        </Card>

        <Card style={{ marginBottom:14 }}>
          <SectionLabel>Mot de passe admin</SectionLabel>
          <p style={{ fontSize:12, color:C.textMid, margin:"0 0 8px" }}>Pour accéder au panel de gestion des participants.</p>
          <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Choisissez un mot de passe"
            style={{ width:"100%", padding:"11px 14px", borderRadius:8, fontSize:14, background:C.bg, border:`1.5px solid ${C.border}`, color:C.text, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
        </Card>

        <Card style={{ marginBottom:14 }}>
          <SectionLabel>Durée du voyage</SectionLabel>
          <p style={{ fontSize:12, color:C.textMid, margin:"0 0 14px", lineHeight:1.5 }}>
            L'algorithme cherchera la meilleure fenêtre dans cet intervalle.
          </p>
          <div style={{ display:"flex", gap:12, alignItems:"flex-end" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:C.textLight, marginBottom:5, fontWeight:600 }}>Minimum</div>
              <select value={tripMin} onChange={e=>handleMinChange(Number(e.target.value))}
                style={{ ...selectStyle, width:"100%", borderColor:C.border }}>
                {DURATION_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ paddingBottom:12, color:C.textLight, fontSize:18, flexShrink:0 }}>—</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:C.textLight, marginBottom:5, fontWeight:600 }}>Maximum</div>
              <select value={tripMax} onChange={e=>handleMaxChange(Number(e.target.value))}
                style={{ ...selectStyle, width:"100%", borderColor:C.border }}>
                {DURATION_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop:12, padding:"8px 14px", borderRadius:8, background:C.accentLight, border:`1px solid ${C.accentMid}55`, fontSize:13, color:C.accent, fontWeight:600 }}>
            🗓 {durationSummary}
          </div>
        </Card>

        <Card style={{ marginBottom:24 }}>
          <SectionLabel>Fenêtre de dates</SectionLabel>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:C.textLight, marginBottom:4 }}>Du</div>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, fontSize:14, background:C.bg, border:`1.5px solid ${C.border}`, color:C.text, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
            </div>
            <div style={{ paddingTop:18, color:C.textLight, fontSize:18 }}>→</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:C.textLight, marginBottom:4 }}>Au</div>
              <input type="date" value={endDate} min={startDate} onChange={e=>setEndDate(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, fontSize:14, background:C.bg, border:`1.5px solid ${C.border}`, color:C.text, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
            </div>
          </div>
        </Card>

        {createErr && <div style={{ fontSize:13, color:C.warn, marginBottom:12 }}>{createErr}</div>}
        <Btn onClick={create} disabled={!valid || creating} style={{ width:"100%", padding:15, fontSize:15, borderRadius:12 }}>
          {creating ? "Création…" : "Générer le lien →"}
        </Btn>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:400, width:"100%" }}>
        <div style={{ marginBottom:44 }}>
          <div style={{ fontSize:42, marginBottom:10 }}>✈️</div>
          <h1 style={{ fontFamily:"Fraunces, serif", fontSize:46, fontWeight:900, color:C.text, margin:"0 0 8px", lineHeight:1.05 }}>
            When<em>We</em>Go
          </h1>
          <p style={{ color:C.textMid, fontSize:15, margin:0 }}>Planifiez un voyage en groupe, sans prise de tête.</p>
        </div>

        <Btn onClick={()=>setView("create")} style={{ width:"100%", padding:15, fontSize:15, borderRadius:12, marginBottom:24 }}>
          Créer un voyage →
        </Btn>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
          <div style={{ flex:1, height:1, background:C.border }}/>
          <span style={{ fontSize:12, color:C.textLight }}>ou rejoindre</span>
          <div style={{ flex:1, height:1, background:C.border }}/>
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <input value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setJoinErr("");}}
            onKeyDown={e=>e.key==="Enter"&&join()} placeholder="Code d'invitation (ex: A3B9KX)"
            style={{ flex:1, padding:"12px 14px", borderRadius:10, fontSize:14, background:"#fff", border:`1.5px solid ${joinErr?C.warn:C.border}`, color:C.text, outline:"none", fontFamily:"inherit" }}/>
          <Btn onClick={join} variant="outline" style={{ whiteSpace:"nowrap" }}>Rejoindre</Btn>
        </div>
        {joinErr && <div style={{ fontSize:12, color:C.warn, marginTop:6 }}>{joinErr}</div>}
      </div>
    </div>
  );
}
