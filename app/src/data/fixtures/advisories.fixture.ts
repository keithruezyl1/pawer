/**
 * Fixture feed for the app shell — twelve real entries from VECO's Aug 30 – Sep 5, 2026
 * advisory (typos and all), plus one synthetic `partial` and one synthetic `failed`.
 *
 * Times are stored as (day offset from Sunday, HH:MM) and re-anchored to the CURRENT week by
 * loadFixture(), so "today" always lands inside the fixture and every state can be exercised
 * by simply waiting or adjusting the device clock (plan verification §5).
 */
import { fromManila, manilaParts, toIsoManila, type Outage, type ParseStatus } from "@pawer/shared";

interface Rel {
  id: string;
  day: number; start: string;
  endDay?: number; end: string;
  lgus: string[]; barangays: string[];
  areas_raw: string; purpose_raw: string;
  parse_status?: ParseStatus; unknown_area_tokens?: string[];
}

const POST = "https://www.visayanelectric.com/post/service-interruption-august-30-september-5-2026";

const REL: Rel[] = [
  { id: "f1a2b3c4d5e6f701", day: 0, start: "08:00", end: "16:00", lgus: ["talisay-city"], barangays: ["talisay-city.tapul"],
    areas_raw: "Portion of Tapul, Talisay City, along portion of Tapul Brgy. Road.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Tapul by facilitating extension of secondary lines (line stringing) and extension of primary lines (line stringing)." },
  { id: "f1a2b3c4d5e6f702", day: 0, start: "20:30", end: "22:00", lgus: ["cebu-city"], barangays: ["cebu-city.camputhaw", "cebu-city.lahug", "cebu-city.san-roque"],
    areas_raw: "Portion of Camputhaw, Lahug & San Roque, Cebu City, along portion of Gorordo Avenue, including portions of Sitios Avocado, Drihoa, Kamagong, Kawayan, & San Roque, and Gochan Hills, Kintanar Compound, & Up Compound.",
    purpose_raw: "To ensure the safety of personnel working on the line." },
  { id: "f1a2b3c4d5e6f703", day: 0, start: "22:00", endDay: 1, end: "06:00", lgus: ["cebu-city"], barangays: ["cebu-city.camputhaw", "cebu-city.capitol-site", "cebu-city.lahug", "cebu-city.san-roque"],
    areas_raw: "Portion of Camputhaw, Capitol Site, Lahug & San Roque, Cebu City, along portions of A. Villalon Drive, Acacia Street, Escario Strett, Gorordo Avenue, J. Osmeña Ext. Road.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Camputhaw, Capitol Site, Lahug & San Roque by facilitating removal of line device hardware (DS/FCO/Insulator/LBS) and installation of automatic reclosing device (recloser) and Hotspot Correction." },
  { id: "f1a2b3c4d5e6f704", day: 1, start: "07:00", end: "17:00", lgus: ["mandaue-city"], barangays: ["mandaue-city.guizo", "mandaue-city.tipolo"],
    areas_raw: "Portion of Guizo & Tipolo, Mandaue City, along portions of Lopez Jaena Street, A. Del Rosario Street, M.C. Briones Street, & Magallanes Street, including portion of Sitio Sta. Cruz, and Basubas Compound & Jayme Compound.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Guizo & Tipolo by facilitating reconstruction of primary pole." },
  { id: "f1a2b3c4d5e6f705", day: 2, start: "09:00", end: "15:00", lgus: ["naga"], barangays: ["naga.colon"],
    areas_raw: "Portion of Colon, City of Naga, along portion of Cebu South Road.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Colon by facilitating rerouting of secondary lines." },
  { id: "f1a2b3c4d5e6f706", day: 2, start: "08:50", end: "15:00", lgus: ["naga"], barangays: ["naga.colon"],
    areas_raw: "Portion of Colon, City of Naga, along portion of Cebu South Road.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Colon by facilitating secondary line maintenance." },
  { id: "f1a2b3c4d5e6f707", day: 2, start: "06:00", end: "09:00", lgus: ["cebu-city"], barangays: ["cebu-city.hippodromo"],
    areas_raw: "Portion of Hipodromo, Cebu City, along portions of Ayala Access Road, Cardinal Rosales Avenue, Mccrew Ville Road, & Sorsogon Road, including portions of Sitios Tapok-tapok & Macroville, and Cebu Business Park, Floor Parkpoint Residences, & Solinea Cyan Tower 1",
    purpose_raw: "To increase the capacity of the distribution system serving Brgy. Hipodromo by facilitating installation of distribution transformer." },
  { id: "f1a2b3c4d5e6f708", day: 3, start: "03:00", end: "07:00", lgus: ["cebu-city"], barangays: ["cebu-city.lahug"],
    areas_raw: "Portion of Lahug, Cebu City, along portions of Salinas Drive & W Geonzon Street.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Lahug by facilitating replacement of damaged line device hardware (DS/FCO/Insulator/LBS) and Hotspot Correction." },
  { id: "f1a2b3c4d5e6f709", day: 3, start: "09:00", end: "14:30", lgus: ["naga", "minglanilla"],
    barangays: ["naga.alfaco", "naga.balirong", "naga.cantao-an", "naga.cogon", "naga.jaguimit", "naga.lanas", "naga.lutac", "naga.mayana", "naga.pangdan", "naga.south-poblacion", "naga.tagjaguimit", "naga.uling", "minglanilla.camp-8"],
    areas_raw: "Portion of City of Naga & Minglanilla (Alpaco, Balirong, Cantao-an, Cogon, Jaguimit, Lanas, Lutac, Mayana, Pangdan, South Poblacion, Tagjaguimit, Uling & Camp 8) along portions of Balirong Road, Naga Uling Road, Naga-Uling Road, & Tagjagumit Road.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Alpaco, Balirong, Cantao-an, Cogon, Jaguimit, Lanas, Lutac, Mayana, Pangdan, South Poblacion, Tagjaguimit, Uling & Camp 8 by facilitating correction of low voltage of the distribution transformer and installation of distribution transformer." },
  { id: "f1a2b3c4d5e6f70a", day: 4, start: "09:00", end: "17:00", lgus: ["liloan"], barangays: ["liloan.lataban", "liloan.san-roque", "liloan.san-vicente", "liloan.santa-cruz", "liloan.tabla"],
    areas_raw: "Portion of Lataban, San Roque, San Vicente, Sta. Cruz & Tabla, Liloan, along Aurelio V. Pepito Sr. St., Maple St.",
    purpose_raw: "To prevent unnecessary interruptions due to obstruction of pole in the distribution system serving Brgy. Lataban, San Roque, San Vicente, Sta. Cruz & Tabla by facilitating relocation of primary pole as per customer request." },
  { id: "f1a2b3c4d5e6f70b", day: 4, start: "09:00", end: "17:00", lgus: ["cebu-city"], barangays: ["cebu-city.mabolo", "cebu-city.san-roque"],
    areas_raw: "Portion of Mabolo & San Roque, Cebu City, along portion of M.J. Cuenco Avenue, including portions of Sitios Baha-Baha, Ciwak, Fatima, Lahing-Lahing, Maisa, Sinulog, Sta. Cruz Malinao, & Station, and Aznar Compound, Dream Homes, Escano Subdivision, Mld Dreamhouse, Somca Village, & Tower Persimmon Residence.",
    purpose_raw: "To prevent unnecessary interruptions due to obstruction of pole in the distribution system serving Brgy. Mabolo & San Roque by facilitating relocation of primary pole as per customer request." },
  { id: "f1a2b3c4d5e6f70c", day: 4, start: "22:00", endDay: 5, end: "06:00", lgus: ["mandaue-city"], barangays: ["mandaue-city.casuntingan", "mandaue-city.maguikay", "mandaue-city.bakilid"],
    areas_raw: "Portion of Casuntingan, Maguikay & Bakilid, Mandaue City, along portion of M.L. Quezon Avenue, including portions of Sitios Nangka & Tambis, and Country Club Village & Holy Family Townhouse.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Casuntingan, Maguikay & Bakilid by facilitating 69kV pole installation and dressing." },
  // synthetic: a subdivision in the head → partial, barangay still resolved (real pattern from the Aug 23 advisory)
  { id: "f1a2b3c4d5e6f70d", day: 5, start: "09:00", end: "17:00", lgus: ["talisay-city"], barangays: ["talisay-city.pooc"], parse_status: "partial", unknown_area_tokens: ["Corona Del Mar Subd"],
    areas_raw: "Portion of Pooc, Talisay City, Portions od Corona Del Mar Subd, along portion of Cebu South Road.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Pooc by facilitating installation of distribution transformer." },
  // synthetic: unreadable time → failed; shown with a source link, never used for state
  { id: "f1a2b3c4d5e6f70e", day: 6, start: "00:00", end: "00:00", lgus: ["cebu-city"], barangays: ["cebu-city.guadalupe"], parse_status: "failed",
    areas_raw: "Portion of Guadalupe, Cebu City, along R. Duterte Street.",
    purpose_raw: "To improve the reliability of the distribution system serving Brgy. Guadalupe by facilitating installation of distribution transformer and installation of primary pole." },
];

const hm = (s: string): [number, number] => { const [h, m] = s.split(":").map(Number); return [h!, m!]; };

/** Most recent Manila Sunday at 00:00 that is ≤ now. */
export function weekAnchor(nowMs: number): { year: number; month: number; day: number } {
  const p = manilaParts(nowMs);
  const sundayMs = fromManila(p.year, p.month, p.day) - p.weekday * 86_400_000;
  const s = manilaParts(sundayMs);
  return { year: s.year, month: s.month, day: s.day };
}

export function loadFixture(nowMs: number): Outage[] {
  const a = weekAnchor(nowMs);
  const dayMs = (offset: number, time: string) => {
    const [h, m] = hm(time);
    return fromManila(a.year, a.month, a.day + offset, h, m);
  };
  return REL.map((r) => {
    const s = dayMs(r.day, r.start);
    const e = dayMs(r.endDay ?? r.day, r.end);
    return {
      id: r.id,
      start: toIsoManila(s),
      end: toIsoManila(e),
      duration_minutes: Math.round((e - s) / 60000),
      lgus: r.lgus,
      barangays: r.barangays,
      unknown_area_tokens: r.unknown_area_tokens ?? [],
      areas_raw: r.areas_raw,
      purpose_raw: r.purpose_raw,
      parse_status: r.parse_status ?? "parsed",
      source_post_url: POST,
      source_published_at: toIsoManila(dayMs(-3, "09:12")),
    };
  });
}
