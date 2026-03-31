// src/lib/dates.ts

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function parseYmd(s: string): Date {
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate()+n); return r;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime()-a.getTime())/86400000);
}

export interface DateRange { start: string; end: string; }

export function rangesToSet(ranges: DateRange[]): Set<string> {
  const s = new Set<string>();
  ranges.forEach(({start,end}) => {
    let cur = parseYmd(start), e = parseYmd(end);
    while (cur<=e) { s.add(ymd(cur)); cur=addDays(cur,1); }
  });
  return s;
}

export const MONTH_NAMES = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];
export const DAY_LABELS = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

export function buildMonthGrid(year: number, month: number): (Date|null)[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month+1, 0);
  const startDow = (first.getDay()+6)%7;
  const days: (Date|null)[] = [];
  for (let i=0;i<startDow;i++) days.push(null);
  for (let d=1;d<=last.getDate();d++) days.push(new Date(year,month,d));
  while (days.length%7!==0) days.push(null);
  return days;
}

// ─── Best windows algorithm ───────────────────────────────────────
export interface DayData { date: Date; avail: string[]; unavail: string[]; }
export interface Window  { start: string; end: string; len: number; min: number; avg: number; }

export function computeBestWindows(
  dayMap: Record<string, DayData>,
  tripMin: number,
  tripMax: number,
  topN = 3
): Window[] {
  const keys = Object.keys(dayMap).sort();
  const wins: Window[] = [];

  for (let len = tripMin; len <= tripMax; len++) {
    for (let i = 0; i <= keys.length - len; i++) {
      const sl = keys.slice(i, i+len);
      // must be strictly consecutive
      let ok = true;
      for (let j=1; j<sl.length; j++) {
        if (daysBetween(parseYmd(sl[j-1]), parseYmd(sl[j])) !== 1) { ok=false; break; }
      }
      if (!ok) continue;
      const minScore = Math.min(...sl.map(k=>dayMap[k].avail.length));
      const avgScore = sl.reduce((a,k)=>a+dayMap[k].avail.length, 0) / sl.length;
      wins.push({ start:sl[0], end:sl[sl.length-1], len, min:minScore, avg:avgScore });
    }
  }

  return wins
    .sort((a,b) => b.min-a.min || b.len-a.len || b.avg-a.avg)
    .slice(0, topN);
}

export function buildDayMap(
  startDate: string,
  endDate:   string,
  responses: { name: string; ranges: DateRange[] }[]
): Record<string, DayData> {
  const min = parseYmd(startDate);
  const max = parseYmd(endDate);
  const total = daysBetween(min, max) + 1;
  const dayMap: Record<string, DayData> = {};

  for (let i=0; i<total; i++) {
    const d = addDays(min, i);
    dayMap[ymd(d)] = { date:d, avail:[], unavail:[] };
  }

  responses.forEach(r => {
    const sel = rangesToSet(r.ranges);
    Object.keys(dayMap).forEach(k => {
      if (sel.has(k)) dayMap[k].avail.push(r.name);
      else            dayMap[k].unavail.push(r.name);
    });
  });

  return dayMap;
}
