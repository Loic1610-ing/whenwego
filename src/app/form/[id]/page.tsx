"use client";
// src/app/form/[id]/page.tsx

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { C, Btn, Card, SectionLabel } from "@/components/ui";
import { CalendarPicker } from "@/components/CalendarPicker";
import { CountrySelector } from "@/components/CountrySelector";
import type { DateRange, Destination } from "@/lib/supabase.browser";

const BUDGETS = [
  { label:"Petits budgets — < 500 €",       value:"low"     },
  { label:"Raisonnable — 500 à 1 000 €",    value:"mid"     },
  { label:"Confortable — 1 000 à 2 000 €",  value:"high"    },
  { label:"On se fait plaisir — > 2 000 €", value:"luxury"  },
];

export default function FormPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [ev,       setEv]       = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step,         setStep]         = useState(0);
  const [name,         setName]         = useState("");
  const [ranges,       setRanges]       = useState<DateRange[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [budget,       setBudget]       = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setEv)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function submit() {
    setSubmitting(true);
    const res = await fetch(`/api/events/${id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), ranges, destinations, budget }),
    });
    setSubmitting(false);
    if (res.ok) setStep(3);
  }

  if (loading) return <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", color:C.textMid, fontFamily:"inherit" }}>Chargement…</div>;
  if (notFound) return <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", color:C.text, fontFamily:"inherit", fontSize:16 }}>❌ Événement introuvable. Vérifiez le code.</div>;

  const steps = ["Prénom","Disponibilités","Préférences"];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"36px 20px", fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:520, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.accentMid }}>Invitation</span>
          <h2 style={{ fontFamily:"Fraunces, serif", fontSize:26, fontWeight:900, color:C.text, margin:"8px 0 4px" }}>{ev.title}</h2>
          <div style={{ fontSize:12, color:C.textLight }}>Par {ev.organizer} · {ev.start_date} → {ev.end_date}</div>
        </div>

        {/* Progress */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:32 }}>
          {steps.map((s,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", flex:i<steps.length-1?1:0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, transition:"all .2s", background:step>i?C.accent:step===i?C.accentLight:"transparent", color:step>i?"#fff":step===i?C.accent:C.textLight, border:`2px solid ${step>i?C.accent:step===i?C.accentMid:C.border}` }}>
                  {step>i?"✓":i+1}
                </div>
                <span style={{ fontSize:10, fontWeight:600, color:step>=i?C.textMid:C.textLight, whiteSpace:"nowrap" }}>{s}</span>
              </div>
              {i<steps.length-1 && <div style={{ flex:1, height:2, background:step>i?C.accent:C.border, margin:"0 6px", marginBottom:16, transition:"background .3s" }}/>}
            </div>
          ))}
        </div>

        {/* Step 0 - Name */}
        {step===0 && (
          <Card>
            <SectionLabel>Votre prénom</SectionLabel>
            <input value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&name.trim()&&setStep(1)}
              placeholder="Comment on vous appelle ?" autoFocus
              style={{ width:"100%", padding:"13px 14px", borderRadius:8, fontSize:15, background:C.bg, border:`1.5px solid ${C.border}`, color:C.text, outline:"none", boxSizing:"border-box", fontFamily:"inherit", marginBottom:16 }}/>
            <Btn onClick={()=>setStep(1)} disabled={!name.trim()} style={{ width:"100%" }}>Suivant →</Btn>
          </Card>
        )}

        {/* Step 1 - Calendar */}
        {step===1 && (
          <div>
            <Card style={{ marginBottom:14 }}>
              <SectionLabel>Vos jours disponibles</SectionLabel>
              <p style={{ fontSize:13, color:C.textMid, margin:"0 0 16px", lineHeight:1.55 }}>
                <strong>Cliquez</strong> sur un jour de début puis un jour de fin. Ou <strong>glissez</strong> directement.
              </p>
              <CalendarPicker
                ranges={ranges}
                onChange={setRanges}
                minDate={new Date(ev.start_date + "T00:00:00")}
                maxDate={new Date(ev.end_date   + "T00:00:00")}
              />
            </Card>
            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={()=>setStep(0)} variant="ghost" style={{ flex:1 }}>← Retour</Btn>
              <Btn onClick={()=>setStep(2)} style={{ flex:2 }}>Suivant →</Btn>
            </div>
          </div>
        )}

        {/* Step 2 - Prefs */}
        {step===2 && (
          <div>
            <Card style={{ marginBottom:14 }}>
              <SectionLabel>Destinations souhaitées (facultatif)</SectionLabel>
              <CountrySelector destinations={destinations} onChange={setDestinations} />
            </Card>
            <Card style={{ marginBottom:20 }}>
              <SectionLabel>Budget moyen par personne</SectionLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {BUDGETS.map(b=>(
                  <button key={b.value} onClick={()=>setBudget(b.value)} style={{ padding:"12px 16px", borderRadius:10, fontSize:14, cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"all .12s", border:`1.5px solid ${budget===b.value?C.accent:C.border}`, background:budget===b.value?C.accentLight:C.surface, color:budget===b.value?C.accent:C.textMid, fontWeight:budget===b.value?600:400 }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </Card>
            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={()=>setStep(1)} variant="ghost" style={{ flex:1 }}>← Retour</Btn>
              <Btn onClick={submit} disabled={!budget||submitting} style={{ flex:2 }}>
                {submitting?"Envoi…":"Envoyer ✓"}
              </Btn>
            </div>
          </div>
        )}

        {/* Step 3 - Done */}
        {step===3 && (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🥳</div>
            <h3 style={{ fontFamily:"Fraunces, serif", fontSize:24, color:C.text, margin:"0 0 8px" }}>C'est dans la boîte !</h3>
            <p style={{ color:C.textMid, fontSize:14, marginBottom:28 }}>Merci {name}, en attente des autres réponses.</p>
            <Btn onClick={()=>router.push(`/results/${id}`)} style={{ margin:"0 auto" }}>
              Voir les résultats →
            </Btn>
          </div>
        )}

      </div>
    </div>
  );
}
