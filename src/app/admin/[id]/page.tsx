"use client";
// src/app/admin/[id]/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { C, Btn, Card, SectionLabel } from "@/components/ui";
import { MONTH_NAMES, parseYmd, rangesToSet, ymd, addDays } from "@/lib/dates";
import { durationLabel } from "@/lib/durationOptions";
import type { Response } from "@/lib/supabase.browser";

const BUDGETS = [
  { label:"< 500 €",        value:"low"    },
  { label:"500–1 000 €",    value:"mid"    },
  { label:"1 000–2 000 €",  value:"high"   },
  { label:"> 2 000 €",      value:"luxury" },
];

export default function AdminPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [ev,        setEv]        = useState<any>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [token,     setToken]     = useState<string|null>(null);
  const [pwd,       setPwd]       = useState("");
  const [authErr,   setAuthErr]   = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [confirmDel,  setConfirmDel]  = useState<string|null>(null);

  // Load event info (public)
  useEffect(()=>{
    fetch(`/api/events/${id}`).then(r=>r.ok?r.json():null).then(setEv);
  },[id]);

  const loadResponses = useCallback(async()=>{
    const r = await fetch(`/api/events/${id}/responses`);
    if (r.ok) setResponses(await r.json());
  },[id]);

  useEffect(()=>{ if(token) loadResponses(); },[token,loadResponses]);

  // ── Auth ────────────────────────────────────────────────────
  async function authenticate() {
    setAuthLoading(true); setAuthErr("");
    const res = await fetch(`/api/events/${id}/admin`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ password: pwd }),
    });
    const data = await res.json();
    setAuthLoading(false);
    if (!res.ok) { setAuthErr(data.error||"Mot de passe incorrect"); return; }
    setToken(data.token);
  }

  // ── Delete participant ──────────────────────────────────────
  async function deleteParticipant(responseId: string) {
    await fetch(`/api/events/${id}/admin`, {
      method:"DELETE",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ response_id:responseId, token }),
    });
    setConfirmDel(null);
    loadResponses();
  }

  // ── Rename participant ──────────────────────────────────────
  async function renameParticipant(responseId: string, name: string) {
    await fetch(`/api/events/${id}/admin`, {
      method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ response_id:responseId, name, token }),
    });
    loadResponses();
  }

  if (!ev) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.textMid,fontFamily:"'DM Sans',sans-serif"}}>Chargement…</div>;

  // ── Auth gate ────────────────────────────────────────────────
  if (!token) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:380,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:40,marginBottom:10}}>🔒</div>
          <h2 style={{fontFamily:"Fraunces, serif",fontSize:26,fontWeight:900,color:C.text,margin:"0 0 8px"}}>Accès organisateur</h2>
          <p style={{color:C.textMid,fontSize:14,margin:0}}>Mot de passe défini à la création du voyage.</p>
        </div>
        <Card>
          <SectionLabel>Mot de passe admin</SectionLabel>
          <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setAuthErr("");}}
            onKeyDown={e=>e.key==="Enter"&&authenticate()}
            placeholder="••••••••" autoFocus
            style={{width:"100%",padding:"12px 14px",borderRadius:8,fontSize:14,background:C.bg,border:`1.5px solid ${authErr?C.warn:C.border}`,color:C.text,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:10}}/>
          {authErr && <div style={{fontSize:12,color:C.warn,marginBottom:10}}>{authErr}</div>}
          <Btn onClick={authenticate} disabled={!pwd||authLoading} style={{width:"100%"}}>
            {authLoading?"Vérification…":"Accéder →"}
          </Btn>
        </Card>
        <div style={{textAlign:"center",marginTop:16}}>
          <button onClick={()=>router.push(`/results/${id}`)} style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,fontSize:13,fontFamily:"inherit"}}>← Retour aux résultats</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"36px 20px",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:580,margin:"0 auto"}}>

        <div style={{marginBottom:28}}>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.warn}}>⚙️ Panel admin</span>
          <h2 style={{fontFamily:"Fraunces, serif",fontSize:26,fontWeight:900,color:C.text,margin:"8px 0 4px"}}>{ev.title}</h2>
          <div style={{fontSize:12,color:C.textLight}}>{responses.length} participant{responses.length!==1?"s":""} · Code: {id}</div>
        </div>

        {/* Event info */}
        <Card style={{marginBottom:14}}>
          <SectionLabel>Informations du voyage</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:13}}>
            {[
              ["Organisateur", ev.organizer],
              ["Durée cible",  ev.trip_min===ev.trip_max ? durationLabel(ev.trip_min) : `${durationLabel(ev.trip_min)} – ${durationLabel(ev.trip_max)}`],
              ["Début",        ev.start_date],
              ["Fin",          ev.end_date],
            ].map(([k,v])=>(
              <div key={k} style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:10,fontWeight:700,color:C.textLight,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{k}</div>
                <div style={{fontWeight:600,color:C.text}}>{v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Participants */}
        <Card style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <SectionLabel>Participants ({responses.length})</SectionLabel>
            <button onClick={loadResponses} style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,fontSize:12,fontFamily:"inherit"}}>⟳ Actualiser</button>
          </div>

          {responses.length===0 && <div style={{textAlign:"center",padding:"30px 0",color:C.textLight,fontSize:14}}>Aucun participant pour l'instant.</div>}

          {responses.map(r=>(
            <ParticipantRow
              key={r.id}
              r={r}
              onDelete={()=>setConfirmDel(r.id)}
              onRename={(name)=>renameParticipant(r.id, name)}
            />
          ))}
        </Card>

        {/* Confirm delete modal */}
        {confirmDel && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
            <div style={{background:C.surface,borderRadius:16,padding:28,maxWidth:340,width:"100%",textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
              <h3 style={{fontFamily:"Fraunces, serif",fontSize:20,color:C.text,margin:"0 0 8px"}}>
                Supprimer {responses.find(r=>r.id===confirmDel)?.name} ?
              </h3>
              <p style={{color:C.textMid,fontSize:14,marginBottom:24}}>Ses réponses seront définitivement retirées du sondage.</p>
              <div style={{display:"flex",gap:10}}>
                <Btn onClick={()=>setConfirmDel(null)} variant="ghost" style={{flex:1}}>Annuler</Btn>
                <Btn onClick={()=>deleteParticipant(confirmDel)} style={{flex:1,background:C.warn}}>Supprimer</Btn>
              </div>
            </div>
          </div>
        )}

        <Btn onClick={()=>router.push(`/results/${id}`)} variant="ghost" style={{width:"100%"}}>← Retour aux résultats</Btn>
      </div>
    </div>
  );
}

function ParticipantRow({ r, onDelete, onRename }: {
  r: Response;
  onDelete: ()=>void;
  onRename: (name:string)=>void;
}) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(r.name);
  const totalDays = (r.ranges||[]).reduce((a,{start,end})=>{
    let c=parseYmd(start),e=parseYmd(end),n=0;
    while(c<=e){n++;c=addDays(c,1);}
    return a+n;
  },0);
  const budgetLabel = BUDGETS.find(b=>b.value===r.budget)?.label||"?";

  function save() {
    if (nameVal.trim()) { onRename(nameVal.trim()); setEditing(false); }
  }

  return (
    <div style={{padding:"14px 16px",borderRadius:12,border:`1px solid ${C.border}`,marginBottom:10,background:C.bg}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{flex:1}}>
          {editing ? (
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input value={nameVal} onChange={e=>setNameVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()}
                autoFocus style={{padding:"5px 10px",borderRadius:7,border:`1.5px solid ${C.accentMid}`,fontSize:14,fontWeight:700,fontFamily:"inherit",color:C.text,outline:"none",width:130}}/>
              <button onClick={save} style={{background:C.accent,color:"#fff",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>✓</button>
              <button onClick={()=>{setEditing(false);setNameVal(r.name);}} style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,fontSize:16}}>✕</button>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontWeight:700,fontSize:15,color:C.text}}>{r.name}</span>
              <button onClick={()=>setEditing(true)} style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,fontSize:13,padding:0}}>✏️</button>
            </div>
          )}
        </div>
        <button onClick={onDelete} style={{background:C.warnLight,border:`1px solid ${C.warn}22`,borderRadius:7,padding:"5px 10px",cursor:"pointer",color:C.warn,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>
          Retirer
        </button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,fontSize:11}}>
        <span style={{padding:"2px 8px",borderRadius:4,background:C.accentLight,color:C.accent,fontWeight:600}}>📅 {totalDays}j</span>
        <span style={{padding:"2px 8px",borderRadius:4,background:"#eff6ff",color:"#3b82f6",fontWeight:600}}>💰 {budgetLabel}</span>
        {(r.destinations||[]).slice(0,3).map((d:any)=>(
          <span key={d.country} style={{padding:"2px 8px",borderRadius:4,background:C.bg,color:C.textMid,border:`1px solid ${C.border}`}}>{d.flag} {d.country}</span>
        ))}
      </div>
      <div style={{marginTop:6,fontSize:11,color:C.textLight}}>
        {(r.ranges||[]).length===0?"Aucune dispo":(r.ranges||[]).map(rng=>{
          const s=parseYmd(rng.start),e=parseYmd(rng.end);
          return rng.start===rng.end?`${s.getDate()} ${MONTH_NAMES[s.getMonth()].slice(0,3)}`:`${s.getDate()} ${MONTH_NAMES[s.getMonth()].slice(0,3)} → ${e.getDate()} ${MONTH_NAMES[e.getMonth()].slice(0,3)}`;
        }).join("  •  ")}
      </div>
    </div>
  );
}
