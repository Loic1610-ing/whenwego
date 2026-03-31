"use client";
// src/components/CountrySelector.tsx

import { useState, useEffect, useRef } from "react";
import { C } from "./ui";
import type { Destination } from "@/lib/supabase.browser";

const WORLD_COUNTRIES = [
  { name: "Afghanistan", flag: "🇦🇫", cities: ["Kaboul", "Kandahar", "Hérat"] },
  { name: "Afrique du Sud", flag: "🇿🇦", cities: ["Cape Town", "Johannesburg", "Durban", "Pretoria"] },
  { name: "Albanie", flag: "🇦🇱", cities: ["Tirana", "Durrës", "Shkodër"] },
  { name: "Algérie", flag: "🇩🇿", cities: ["Alger", "Oran", "Constantine", "Annaba"] },
  { name: "Allemagne", flag: "🇩🇪", cities: ["Berlin", "Munich", "Hambourg", "Cologne", "Francfort"] },
  { name: "Andorre", flag: "🇦🇩", cities: ["Andorre-la-Vieille"] },
  { name: "Angola", flag: "🇦🇴", cities: ["Luanda", "Huambo", "Lobito"] },
  { name: "Arabie Saoudite", flag: "🇸🇦", cities: ["Riyad", "Djeddah", "La Mecque", "Médine"] },
  { name: "Argentine", flag: "🇦🇷", cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Bariloche"] },
  { name: "Arménie", flag: "🇦🇲", cities: ["Erevan", "Gyumri"] },
  { name: "Australie", flag: "🇦🇺", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adélaïde"] },
  { name: "Autriche", flag: "🇦🇹", cities: ["Vienne", "Salzbourg", "Innsbruck", "Graz"] },
  { name: "Azerbaïdjan", flag: "🇦🇿", cities: ["Bakou", "Gandja"] },
  { name: "Bahamas", flag: "🇧🇸", cities: ["Nassau", "Freeport"] },
  { name: "Bahreïn", flag: "🇧🇭", cities: ["Manama"] },
  { name: "Bangladesh", flag: "🇧🇩", cities: ["Dacca", "Chittagong", "Sylhet"] },
  { name: "Belgique", flag: "🇧🇪", cities: ["Bruxelles", "Anvers", "Gand", "Bruges"] },
  { name: "Bénin", flag: "🇧🇯", cities: ["Cotonou", "Porto-Novo"] },
  { name: "Bhoutan", flag: "🇧🇹", cities: ["Thimphou", "Paro"] },
  { name: "Birmanie (Myanmar)", flag: "🇲🇲", cities: ["Naypyidaw", "Rangoun", "Mandalay"] },
  { name: "Bolivie", flag: "🇧🇴", cities: ["La Paz", "Santa Cruz", "Cochabamba", "Sucre"] },
  { name: "Bosnie-Herzégovine", flag: "🇧🇦", cities: ["Sarajevo", "Banja Luka", "Mostar"] },
  { name: "Botswana", flag: "🇧🇼", cities: ["Gaborone", "Francistown"] },
  { name: "Brésil", flag: "🇧🇷", cities: ["São Paulo", "Rio de Janeiro", "Salvador", "Fortaleza", "Brasília", "Florianópolis"] },
  { name: "Brunei", flag: "🇧🇳", cities: ["Bandar Seri Begawan"] },
  { name: "Bulgarie", flag: "🇧🇬", cities: ["Sofia", "Plovdiv", "Varna"] },
  { name: "Burkina Faso", flag: "🇧🇫", cities: ["Ouagadougou", "Bobo-Dioulasso"] },
  { name: "Burundi", flag: "🇧🇮", cities: ["Bujumbura", "Gitega"] },
  { name: "Cambodge", flag: "🇰🇭", cities: ["Phnom Penh", "Siem Reap", "Sihanoukville"] },
  { name: "Cameroun", flag: "🇨🇲", cities: ["Douala", "Yaoundé"] },
  { name: "Canada", flag: "🇨🇦", cities: ["Toronto", "Montréal", "Vancouver", "Calgary", "Québec"] },
  { name: "Cap-Vert", flag: "🇨🇻", cities: ["Praia", "Mindelo"] },
  { name: "Chili", flag: "🇨🇱", cities: ["Santiago", "Valparaíso", "Atacama", "Patagonie"] },
  { name: "Chine", flag: "🇨🇳", cities: ["Pékin", "Shanghai", "Guangzhou", "Chengdu", "Xi'an", "Guilin"] },
  { name: "Chypre", flag: "🇨🇾", cities: ["Nicosie", "Limassol", "Paphos"] },
  { name: "Colombie", flag: "🇨🇴", cities: ["Bogotá", "Medellín", "Carthagène", "Cali"] },
  { name: "Corée du Sud", flag: "🇰🇷", cities: ["Séoul", "Busan", "Jeju", "Gyeongju"] },
  { name: "Costa Rica", flag: "🇨🇷", cities: ["San José", "Manuel Antonio", "Arenal"] },
  { name: "Côte d'Ivoire", flag: "🇨🇮", cities: ["Abidjan", "Yamoussoukro", "Bouaké"] },
  { name: "Croatie", flag: "🇭🇷", cities: ["Zagreb", "Split", "Dubrovnik", "Zadar"] },
  { name: "Cuba", flag: "🇨🇺", cities: ["La Havane", "Trinidad", "Varadero", "Santiago de Cuba"] },
  { name: "Danemark", flag: "🇩🇰", cities: ["Copenhague", "Aarhus", "Odense"] },
  { name: "Égypte", flag: "🇪🇬", cities: ["Le Caire", "Alexandrie", "Louxor", "Charm el-Cheikh", "Assouan"] },
  { name: "Émirats arabes unis", flag: "🇦🇪", cities: ["Dubaï", "Abou Dhabi", "Charjah"] },
  { name: "Équateur", flag: "🇪🇨", cities: ["Quito", "Guayaquil", "Cuenca", "Galápagos"] },
  { name: "Espagne", flag: "🇪🇸", cities: ["Madrid", "Barcelone", "Séville", "Valence", "Grenade", "Bilbao"] },
  { name: "Estonie", flag: "🇪🇪", cities: ["Tallinn", "Tartu"] },
  { name: "Éthiopie", flag: "🇪🇹", cities: ["Addis-Abeba", "Gondar", "Lalibela"] },
  { name: "Fidji", flag: "🇫🇯", cities: ["Suva", "Nadi"] },
  { name: "Finlande", flag: "🇫🇮", cities: ["Helsinki", "Tampere", "Rovaniemi", "Turku"] },
  { name: "France", flag: "🇫🇷", cities: ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux", "Toulouse", "Strasbourg"] },
  { name: "Géorgie", flag: "🇬🇪", cities: ["Tbilissi", "Batoumi", "Kazbégi"] },
  { name: "Ghana", flag: "🇬🇭", cities: ["Accra", "Kumasi", "Tamale"] },
  { name: "Grèce", flag: "🇬🇷", cities: ["Athènes", "Thessalonique", "Santorin", "Mykonos", "Héraklion"] },
  { name: "Guatemala", flag: "🇬🇹", cities: ["Guatemala City", "Antigua", "Flores"] },
  { name: "Hongrie", flag: "🇭🇺", cities: ["Budapest", "Debrecen", "Pécs"] },
  { name: "Inde", flag: "🇮🇳", cities: ["Mumbai", "Delhi", "Jaipur", "Agra", "Varanasi", "Goa", "Bangalore"] },
  { name: "Indonésie", flag: "🇮🇩", cities: ["Jakarta", "Bali / Denpasar", "Yogyakarta", "Lombok"] },
  { name: "Irlande", flag: "🇮🇪", cities: ["Dublin", "Cork", "Galway"] },
  { name: "Islande", flag: "🇮🇸", cities: ["Reykjavik", "Akureyri", "Vik"] },
  { name: "Israël", flag: "🇮🇱", cities: ["Tel Aviv", "Jérusalem", "Haïfa", "Eilat"] },
  { name: "Italie", flag: "🇮🇹", cities: ["Rome", "Milan", "Venise", "Florence", "Naples", "Sicile", "Cinque Terre"] },
  { name: "Jamaïque", flag: "🇯🇲", cities: ["Kingston", "Montego Bay"] },
  { name: "Japon", flag: "🇯🇵", cities: ["Tokyo", "Kyoto", "Osaka", "Hiroshima", "Sapporo", "Nara"] },
  { name: "Jordanie", flag: "🇯🇴", cities: ["Amman", "Pétra", "Aqaba", "Wadi Rum"] },
  { name: "Kazakhstan", flag: "🇰🇿", cities: ["Almaty", "Astana"] },
  { name: "Kenya", flag: "🇰🇪", cities: ["Nairobi", "Mombasa", "Masai Mara"] },
  { name: "Laos", flag: "🇱🇦", cities: ["Vientiane", "Luang Prabang"] },
  { name: "Lettonie", flag: "🇱🇻", cities: ["Riga", "Liepāja"] },
  { name: "Liban", flag: "🇱🇧", cities: ["Beyrouth", "Byblos", "Sidon"] },
  { name: "Lituanie", flag: "🇱🇹", cities: ["Vilnius", "Kaunas"] },
  { name: "Luxembourg", flag: "🇱🇺", cities: ["Luxembourg-Ville"] },
  { name: "Madagascar", flag: "🇲🇬", cities: ["Antananarivo", "Nosy Be", "Toliara"] },
  { name: "Malaisie", flag: "🇲🇾", cities: ["Kuala Lumpur", "Penang", "Langkawi", "Kota Kinabalu"] },
  { name: "Maldives", flag: "🇲🇻", cities: ["Malé", "Maafushi", "Baa Atoll"] },
  { name: "Malte", flag: "🇲🇹", cities: ["La Valette", "Gozo", "Mdina"] },
  { name: "Maroc", flag: "🇲🇦", cities: ["Marrakech", "Casablanca", "Fès", "Rabat", "Essaouira", "Chefchaouen"] },
  { name: "Maurice", flag: "🇲🇺", cities: ["Port-Louis", "Grand Baie"] },
  { name: "Mexique", flag: "🇲🇽", cities: ["Mexico", "Cancún", "Oaxaca", "San Cristóbal", "Guadalajara"] },
  { name: "Mongolie", flag: "🇲🇳", cities: ["Oulan-Bator", "Désert de Gobi"] },
  { name: "Montenegro", flag: "🇲🇪", cities: ["Podgorica", "Kotor", "Budva"] },
  { name: "Namibie", flag: "🇳🇦", cities: ["Windhoek", "Swakopmund", "Sossusvlei"] },
  { name: "Népal", flag: "🇳🇵", cities: ["Katmandou", "Pokhara", "Everest Base Camp"] },
  { name: "Norvège", flag: "🇳🇴", cities: ["Oslo", "Bergen", "Tromsø", "Flåm"] },
  { name: "Nouvelle-Zélande", flag: "🇳🇿", cities: ["Auckland", "Wellington", "Queenstown", "Christchurch"] },
  { name: "Oman", flag: "🇴🇲", cities: ["Mascate", "Salalah", "Nizwa"] },
  { name: "Ouzbékistan", flag: "🇺🇿", cities: ["Tachkent", "Samarcande", "Boukhara"] },
  { name: "Pakistan", flag: "🇵🇰", cities: ["Karachi", "Lahore", "Islamabad", "Peshawar"] },
  { name: "Panama", flag: "🇵🇦", cities: ["Panama City", "Bocas del Toro", "Boquete"] },
  { name: "Pays-Bas", flag: "🇳🇱", cities: ["Amsterdam", "Rotterdam", "La Haye", "Utrecht"] },
  { name: "Pérou", flag: "🇵🇪", cities: ["Lima", "Cusco", "Arequipa", "Machu Picchu"] },
  { name: "Philippines", flag: "🇵🇭", cities: ["Manille", "Palawan", "Cebu", "Boracay"] },
  { name: "Pologne", flag: "🇵🇱", cities: ["Varsovie", "Cracovie", "Gdańsk", "Wrocław"] },
  { name: "Portugal", flag: "🇵🇹", cities: ["Lisbonne", "Porto", "Algarve", "Madère", "Açores"] },
  { name: "Qatar", flag: "🇶🇦", cities: ["Doha"] },
  { name: "Roumanie", flag: "🇷🇴", cities: ["Bucarest", "Cluj-Napoca", "Braşov", "Sibiu"] },
  { name: "Royaume-Uni", flag: "🇬🇧", cities: ["Londres", "Édimbourg", "Manchester", "Bath", "Oxford"] },
  { name: "Russie", flag: "🇷🇺", cities: ["Moscou", "Saint-Pétersbourg", "Kazan", "Irkoutsk"] },
  { name: "Rwanda", flag: "🇷🇼", cities: ["Kigali"] },
  { name: "Sénégal", flag: "🇸🇳", cities: ["Dakar", "Saint-Louis", "Ziguinchor"] },
  { name: "Serbie", flag: "🇷🇸", cities: ["Belgrade", "Novi Sad"] },
  { name: "Seychelles", flag: "🇸🇨", cities: ["Victoria", "Praslin", "La Digue"] },
  { name: "Singapour", flag: "🇸🇬", cities: ["Singapour"] },
  { name: "Slovaquie", flag: "🇸🇰", cities: ["Bratislava", "Košice"] },
  { name: "Slovénie", flag: "🇸🇮", cities: ["Ljubljana", "Bled", "Piran"] },
  { name: "Sri Lanka", flag: "🇱🇰", cities: ["Colombo", "Kandy", "Ella", "Sigiriya"] },
  { name: "Suède", flag: "🇸🇪", cities: ["Stockholm", "Göteborg", "Malmö", "Kiruna"] },
  { name: "Suisse", flag: "🇨🇭", cities: ["Genève", "Zurich", "Berne", "Interlaken", "Zermatt"] },
  { name: "Taïwan", flag: "🇹🇼", cities: ["Taipei", "Tainan", "Kaohsiung"] },
  { name: "Tanzanie", flag: "🇹🇿", cities: ["Dar es Salaam", "Zanzibar", "Arusha", "Kilimandjaro"] },
  { name: "Tchéquie", flag: "🇨🇿", cities: ["Prague", "Brno", "Český Krumlov"] },
  { name: "Thaïlande", flag: "🇹🇭", cities: ["Bangkok", "Chiang Mai", "Koh Samui", "Phuket", "Pattaya"] },
  { name: "Tunisie", flag: "🇹🇳", cities: ["Tunis", "Carthage", "Djerba", "Sousse"] },
  { name: "Turquie", flag: "🇹🇷", cities: ["Istanbul", "Ankara", "Cappadoce", "Antalya", "Éphèse"] },
  { name: "Ukraine", flag: "🇺🇦", cities: ["Kyiv", "Lviv", "Odessa"] },
  { name: "Uruguay", flag: "🇺🇾", cities: ["Montevideo", "Punta del Este"] },
  { name: "Vietnam", flag: "🇻🇳", cities: ["Hanoï", "Hô Chi Minh-Ville", "Hội An", "Ha Long", "Da Nang"] },
  { name: "Zambie", flag: "🇿🇲", cities: ["Lusaka", "Livingstone"] },
  { name: "Zimbabwe", flag: "🇿🇼", cities: ["Harare", "Bulawayo", "Victoria Falls"] },
];

interface Props {
  destinations: Destination[];
  onChange:     (d: Destination[]) => void;
}

export function CountrySelector({ destinations, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? WORLD_COUNTRIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : WORLD_COUNTRIES;

  const selectedNames = destinations.map(d => d.country);

  function toggleCountry(c: typeof WORLD_COUNTRIES[0]) {
    if (selectedNames.includes(c.name)) {
      onChange(destinations.filter(d => d.country !== c.name));
    } else {
      onChange([...destinations, { country: c.name, flag: c.flag, cities: [] }]);
      setQuery("");
    }
  }

  function toggleCity(countryName: string, city: string) {
    onChange(destinations.map(d => {
      if (d.country !== countryName) return d;
      const cities = d.cities.includes(city)
        ? d.cities.filter(c => c !== city)
        : [...d.cities, city];
      return { ...d, cities };
    }));
  }

  return (
    <div>
      {/* Selected countries */}
      {destinations.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {destinations.map(dest => {
            const cData = WORLD_COUNTRIES.find(c => c.name === dest.country);
            return (
              <div key={dest.country} style={{ marginBottom: 10, background: C.accentLight, border: `1px solid ${C.accentMid}44`, borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: cData?.cities.length ? 8 : 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.accent }}>{dest.flag} {dest.country}</span>
                  <button onClick={() => toggleCountry(cData ?? { name: dest.country, flag: dest.flag, cities: [] })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.warn, fontSize: 16, lineHeight: "1", padding: "0 2px" }}>✕</button>
                </div>
                {cData && cData.cities.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: C.accentMid, fontWeight: 600, marginBottom: 6 }}>Villes (facultatif)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {cData.cities.map(city => {
                        const sel = dest.cities.includes(city);
                        return (
                          <button key={city} onClick={() => toggleCity(dest.country, city)} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .12s", border: `1.5px solid ${sel ? C.accent : C.border}`, background: sel ? C.accent : "#fff", color: sel ? "#fff" : C.textMid, fontWeight: sel ? 600 : 400 }}>
                            {city}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      <div ref={ref} style={{ position: "relative" }}>
        <div onClick={() => setOpen(o => !o)} style={{ padding: "11px 14px", borderRadius: 10, fontSize: 14, cursor: "pointer", background: C.bg, border: `1.5px solid ${open ? C.accentMid : C.border}`, color: C.textMid, display: "flex", alignItems: "center", justifyContent: "space-between", transition: "border .15s" }}>
          <span>+ Ajouter une destination</span>
          <span style={{ color: C.textLight, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </div>

        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: `1.5px solid ${C.accentMid}`, borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 320, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un pays…"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, color: C.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.length === 0 && <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: C.textLight }}>Aucun résultat</div>}
              {filtered.map(c => {
                const sel = selectedNames.includes(c.name);
                return (
                  <div key={c.name} onClick={() => toggleCountry(c)}
                    style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: sel ? C.accentLight : "transparent", borderBottom: `1px solid ${C.border}`, transition: "background .1s" }}>
                    <span style={{ fontSize: 18 }}>{c.flag}</span>
                    <span style={{ flex: 1, fontSize: 14, color: C.text, fontWeight: sel ? 600 : 400 }}>{c.name}</span>
                    {sel && <span style={{ color: C.accent, fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
