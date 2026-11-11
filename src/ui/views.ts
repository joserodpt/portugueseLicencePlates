import type { Strings } from "../i18n/strings";
import {
  diplomatic,
  districts,
  gnrFunctions,
  letterGroups,
  municipalities,
  series,
  sources,
} from "../rules/data";
import { decode } from "../rules/decode";
import type { Interpretation, Lang } from "../rules/types";
import { findWordPlates, type WordPlate } from "../rules/wordFinder";
import { h } from "./dom";
import { renderPlate } from "./plate";

export interface Ctx {
  lang: Lang;
  t: Strings;
}

// ------------------------------------------------------------------ decode ---

const EXAMPLES = [
  "AA 01 AA",
  "AB 31 CE",
  "45-PX-12",
  "12-34-KC",
  "TF-12-34",
  "QA-12-34",
  "S-1703-WW",
  "2-OER-20-75",
  "L-60000",
  "GNR L-1234",
  "55-CD123",
  "12345-P",
];

function sourceLink(id: string | undefined, ctx: Ctx) {
  if (!id || !sources[id]) return null;
  const s = sources[id];
  return h(
    "span",
    { class: "source" },
    ` ${ctx.t.source}: `,
    s.url ? h("a", { href: s.url, target: "_blank", rel: "noopener" }, s.title) : s.title,
  );
}

function card(it: Interpretation, ctx: Ctx) {
  const worst = it.issues.find((i) => i.severity === "invalid")
    ? "invalid"
    : it.issues.find((i) => i.severity === "anachronism" || i.severity === "unverified")
      ? "warn"
      : "ok";
  return h(
    "article",
    { class: `card card-${worst}` },
    h("div", { class: "card-head" }, renderPlate(it.display, it.style), h("h3", {}, it.title[ctx.lang])),
    h(
      "dl",
      { class: "facts" },
      it.facts.flatMap((f) => [h("dt", {}, f.label[ctx.lang]), h("dd", {}, f.value[ctx.lang])]),
    ),
    it.issues.length
      ? h(
          "ul",
          { class: "issues" },
          it.issues.map((i) =>
            h(
              "li",
              { class: `issue issue-${i.severity}` },
              h("span", { class: "badge" }, ctx.t[`sev_${i.severity}`]),
              " ",
              i.message[ctx.lang],
              sourceLink(i.source, ctx),
            ),
          ),
        )
      : h("p", { class: "valid" }, "✓ ", ctx.t.valid),
  );
}

export function decodeView(ctx: Ctx, initial: string, onChange: (value: string) => void) {
  const results = h("div", { class: "results", "aria-live": "polite" });
  const input = h("input", {
    id: "plate-input",
    class: "plate-input",
    type: "text",
    autocomplete: "off",
    autocapitalize: "characters",
    spellcheck: "false",
    placeholder: ctx.t.inputPlaceholder,
    value: initial,
  }) as HTMLInputElement;

  const render = () => {
    const value = input.value;
    onChange(value);
    results.replaceChildren();
    if (!value.trim()) {
      results.append(h("p", { class: "muted" }, ctx.t.emptyDecode));
      return;
    }
    const found = decode(value);
    if (!found.length) {
      results.append(h("p", { class: "empty" }, ctx.t.noMatch));
      return;
    }
    const exact = found.filter((f) => f.confidence === "exact");
    const loose = found.filter((f) => f.confidence === "loose");
    results.append(...exact.map((it) => card(it, ctx)));
    if (loose.length) {
      results.append(h("h2", { class: "also" }, exact.length ? ctx.t.alsoPossible : ""));
      results.append(...loose.map((it) => card(it, ctx)));
    }
  };
  input.addEventListener("input", render);

  const examples = h(
    "div",
    { class: "examples" },
    h("span", { class: "muted" }, ctx.t.examples + ": "),
    EXAMPLES.map((ex) =>
      h(
        "button",
        {
          type: "button",
          class: "chip",
          onclick: () => {
            input.value = ex;
            render();
            input.focus();
          },
        },
        ex,
      ),
    ),
  );

  render();
  queueMicrotask(() => input.focus());
  return h(
    "section",
    { class: "view" },
    h("label", { for: "plate-input", class: "label" }, ctx.t.inputLabel),
    input,
    examples,
    results,
  );
}

// ------------------------------------------------------------------- words ---

let wordListCache: string[] | null = null;
async function loadWords(): Promise<string[]> {
  if (!wordListCache) {
    const mod = await import("../../data/words-pt.txt?raw");
    wordListCache = mod.default.split(/\r?\n/);
  }
  return wordListCache;
}

function csv(rows: WordPlate[]) {
  const body = ["plate,word,vowel_rule_ok", ...rows.map((r) => `${r.plate},${r.word},${r.vowelRuleOk}`)].join("\n");
  return URL.createObjectURL(new Blob([body], { type: "text/csv" }));
}

export function wordsView(ctx: Ctx) {
  const vowel = h("input", { type: "checkbox", checked: true }) as HTMLInputElement;
  const kwy = h("input", { type: "checkbox" }) as HTMLInputElement;
  const prefix = h("input", { type: "text", maxlength: "6", class: "prefix", autocapitalize: "characters" }) as HTMLInputElement;
  const custom = h("textarea", { rows: "3", spellcheck: "false" }) as HTMLTextAreaElement;
  const count = h("p", { class: "muted" }, ctx.t.wordsLoading);
  const download = h("a", { class: "button", download: "matriculas-palavras.csv" }, ctx.t.wordsCsv) as HTMLAnchorElement;
  const list = h("ol", { class: "word-list" });

  const run = async () => {
    const words = custom.value.trim() ? custom.value.split(/[\s,;]+/) : await loadWords();
    const rows = findWordPlates(words, { vowelRule: vowel.checked, includeKWY: kwy.checked, prefix: prefix.value });
    count.textContent = ctx.t.wordsCount(rows.length, words.filter(Boolean).length);
    if (download.href) URL.revokeObjectURL(download.href);
    download.href = csv(rows);
    list.replaceChildren(
      ...rows.slice(0, 2000).map((r) =>
        h(
          "li",
          { class: r.vowelRuleOk ? "" : "forbidden", title: r.vowelRuleOk ? undefined : ctx.t.wordsForbidden },
          renderPlate(r.plate, "euro-2020"),
          h("span", { class: "word" }, r.word),
        ),
      ),
    );
  };
  for (const el of [vowel, kwy]) el.addEventListener("change", run);
  for (const el of [prefix, custom]) el.addEventListener("input", run);
  void run();

  return h(
    "section",
    { class: "view" },
    h("p", {}, ctx.t.wordsIntro),
    h(
      "div",
      { class: "controls" },
      h("label", {}, vowel, " ", ctx.t.wordsVowel),
      h("label", {}, kwy, " ", ctx.t.wordsKWY),
      h("label", {}, ctx.t.wordsPrefix, " ", prefix),
    ),
    h("details", {}, h("summary", {}, ctx.t.wordsCustom), custom),
    h("div", { class: "row" }, count, download),
    list,
  );
}

// --------------------------------------------------------------- reference ---

type Row = string[];
function tables(ctx: Ctx): Record<string, { head: string[]; rows: Row[] }> {
  const t = ctx.t;
  const l = ctx.lang;
  return {
    series: {
      head: [t.colName, t.colFormat, t.colPeriod],
      rows: series.map((s) => [s.name[l], s.format, [s.from?.slice(0, 4), s.to?.slice(0, 4) ?? "…"].filter(Boolean).join("–")]),
    },
    groups: {
      head: [t.colCode, t.colKind, t.colName],
      rows: [
        ...letterGroups.zones1937.map((z) => [`${z.from}–${z.to}`, "1937", z.name[l]]),
        ...letterGroups.groups1937.map((g) => [g.pairs.join(", "), g.kind, g.name[l] + (g.verified === false ? " (?)" : "")]),
        ...letterGroups.groups1992.map((g) => [g.pairs.join(", "), "1992", g.name[l] + (g.verified === false ? " (?)" : "")]),
      ],
    },
    municipalities: {
      head: [t.colCode, t.colName],
      rows: municipalities.map((m) => [m.code, m.name + (m.verified === false ? " (?)" : "")]),
    },
    districts: { head: [t.colCode, t.colName], rows: districts.map((d) => [d.code, d.name[l]]) },
    gnr: { head: [t.colCode, t.colName], rows: gnrFunctions.map((g) => [g.code, g.name[l]]) },
    diplomatic: {
      head: [t.colCode, t.colName],
      rows: [
        ...diplomatic.statuses.map((s) => [s.code, s.name[l]]),
        ...diplomatic.countries.map((c) => [String(c.code), c.name[l]]),
      ],
    },
  };
}

export function referenceView(ctx: Ctx) {
  const all = tables(ctx);
  const keys = ["series", "groups", "municipalities", "districts", "gnr", "diplomatic"] as const;
  const select = h(
    "select",
    { id: "ref-table" },
    keys.map((k) => h("option", { value: k }, ctx.t[`ref_${k}`])),
  ) as HTMLSelectElement;
  const search = h("input", { id: "ref-search", type: "search" }) as HTMLInputElement;
  const holder = h("div", { class: "table-wrap" });
  const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  const render = () => {
    const { head, rows } = all[select.value];
    const q = fold(search.value.trim());
    const shown = q ? rows.filter((r) => r.some((c) => fold(c).includes(q))) : rows;
    holder.replaceChildren(
      h(
        "table",
        {},
        h("thead", {}, h("tr", {}, head.map((c) => h("th", {}, c)))),
        h("tbody", {}, shown.map((r) => h("tr", {}, r.map((c) => h("td", {}, c))))),
      ),
    );
  };
  select.addEventListener("change", render);
  search.addEventListener("input", render);
  render();

  return h(
    "section",
    { class: "view" },
    h(
      "div",
      { class: "controls" },
      h("label", { for: "ref-table" }, ctx.t.refTable, " ", select),
      h("label", { for: "ref-search" }, ctx.t.refSearch, " ", search),
    ),
    holder,
  );
}

// ------------------------------------------------------------------- about ---

export function aboutView(ctx: Ctx) {
  const base = import.meta.env.BASE_URL;
  return h(
    "section",
    { class: "view prose" },
    h("p", {}, ctx.t.aboutText),
    h(
      "ul",
      {},
      h("li", {}, h("a", { href: `${base}pdf/historia-pt.pdf` }, ctx.t.aboutPdfPt)),
      h("li", {}, h("a", { href: `${base}pdf/history-en.pdf` }, ctx.t.aboutPdfEn)),
    ),
    h("h2", {}, ctx.t.aboutSources),
    h(
      "ul",
      {},
      Object.values(sources).map((s) =>
        h("li", {}, s.url ? h("a", { href: s.url, target: "_blank", rel: "noopener" }, s.title) : s.title),
      ),
    ),
    h(
      "p",
      {},
      `${ctx.t.aboutAuthor}: `,
      h("a", { href: "https://github.com/joserodpt", target: "_blank", rel: "noopener" }, "José Rodrigues"),
    ),
  );
}
