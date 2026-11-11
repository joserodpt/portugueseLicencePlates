import { convert1911 } from "./convert1911";
import {
  byCode,
  conversion1911,
  diplomatic,
  districts,
  exportCustoms,
  gnrFunctions,
  letterGroups,
  municipalities,
  rules,
  seriesById,
  trailerLisbon,
  type LetterGroup,
} from "./data";
import { hasKWY, next2020, vowelRuleOk } from "./letters";
import { L, type Fact, type Interpretation, type Issue, type Localized, type SeriesId } from "./types";

// ---------------------------------------------------------------- helpers ---

const SEPARATORS = /[\s\-–—·./]+/g;

/** Uppercase, trimmed, every run of separators collapsed to a single "-". */
export const canonical = (input: string) =>
  input.normalize("NFC").toUpperCase().trim().replace(SEPARATORS, "-").replace(/^-|-$/g, "");
const compactOf = (canon: string) => canon.replace(/-/g, "");

type Match = { g: string[]; confidence: Interpretation["confidence"] };

function match(canon: string, strict: RegExp, loose: RegExp): Match | null {
  const s = strict.exec(canon);
  if (s) return { g: s.slice(1), confidence: "exact" };
  const l = loose.exec(compactOf(canon));
  return l ? { g: l.slice(1), confidence: "loose" } : null;
}

const fact = (label: Localized, value: Localized | string): Fact => ({
  label,
  value: typeof value === "string" ? L(value) : value,
});
const issue = (severity: Issue["severity"], message: Localized, source?: string): Issue => ({
  severity,
  message,
  source,
});

const F = {
  series: L("Série", "Series"),
  period: L("Período", "Period"),
  zone: L("Zona", "Zone"),
  group: L("Grupo de letras", "Letter group"),
  region: L("Serviço de registo", "Registration office"),
  number: L("Número", "Number"),
  use: L("Utilização", "Use"),
  conversion: L("Conversão para 1937", "Converted in 1937 to"),
  municipality: L("Município", "Municipality"),
  registered: L("Registado", "Registered"),
  function: L("Função", "Function"),
  customs: L("Alfândega", "Customs office"),
  country: L("País / organização", "Country / organisation"),
  status: L("Estatuto", "Status"),
  next: L("Seguinte (ordem presumida)", "Next (assumed order)"),
  band: L("Barra lateral", "Side band"),
};

function base(id: SeriesId, display: string, m: Match, extra: Partial<Interpretation> = {}): Interpretation {
  const s = seriesById[id];
  return {
    series: id,
    display,
    confidence: m.confidence,
    style: s.style,
    title: s.name,
    facts: [],
    issues: [],
    ...extra,
  };
}

const groupNote = (g: LetterGroup): Localized => {
  const since = g.since ? (g.until && g.until !== g.since ? ` (${g.since}–${g.until})` : g.until ? ` (${g.since})` : ` (desde ${g.since})`) : "";
  const sinceEn = g.since ? (g.until && g.until !== g.since ? ` (${g.since}–${g.until})` : g.until ? ` (${g.since})` : ` (since ${g.since})`) : "";
  return L(g.name.pt + since, g.name.en + sinceEn);
};

const KIND: Record<LetterGroup["kind"], Localized> = {
  island: L("Ilhas", "Islands"),
  "temporary-import": L("Importação temporária (chapa vermelha)", "Temporary import (red plate)"),
  regional: L("Serviço regional (anos 70)", "Regional office (1970s)"),
  "ex-colony": L("Antigas colónias", "Former colonies"),
  military: L("Militar", "Military"),
  import: L("Importação", "Import"),
  diplomatic: L("Diplomático (chapa branca, caracteres vermelhos)", "Diplomatic (white plate, red characters)"),
  state: L("Estado", "State"),
};

const unverifiedGroup = (g: LetterGroup) =>
  issue(
    "unverified",
    L(
      `A atribuição de ${g.pairs.join("/")} a “${g.name.pt}” está por confirmar na fonte.`,
      `Assigning ${g.pairs.join("/")} to “${g.name.en}” is unconfirmed in the source.`,
    ),
    g.source,
  );

// ---------------------------------------------------------------- matchers ---

function m1911(canon: string): Interpretation[] {
  const out: Interpretation[] = [];
  const m = match(canon, /^([NCSAM])-(\d{1,5})(?:-(A|WW))?$/, /^([NCSAM])(\d{1,5})(A|WW)?$/);
  if (m) {
    const [zone, digits, suffix] = m.g;
    const islands = zone === "A" || zone === "M";
    const it = base("1911", `${zone}-${digits}${suffix ? "-" + suffix : ""}`, m);
    it.facts.push(fact(F.zone, conversion1911[zone].zone));
    it.facts.push(
      fact(F.period, islands ? L("1918–1962", "1918–1962") : L("1911–1936", "1911–1936")),
    );
    it.facts.push(fact(F.number, digits));
    if (suffix === "A") it.facts.push(fact(F.use, L("Automóvel de aluguer", "Hire car")));
    if (suffix === "WW") it.facts.push(fact(F.use, L("Matrícula provisória", "Provisional plate")));
    const conv = convert1911(canon);
    if (conv.ok) it.facts.push(fact(F.conversion, conv.plate));
    else it.issues.push(issue("info", conv.reason));
    out.push(it);
  }
  const army = match(canon, /^MG-(\d{1,4})$/, /^MG(\d{1,4})$/);
  if (army) {
    const it = base("1911", `MG-${army.g[0]}`, army, {
      title: L("Exército, série MG-000 (1911 – anos 50)", "Army, MG-000 series (1911 – 1950s)"),
    });
    it.facts.push(fact(F.use, L("Exército Português", "Portuguese Army")));
    out.push(it);
  }
  return out;
}

function m1937(canon: string): Interpretation[] {
  const m = match(canon, /^([A-Z]{2})-(\d{2})-(\d{2})$/, /^([A-Z]{2})(\d{2})(\d{2})$/);
  if (!m) return [];
  const [pair, a, b] = m.g;
  const it = base("1937", `${pair}-${a}-${b}`, m);
  const zone = letterGroups.zones1937.find((z) => pair >= z.from && pair <= z.to);
  if (zone) {
    it.facts.push(
      fact(F.zone, L(`${zone.name.pt} (até ao início dos anos 80)`, `${zone.name.en} (until the early 1980s)`)),
    );
  }
  for (const g of letterGroups.groups1937.filter((g) => g.pairs.includes(pair))) {
    it.facts.push(fact(KIND[g.kind], groupNote(g)));
    if (g.style) it.style = g.style;
    if (g.verified === false) it.issues.push(unverifiedGroup(g));
  }
  if (hasKWY(pair)) {
    it.issues.push(
      issue(
        "invalid",
        L("As letras K, W e Y não eram usadas nesta série.", "The letters K, W and Y were not used in this series."),
        rules.alphabet.source,
      ),
    );
  }
  const banned = rules.banned1937;
  const bannedHit = [...pair].filter((c) => banned.letters.includes(c));
  if (bannedHit.length || banned.pairs.includes(pair)) {
    const what = banned.pairs.includes(pair) ? pair : bannedHit.join(" e ");
    const whatEn = banned.pairs.includes(pair) ? pair : bannedHit.join(" and ");
    it.issues.push(
      issue(
        "anachronism",
        L(
          `${what} só começou a ser usado no início dos anos 80; esta matrícula não é anterior a essa data.`,
          `${whatEn} only came into use in the early 1980s, so this plate is not older than that.`,
        ),
        banned.source,
      ),
    );
  }
  return [it];
}

const NEVER_1992 = /^[WY]/; // WA–WZ and YA–YZ: reserved, never used

function m1992(canon: string): Interpretation[] {
  const m = match(canon, /^(\d{2})-(\d{2})-([A-Z]{2})$/, /^(\d{2})(\d{2})([A-Z]{2})$/);
  if (!m) return [];
  const [a, b, pair] = m.g;
  const it = base("1992", `${a}-${b}-${pair}`, m);
  it.facts.push(
    fact(
      F.band,
      L(
        "Sem barra amarela se matriculado até 31/12/1997; com barra amarela (ano/mês) a partir de 1998.",
        "No yellow band if registered by 31/12/1997; yellow band (year/month) from 1998.",
      ),
    ),
  );
  const groups = letterGroups.groups1992.filter((g) => g.pairs.includes(pair));
  for (const g of groups) {
    it.facts.push(fact(KIND[g.kind], groupNote(g)));
    if (g.verified === false) it.issues.push(unverifiedGroup(g));
  }
  if (NEVER_1992.test(pair)) {
    it.issues.push(issue("invalid", rules.never1992.note, rules.never1992.source));
  } else if (pair[0] === "K") {
    if (!groups.length) it.issues.push(
      issue(
        "unverified",
        L(
          "Os grupos K foram usados em importações de 1997; a fonte de 2023 só documenta até KG.",
          "K pairs were used for 1997 imports; the 2023 source only documents up to KG.",
        ),
        "wikipedia-pt",
      ),
    );
  } else if (hasKWY(pair)) {
    it.issues.push(
      issue(
        "invalid",
        L("As letras K, W e Y não eram usadas nesta série (exceto K como primeira letra nas importações).", "The letters K, W and Y were not used in this series (except K as the first letter for imports)."),
        rules.alphabet.source,
      ),
    );
  }
  return [it];
}

function m2005(canon: string): Interpretation[] {
  const m = match(canon, /^(\d{2})-([A-Z]{2})-(\d{2})$/, /^(\d{2})([A-Z]{2})(\d{2})$/);
  if (!m) return [];
  const [a, pair, b] = m.g;
  const it = base("2005", `${a}-${pair}-${b}`, m);
  it.facts.push(fact(F.band, L("Barra amarela com ano e mês da primeira matrícula.", "Yellow band with the year and month of first registration.")));
  if (hasKWY(pair)) {
    it.issues.push(
      issue("invalid", L("As letras K, W e Y não eram usadas nesta série.", "The letters K, W and Y were not used in this series."), rules.alphabet.source),
    );
  }
  return [it];
}

function m2020(canon: string): Interpretation[] {
  const m = match(canon, /^([A-Z]{2})-(\d{2})-([A-Z]{2})$/, /^([A-Z]{2})(\d{2})([A-Z]{2})$/);
  if (!m) return [];
  const [left, num, right] = m.g;
  const display = `${left} ${num} ${right}`;
  const it = base("2020", display, m);
  if (`${left}-${num}-${right}` === rules.reserved2020.plates[0]) {
    it.issues.push(issue("invalid", L("Reservada pelo IMT “para memória futura”; nunca foi emitida.", "Reserved by IMT “for posterity”; never issued."), rules.reserved2020.source));
  }
  if (display.replace(/ /g, "-") === rules.reserved2020.firstIssued.plate) {
    it.facts.push(fact(L("Curiosidade", "Trivia"), L("Primeira matrícula deste formato, emitida a 3/3/2020 para um carro elétrico.", "The first plate in this format, issued on 3/3/2020 to an electric car.")));
  }
  if (!vowelRuleOk(left, right)) {
    it.issues.push(issue("invalid", rules.vowelRule2020.note, rules.vowelRule2020.source));
  }
  if (hasKWY(left + right)) {
    it.issues.push(issue("unverified", rules.alphabet.note, rules.alphabet.source));
  } else if (!it.issues.length) {
    const next = next2020(display);
    if (next) it.facts.push(fact(F.next, next));
  }
  return [it];
}

function mMoto(canon: string): Interpretation[] {
  const m = match(canon, /^(\d{1,3})-([A-Z]{3})-(\d{2})-(\d{2})$/, /^(\d{1,3})([A-Z]{3})(\d{2})(\d{2})$/);
  if (!m) return [];
  const [n, code, a, b] = m.g;
  const it = base("moto-municipal", `${n}-${code} ${a}-${b}`, m);
  const found = byCode(municipalities, code);
  if (!found.length) {
    it.issues.push(issue("invalid", L(`Código de município desconhecido: ${code}.`, `Unknown municipality code: ${code}.`), "pdf-2023"));
  }
  for (const mun of found) it.facts.push(fact(F.municipality, mun.name));
  const note = found.find((x) => x.note)?.note;
  if (note) it.issues.push(issue("unverified", note, "pdf-2023"));
  return [it];
}

function mTrailerCivil(canon: string): Interpretation[] {
  const m = match(canon, /^([A-Z]{1,2})-(\d{1,6})$/, /^([A-Z]{1,2})(\d{1,6})$/);
  if (!m) return [];
  const [code, digits] = m.g;
  const district = byCode(districts, code)[0];
  if (!district) return [];
  const it = base("trailer-civil", `${code}-${digits}`, m);
  it.facts.push(fact(F.region, L(`${district.name.pt} [${code}]`, `${district.name.en} [${code}]`)));
  if (district.verified === false && district.note) it.issues.push(issue("unverified", district.note, "wikipedia-pt"));
  it.facts.push(fact(F.number, digits));
  const max = code.length === 1 ? 6 : 5;
  if (digits.length > max) {
    it.issues.push(
      issue("invalid", L(`Com um código de ${code.length} letra(s), o número tem no máximo ${max} algarismos.`, `With a ${code.length}-letter code, the number has at most ${max} digits.`), "pdf-2023"),
    );
  }
  if (code === "L") {
    const n = Number(digits);
    const range = trailerLisbon.find((r) => n >= r.from && (r.to === null || n <= r.to));
    it.facts.push(
      fact(F.registered, range ? range.period : L("Antes de 1973 (data exata desconhecida)", "Before 1973 (exact date unknown)")),
    );
  }
  return [it];
}

function mTrailerMilitary(canon: string): Interpretation[] {
  const out: Interpretation[] = [];
  const army = match(canon, /^(\d{1,4})-M$/, /^(\d{1,4})M$/);
  if (army) {
    const it = base("trailer-military", `${army.g[0]}-M`, army);
    it.facts.push(fact(F.use, L("Exército", "Army")));
    out.push(it);
  }
  const air = match(canon, /^E-(\d{2})-(\d{2})$/, /^E(\d{2})(\d{2})$/);
  if (air) {
    const it = base("trailer-military", `E-${air.g[0]}-${air.g[1]}`, air);
    it.facts.push(fact(F.use, L("Força Aérea", "Air Force")));
    out.push(it);
  }
  const navy = match(canon, /^AP-(\d{2})-(\d{2})$/, /^AP(\d{2})(\d{2})$/);
  if (navy) {
    const it = base("trailer-military", `AP-${navy.g[0]}-${navy.g[1]}`, navy);
    it.facts.push(fact(F.use, L("Marinha (mesma sequência dos automóveis)", "Navy (same sequence as its cars)")));
    out.push(it);
  }
  return out;
}

function mGnr(canon: string): Interpretation[] {
  const m = match(canon, /^GNR-([A-Z])-(\d{1,4})$/, /^GNR([A-Z])(\d{1,4})$/);
  if (!m) return [];
  const [code, digits] = m.g;
  const it = base("gnr", `GNR ${code}-${digits}`, m);
  const fn = byCode(gnrFunctions, code)[0];
  if (fn) it.facts.push(fact(F.function, fn.name));
  else it.issues.push(issue("invalid", L(`Função GNR desconhecida: ${code}.`, `Unknown GNR function: ${code}.`), "pdf-2023"));
  return [it];
}

function mExport(canon: string): Interpretation[] {
  const m = match(canon, /^(\d{4,6})-([A-Z])$/, /^(\d{4,6})([A-Z])$/);
  if (!m) return [];
  const [digits, code] = m.g;
  const customs = byCode(exportCustoms, code)[0];
  if (!customs) return [];
  const it = base("export", `${digits}-${code}`, m);
  it.facts.push(fact(F.customs, customs.name));
  if (digits.length !== 5) {
    it.issues.push(issue("unverified", L("As fontes indicam 5 algarismos (00000-X).", "Sources give 5 digits (00000-X)."), "wikipedia-pt"));
  }
  return [it];
}

function mDiplomatic(canon: string): Interpretation[] {
  const m = match(canon, /^(\d{1,3})-(CD|CC|FM)-?(\d{1,3})$/, /^(\d{1,3})(CD|CC|FM)(\d{1,3})$/);
  if (!m) return [];
  const [country, status, n] = m.g;
  const it = base("diplomatic", `${country}-${status}${n}`, m);
  const c = diplomatic.countries.find((x) => x.code === Number(country));
  if (c) it.facts.push(fact(F.country, L(`${c.name.pt} [${c.code}]`, `${c.name.en} [${c.code}]`)));
  else it.issues.push(issue("unverified", L(`O código ${country} não consta da tabela conhecida.`, `Code ${country} is not in the known table.`), "pdf-2023"));
  it.facts.push(fact(F.status, byCode(diplomatic.statuses, status)[0].name));
  return [it];
}

const MATCHERS = [m1911, m1937, m1992, m2005, m2020, mMoto, mTrailerCivil, mTrailerMilitary, mGnr, mExport, mDiplomatic];

/**
 * Every way the input can be read as a Portuguese plate. Exact-format matches
 * (the separators fit too) come first. An empty list means no known format matches.
 */
export function decode(input: string): Interpretation[] {
  const canon = canonical(input);
  if (!canon) return [];
  const all = MATCHERS.flatMap((fn) => fn(canon));
  const seen = new Set<string>();
  return all
    .filter((it) => {
      const key = `${it.series}|${it.display}|${it.title.pt}`;
      return seen.has(key) ? false : (seen.add(key), true);
    })
    .sort((a, b) => (a.confidence === b.confidence ? 0 : a.confidence === "exact" ? -1 : 1));
}
