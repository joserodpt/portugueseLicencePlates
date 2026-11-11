// Compiles both write-ups with Tectonic into dist/pdf/. Run: npm run docs
// (which first regenerates the annex tables from data/).
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "docs");
const out = join(root, "dist", "pdf");
mkdirSync(out, { recursive: true });

for (const file of ["historia-pt.tex", "history-en.tex"]) {
  console.log(`tectonic ${file}`);
  execFileSync("tectonic", ["--outdir", out, file], { cwd: docs, stdio: "inherit" });
}
console.log(`PDFs written to ${out}`);
