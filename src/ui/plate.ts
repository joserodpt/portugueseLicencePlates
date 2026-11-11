import type { PlateStyle } from "../rules/types";
import { h } from "./dom";

const EU_STARS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `<circle cx="${(10 + 6.5 * Math.sin(a)).toFixed(2)}" cy="${(10 - 6.5 * Math.cos(a)).toFixed(2)}" r="1.1"/>`;
}).join("");

function euroBand(country = "P") {
  const band = h("span", { class: "plate-euro", "aria-hidden": "true" });
  band.innerHTML = `<svg viewBox="0 0 20 20" width="20" height="20"><g fill="#ffcc00">${EU_STARS}</g></svg><b>${country}</b>`;
  return band;
}

/** Draws a plate in the look of its era (colours, eurobanda, date band). */
export function renderPlate(text: string, style: PlateStyle) {
  const hasEuro = style === "euro" || style === "euro-date" || style === "euro-2020" || style === "export";
  const dateBand =
    style === "euro-date"
      ? h("span", { class: "plate-date", "aria-hidden": "true" }, h("span", {}, "AA"), h("span", {}, "MM"))
      : style === "export"
        ? h("span", { class: "plate-date", "aria-hidden": "true" }, h("span", {}, "EXP"), h("span", {}, "AA/MM"))
        : null;
  return h(
    "div",
    { class: `plate plate-${style}`, role: "img", "aria-label": text },
    hasEuro ? euroBand() : null,
    h("span", { class: "plate-text" }, text),
    dateBand,
  );
}
