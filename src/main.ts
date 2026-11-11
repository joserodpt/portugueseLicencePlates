import "./style.css";
import { STRINGS } from "./i18n/strings";
import type { Lang } from "./rules/types";
import { h, storage } from "./ui/dom";
import { aboutView, decodeView, referenceView, wordsView, type Ctx } from "./ui/views";

type Tab = "decode" | "words" | "reference" | "about";
const TABS: Tab[] = ["decode", "words", "reference", "about"];

const app = document.getElementById("app")!;

let lang: Lang =
  (storage.get("lang") as Lang | null) ?? (navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en");

/** Hash routing: #decode/AB-12-CD, #words, #reference, #about. */
function readHash(): { tab: Tab; plate: string } {
  const [tab, ...rest] = decodeURIComponent(location.hash.slice(1)).split("/");
  return { tab: (TABS as string[]).includes(tab) ? (tab as Tab) : "decode", plate: rest.join("/") };
}

function render() {
  const { tab, plate } = readHash();
  const t = STRINGS[lang];
  const ctx: Ctx = { lang, t };
  document.documentElement.lang = lang === "pt" ? "pt-PT" : "en";
  document.title = t.title;

  const label: Record<Tab, string> = {
    decode: t.tabDecode,
    words: t.tabWords,
    reference: t.tabReference,
    about: t.tabAbout,
  };
  const view =
    tab === "decode"
      ? decodeView(ctx, plate, (value) => {
          history.replaceState(null, "", value.trim() ? `#decode/${encodeURIComponent(value.trim())}` : "#decode");
        })
      : tab === "words"
        ? wordsView(ctx)
        : tab === "reference"
          ? referenceView(ctx)
          : aboutView(ctx);

  app.replaceChildren(
    h(
      "header",
      { class: "top" },
      h("div", {}, h("h1", {}, t.title), h("p", { class: "muted" }, t.subtitle)),
      h(
        "button",
        {
          type: "button",
          class: "lang",
          onclick: () => {
            lang = lang === "pt" ? "en" : "pt";
            storage.set("lang", lang);
            render();
          },
        },
        t.langSwitch,
      ),
    ),
    h(
      "nav",
      { class: "tabs", role: "tablist" },
      TABS.map((id) =>
        h("a", { href: `#${id}`, role: "tab", "aria-selected": String(id === tab), class: id === tab ? "active" : "" }, label[id]),
      ),
    ),
    h("main", {}, view),
  );
}

window.addEventListener("hashchange", render);
render();
