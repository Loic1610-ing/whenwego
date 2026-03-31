// src/lib/durationOptions.ts
export function buildDurationOptions() {
  const opts: { label: string; value: number }[] = [];
  for (let d=1; d<=30; d++) opts.push({ label: d===1?"1 jour":`${d} jours`, value:d });
  for (let m=1; m<=11; m++) opts.push({ label: m===1?"1 mois":`${m} mois`, value:m*30 });
  return opts;
}

export function durationLabel(v: number): string {
  return buildDurationOptions().find(d=>d.value===v)?.label ?? `${v}j`;
}
