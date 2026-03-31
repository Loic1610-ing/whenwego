"use client";
// src/components/CalendarPicker.tsx
// Supports click-click AND drag to select date ranges.

import { useState, useRef } from "react";
import { C } from "./ui";
import { ymd, addDays, parseYmd, rangesToSet, MONTH_NAMES, DAY_LABELS, buildMonthGrid, daysBetween } from "@/lib/dates";

export interface DateRange { start: string; end: string; }

interface Props {
  ranges:    DateRange[];
  onChange:  (r: DateRange[]) => void;
  minDate?:  Date;
  maxDate?:  Date;
}

function mergeRanges(rs: DateRange[]): DateRange[] {
  if (!rs.length) return [];
  const sorted = [...rs].sort((a,b)=>a.start.localeCompare(b.start));
  const merged = [{...sorted[0]}];
  for (let i=1;i<sorted.length;i++) {
    const last = merged[merged.length-1];
    const nextDay = ymd(addDays(parseYmd(last.end),1));
    if (sorted[i].start<=nextDay) { if(sorted[i].end>last.end) last.end=sorted[i].end; }
    else merged.push({...sorted[i]});
  }
  return merged;
}

export function CalendarPicker({ ranges, onChange, minDate, maxDate }: Props) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(minDate?.getFullYear()  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(minDate?.getMonth()     ?? today.getMonth());
  const [anchor,    setAnchor]    = useState<string|null>(null);
  const [hoverKey,  setHoverKey]  = useState<string|null>(null);
  const [dragging,  setDragging]  = useState(false);
  const [dragOrigin,setDragOrigin]= useState<string|null>(null);
  const [dragMode,  setDragMode]  = useState<"add"|"remove">("add");
  const movedRef = useRef(false);

  const selectedSet = rangesToSet(ranges);

  function getPreviewSet(): Set<string> {
    const origin = dragging ? dragOrigin : anchor;
    const cursor = hoverKey;
    if (!origin || !cursor) return new Set();
    let s=origin, e=cursor;
    if (s>e) [s,e]=[e,s];
    const set = new Set<string>();
    let cur=parseYmd(s), end=parseYmd(e);
    while(cur<=end){set.add(ymd(cur));cur=addDays(cur,1);}
    return set;
  }
  const previewSet     = getPreviewSet();
  const isRemovePreview= dragging && dragMode==="remove";

  function removeRange(s:string,e:string) {
    if(s>e)[s,e]=[e,s];
    const toRemove=new Set<string>();
    let cur=parseYmd(s),end=parseYmd(e);
    while(cur<=end){toRemove.add(ymd(cur));cur=addDays(cur,1);}
    const newRanges:DateRange[]=[];
    ranges.forEach(({start,end:rend})=>{
      let segStart:string|null=null,c=parseYmd(start),e2=parseYmd(rend);
      while(c<=e2){const k=ymd(c);if(!toRemove.has(k)){if(!segStart)segStart=k;}else{if(segStart)newRanges.push({start:segStart,end:ymd(addDays(c,-1))});segStart=null;}c=addDays(c,1);}
      if(segStart)newRanges.push({start:segStart,end:rend});
    });
    onChange(newRanges);
  }

  function commitRange(s:string,e:string,mode:"add"|"remove") {
    if(!s||!e)return;
    if(s>e)[s,e]=[e,s];
    if(mode==="remove")removeRange(s,e);
    else onChange(mergeRanges([...ranges,{start:s,end:e}]));
  }

  function cancelAnchor() {
    if(dragging&&movedRef.current&&dragOrigin&&hoverKey) commitRange(dragOrigin,hoverKey,dragMode);
    setDragging(false);setDragOrigin(null);setAnchor(null);setHoverKey(null);
  }

  function prevMonth(){if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);}
  function nextMonth(){if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);}

  function onDown(d:Date){
    if(!d)return;
    movedRef.current=false;
    if(anchor)return;
    const key=ymd(d);
    setDragMode(selectedSet.has(key)?"remove":"add");
    setDragging(true);setDragOrigin(key);setHoverKey(key);
  }
  function onEnter(d:Date){
    const key=ymd(d);setHoverKey(key);
    if(dragging)movedRef.current=true;
  }
  function onUp(d:Date){
    const key=ymd(d);
    if(dragging){
      if(movedRef.current){commitRange(dragOrigin!,key,dragMode);setDragging(false);setDragOrigin(null);}
      else {
        setDragging(false);setDragOrigin(null);
        if(anchor===key){setAnchor(null);}
        else if(anchor){commitRange(anchor,key,selectedSet.has(anchor)&&selectedSet.has(key)?"remove":"add");setAnchor(null);}
        else{setAnchor(key);}
      }
    } else if(anchor){
      if(key===anchor){setAnchor(null);return;}
      commitRange(anchor,key,selectedSet.has(anchor)&&selectedSet.has(key)?"remove":"add");
      setAnchor(null);
    }
  }

  const grid      = buildMonthGrid(viewYear,viewMonth);
  const totalDays = ranges.reduce((a,{start,end})=>a+daysBetween(parseYmd(start),parseYmd(end))+1,0);

  function getBandPos(key:string,set:Set<string>){
    if(!set.has(key))return null;
    const d=parseYmd(key);
    const hasPrev=set.has(ymd(addDays(d,-1)));
    const hasNext=set.has(ymd(addDays(d, 1)));
    if(!hasPrev&&!hasNext)return"solo";
    if(!hasPrev)return"start";
    if(!hasNext)return"end";
    return"middle";
  }

  function bandStyle(pos:string|null,remove:boolean):React.CSSProperties{
    if(!pos)return{};
    const BG=remove?"#fecaca":C.accentMid;
    const FG=remove?C.warn:"#fff";
    const R=8;
    const base:React.CSSProperties={background:BG,color:FG,fontWeight:700};
    const bL:React.CSSProperties={borderTopLeftRadius:0,borderBottomLeftRadius:0,marginLeft:"-1px",paddingLeft:"1px"};
    const bR:React.CSSProperties={borderTopRightRadius:0,borderBottomRightRadius:0,marginRight:"-1px",paddingRight:"1px"};
    const cL:React.CSSProperties={borderTopLeftRadius:R,borderBottomLeftRadius:R};
    const cR:React.CSSProperties={borderTopRightRadius:R,borderBottomRightRadius:R};
    if(pos==="solo")  return{...base,...cL,...cR};
    if(pos==="start") return{...base,...cL,...bR};
    if(pos==="end")   return{...base,...bL,...cR};
    return{...base,...bL,...bR};
  }

  return (
    <div style={{userSelect:"none"}} onMouseLeave={cancelAnchor}>
      {/* Month nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button onClick={prevMonth} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,width:32,height:32,cursor:"pointer",color:C.textMid,fontSize:18,lineHeight:"1"}}>‹</button>
        <span style={{fontFamily:"Fraunces, serif",fontWeight:700,fontSize:16,color:C.text}}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,width:32,height:32,cursor:"pointer",color:C.textMid,fontSize:18,lineHeight:"1"}}>›</button>
      </div>
      {/* Day labels */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
        {DAY_LABELS.map(l=><div key={l} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.textLight,padding:"3px 0"}}>{l}</div>)}
      </div>
      {/* Anchor hint */}
      {anchor&&(
        <div style={{marginBottom:10,padding:"7px 12px",borderRadius:8,background:"#fff7ed",border:`1px solid #fdba74`,fontSize:12,color:"#9a3412",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span>📍 Cliquez sur la date de fin</span>
          <button onClick={()=>setAnchor(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.warn,fontWeight:700,fontSize:13,fontFamily:"inherit",marginLeft:8}}>✕</button>
        </div>
      )}
      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {grid.map((d,i)=>{
          if(!d)return<div key={`e${i}`} style={{height:36}}/>;
          const key=ymd(d);
          const disabled=(minDate&&d<minDate)||(maxDate&&d>maxDate);
          const inSelected=!disabled&&selectedSet.has(key);
          const inPreview=!disabled&&previewSet.has(key);
          const isAnchorDay=key===anchor;
          const isWeekend=d.getDay()===0||d.getDay()===6;
          let pos:string|null=null;
          if(inPreview)pos=getBandPos(key,previewSet);
          else if(inSelected)pos=getBandPos(key,selectedSet);
          const bs=bandStyle(pos,isRemovePreview&&inPreview);
          return(
            <div key={key}
              onMouseDown={()=>!disabled&&onDown(d)}
              onMouseEnter={()=>!disabled&&onEnter(d)}
              onMouseUp={()=>!disabled&&onUp(d)}
              style={{height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,borderRadius:6,position:"relative",cursor:disabled?"default":"pointer",color:disabled?C.border:(inPreview||inSelected)?bs.color:isWeekend?C.textMid:C.text,outline:isAnchorDay?`2.5px solid ${C.accent}`:"none",outlineOffset:"1px",zIndex:isAnchorDay?1:"auto",...bs,transition:"background .06s"}}
            >{d.getDate()}</div>
          );
        })}
      </div>
      {/* Summary */}
      <div style={{marginTop:12,padding:"9px 13px",borderRadius:8,background:totalDays>0?C.accentLight:C.bg,border:`1px solid ${totalDays>0?C.accentMid+"55":C.border}`,fontSize:12,color:totalDays>0?C.accent:C.textLight,fontWeight:totalDays>0?600:400}}>
        {totalDays>0
          ?`📅 ${totalDays} jour${totalDays>1?"s":""} · ${ranges.map(r=>{const s=parseYmd(r.start),e=parseYmd(r.end);return r.start===r.end?`${s.getDate()} ${MONTH_NAMES[s.getMonth()].slice(0,3)}`:`${s.getDate()} ${MONTH_NAMES[s.getMonth()].slice(0,3)} → ${e.getDate()} ${MONTH_NAMES[e.getMonth()].slice(0,3)}`;}).join("  •  ")}`
          :"Cliquez sur un début puis une fin — ou glissez directement"
        }
      </div>
      {totalDays>0&&<button onClick={()=>onChange([])} style={{marginTop:6,background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.warn,padding:"3px 0",fontFamily:"inherit"}}>✕ Tout effacer</button>}
    </div>
  );
}
