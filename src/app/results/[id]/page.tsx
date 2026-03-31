"use client";
// src/app/results/[id]/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase.browser";
import { C, Btn, Card, SectionLabel } from "@/components/ui";
import { buildDayMap, computeBestWindows, MONTH_NAMES, DAY_LABELS, buildMonthGrid, ymd, parseYmd } from "@/lib/dates";
import { durationLabel } from "@/lib/durationOptions";
import type { Response } from "@/lib/supabase.browser";

const BUDGETS = [
  { label:"< 500 €",        value:"low"    },
  { label:"500–1 000 €",    value:"mid"    },
  { label:"1 000–2 000 €",  value:"high"   },
  { label:"> 2 000 €",      value:"luxury" },
];

export default function ResultsPage() {
  const { id }        = useParams<{ id: string }>();
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const isNewOrg      = searchParams.get("organizer") === "1";

  const [ev,        setEv]        = useState<any>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [copied,    setCopied]    = useState(false);
  const [aiText,    setAiText]    = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ── Fetch event + responses ──────────────────────────────────
  const loadAll = useCallback(async () => {
    const [evRes, respRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch(`/api/events/${id}/responses`),
    ]);
    if (evRes.ok)   setEv(await evRes.json());
    if (respRes.ok) setResponses(await respRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Realtime subscription ────────────────────────────────────
  useEffect(() => {
    const channel = getSupabaseBrowser()
      .channel(`responses:${id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "responses",
        filter: `event_id=eq.${id}`,
      }, () => {
        // Re-fetch on any change (insert / delete / update)
        fetch(`/api/events/${id}/responses`)
          .then(r=>r.json())
          .then(setResponses);
      })
      .subscribe();

    return () => { getSupabaseBrowser().removeChannel(channel); };
  }, [id]);

  if (loading) return <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", color:C.textMid, fontFamily:"'DM Sans', sans-serif" }}>Chargement…</div>;
  if (!ev)     return null;

  // ── Compute ──────────────────────────────────────────────────
  const dayMap  = buildDayMap(ev.start_date, ev.end_date, responses);
  const windows = responses.length > 0 ? computeBestWindows(dayMap, ev.trip_min, ev.trip_max) : [];

  const sortedDays = Object.values(dayMap).sort((a,b)=>b.avail.length-a.avail.length);

  const cvotes: Record<string,number> = {};
  responses.forEach(r=>(r.destinations||[]).forEach((d:any)=>{ cvotes[`${d.flag} ${d.country}`]=(cvotes[`${d.flag} ${d.country}`]||0)+1; }));
  const sortedC = Object.entries(cvotes).sort((a,b)=>b[1]-a[1]);

  const bvotes: Record<string,number> = {};
  responses.forEach(r=>{ if(r.budget) bvotes[r.budget]=(bvotes[r.budget]||0)+1; });

  const months: {y:number;m:number}[] = [];
  let cur = new Date(parseYmd(ev.start_date).getFullYear(), parseYmd(ev.start_date).getMonth(), 1);
  const endM = new Date(parseYmd(ev.end_date).getFullYear(), parseYmd(ev.end_date).getMonth(), 1);
  while (cur<=endM) { months.push({y:cur.getFullYear(),m:cur.getMonth()}); cur=new Date(cur.getFullYear(),cur.getMonth()+1,1); }

  const shareUrl = `${window.location.origin}/form/${id}`;

  async function copyCode() {
    await navigator.clipboard.writeText(shareUrl).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  }

  async function getAi() {
    setAiLoading(true);
    try {
      const bw   = windows[0];
      const topC = sortedC.slice(0,3).map(([c])=>c).join(", ");
      const topB = BUDGETS.find(b=>b.value===Object.entries(bvotes).sort((a,b)=>b[1]-a[1])[0]?.[0])?.label||"?";

      // ✅ Call our own API route — Anthropic key stays server-side
      const res = await fetch("/api/ai/suggest", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSummary:
            `Groupe de ${responses.length} amis.\n` +
            `Meilleure fenêtre: ${bw ? bw.start+" → "+bw.end : "?"} (${bw?.min||0}/${responses.length} dispo).\n` +
            `Destinations: ${topC||"?"}\n` +
            `Budget majoritaire: ${topB}.`,
        }),
      });
      const data = await res.json();
      setAiText(res.ok ? (data.text || "") : (data.error || "Erreur IA."));
    } catch {
      setAiText("Impossible de contacter le service IA.");
    }
    setAiLoading(false);
  }

  function renderMonth(y:number,m:number) {
    const grid = buildMonthGrid(y,m);
    return (
      <div key={`${y}-${m}`} style={{marginBottom:20}}>
        <div style={{fontFamily:"Fraunces, serif",fontWeight:700,fontSize:14,color:C.text,marginBottom:6}}>{MONTH_NAMES[m]} {y}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {DAY_LABELS.map(l=><div key={l} style={{textAlign:"center",fontSize:9,fontWeight:700,color:C.textLight,padding:"2px 0"}}>{l}</div>)}
          {grid.map((d,i)=>{
            if(!d) return <div key={i}/>;
            const k=ymd(d); const dd=dayMap[k];
            if(!dd) return <div key={k} style={{height:30,borderRadius:4,background:C.bg}}/>;
            const pct=responses.length?dd.avail.length/responses.length:0;
            const bg=pct===0?C.bg:pct<0.4?"#ffe8e8":pct<0.7?"#c8edda":C.accentMid;
            const fg=pct>=0.7?"#fff":C.text;
            return <div key={k} title={`${d.getDate()} – ${dd.avail.length}/${responses.length}`} style={{height:30,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",background:bg,fontSize:11,fontWeight:600,color:fg,border:`1px solid ${C.border}`}}>{d.getDate()}</div>;
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"36px 20px",fontFamily:"'DM Sans', sans-serif"}}>
      <div style={{maxWidth:620,margin:"0 auto"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <span style={{fontSize:11,fontWeight:700,color:C.accentMid,letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {responses.length} réponse{responses.length!==1?"s":""}
            </span>
            <h2 style={{fontFamily:"Fraunces, serif",fontSize:26,fontWeight:900,color:C.text,margin:"6px 0 4px"}}>{ev.title}</h2>
            <div style={{fontSize:12,color:C.textLight}}>
              Code: {id} · {ev.start_date} → {ev.end_date} · {ev.trip_min===ev.trip_max ? durationLabel(ev.trip_min) : `${durationLabel(ev.trip_min)} – ${durationLabel(ev.trip_max)}`}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={loadAll} style={{padding:"8px 12px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.textMid,cursor:"pointer",fontFamily:"inherit"}}>⟳</button>
            <button onClick={()=>router.push(`/admin/${id}`)} style={{padding:"8px 12px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.textMid,cursor:"pointer",fontFamily:"inherit"}}>⚙️ Admin</button>
          </div>
        </div>

        {/* Share banner */}
        {isNewOrg && (
          <Card style={{marginBottom:14,background:"#fffbeb",border:`1px solid #fcd34d`}}>
            <div style={{fontSize:11,fontWeight:700,color:"#92400e",letterSpacing:"0.08em",marginBottom:8}}>🔗 LIEN À PARTAGER</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <code style={{flex:1,fontSize:12,color:C.text,background:C.bg,padding:"8px 12px",borderRadius:7,border:`1px solid ${C.border}`,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shareUrl}</code>
              <button onClick={copyCode} style={{padding:"8px 14px",background:copied?"#d1fae5":"#fff",border:`1px solid ${copied?"#6ee7b7":C.border}`,borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:copied?C.accent:C.textMid,whiteSpace:"nowrap"}}>
                {copied?"✓ Copié !":"Copier"}
              </button>
            </div>
          </Card>
        )}

        {responses.length===0 ? (
          <Card style={{textAlign:"center",padding:"60px 20px",color:C.textLight}}>En attente des premières réponses…</Card>
        ) : (
          <>
            {/* Best windows */}
            {windows.length>0 && (
              <Card style={{marginBottom:14,background:C.accentLight,border:`1px solid ${C.accentMid}55`}}>
                <SectionLabel>🏆 Meilleures fenêtres communes</SectionLabel>
                {windows.map((w,i)=>{
                  const s=parseYmd(w.start),e=parseYmd(w.end);
                  return (
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,marginBottom:6,background:i===0?C.accent:C.surface,border:`1px solid ${i===0?C.accent:C.border}`}}>
                      <div>
                        <span style={{fontWeight:700,fontSize:14,color:i===0?"#fff":C.text}}>{s.getDate()} {MONTH_NAMES[s.getMonth()].slice(0,3)} → {e.getDate()} {MONTH_NAMES[e.getMonth()].slice(0,3)}</span>
                        <span style={{fontSize:12,color:i===0?"rgba(255,255,255,.65)":C.textLight,marginLeft:8}}>({w.len} jours)</span>
                      </div>
                      <span style={{fontWeight:800,fontSize:15,color:i===0?"#fff":C.accent}}>{w.min}/{responses.length}</span>
                    </div>
                  );
                })}
              </Card>
            )}

            {/* Heatmap */}
            <Card style={{marginBottom:14}}>
              <SectionLabel>Carte des disponibilités</SectionLabel>
              <div style={{display:"flex",gap:12,marginBottom:14,fontSize:11,color:C.textLight,flexWrap:"wrap"}}>
                {[["#ffe8e8","Peu dispo"],["#c8edda","Moitié"],[C.accentMid,"Tous dispo"]].map(([bg,label])=>(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:12,height:12,borderRadius:2,background:bg,border:`1px solid ${C.border}`}}/><span>{label}</span>
                  </div>
                ))}
              </div>
              {months.map(({y,m})=>renderMonth(y,m))}
            </Card>

            {/* Top days */}
            <Card style={{marginBottom:14}}>
              <SectionLabel>Détail — top 10 jours</SectionLabel>
              {sortedDays.slice(0,10).map(({date,avail,unavail})=>{
                const pct=responses.length?avail.length/responses.length:0;
                return (
                  <div key={ymd(date)} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:600,color:C.text}}>{DAY_LABELS[(date.getDay()+6)%7]} {date.getDate()} {MONTH_NAMES[date.getMonth()].slice(0,3)}</span>
                      <span style={{fontSize:13,fontWeight:700,color:pct>=0.7?C.accent:pct>=0.4?C.gold:C.warn}}>{avail.length}/{responses.length}</span>
                    </div>
                    <div style={{height:4,borderRadius:2,background:C.border,marginBottom:5}}>
                      <div style={{height:"100%",borderRadius:2,width:`${pct*100}%`,background:pct>=0.7?C.accent:pct>=0.4?C.gold:C.warn}}/>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {avail.map(n=><span key={n} style={{padding:"2px 7px",borderRadius:4,fontSize:11,background:C.accentLight,color:C.accent,fontWeight:600}}>✓ {n}</span>)}
                      {unavail.map(n=><span key={n} style={{padding:"2px 7px",borderRadius:4,fontSize:11,background:C.warnLight,color:C.warn}}>✗ {n}</span>)}
                    </div>
                  </div>
                );
              })}
            </Card>

            {/* Countries */}
            <Card style={{marginBottom:14}}>
              <SectionLabel>Destinations préférées</SectionLabel>
              {sortedC.length===0?<div style={{fontSize:13,color:C.textLight}}>Aucun vote.</div>:sortedC.map(([c,n])=>(
                <div key={c} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:14,color:C.text}}>{c}</span>
                    <span style={{fontSize:12,fontWeight:700,color:C.textMid}}>{n} vote{n>1?"s":""}</span>
                  </div>
                  <div style={{height:4,borderRadius:2,background:C.border}}>
                    <div style={{height:"100%",borderRadius:2,width:`${(n/responses.length)*100}%`,background:C.accentMid}}/>
                  </div>
                </div>
              ))}
            </Card>

            {/* Budget */}
            <Card style={{marginBottom:14}}>
              <SectionLabel>Budget</SectionLabel>
              {BUDGETS.map(b=>{const n=bvotes[b.value]||0;return(
                <div key={b.value} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{width:120,fontSize:12,color:n>0?C.text:C.textLight}}>{b.label}</div>
                  <div style={{flex:1,height:5,borderRadius:3,background:C.border}}>
                    <div style={{height:"100%",borderRadius:3,width:`${responses.length?(n/responses.length)*100:0}%`,background:"#60a5fa"}}/>
                  </div>
                  <div style={{width:18,fontSize:12,color:C.textMid,textAlign:"right"}}>{n}</div>
                </div>
              );})}
            </Card>

            {/* AI */}
            <Card style={{marginBottom:24,background:C.goldLight,border:`1px solid #e6c96644`}}>
              <SectionLabel>✨ Suggestion IA</SectionLabel>
              {aiText?(<p style={{fontSize:14,color:C.text,lineHeight:1.75,margin:0}}>{aiText}</p>):(
                <Btn onClick={getAi} disabled={aiLoading} style={{width:"100%"}}>
                  {aiLoading?"⏳ Analyse en cours…":"Obtenir une recommandation IA"}
                </Btn>
              )}
            </Card>
          </>
        )}

        <Btn onClick={()=>router.push("/")} variant="ghost" style={{width:"100%"}}>← Accueil</Btn>
      </div>
    </div>
  );
}
