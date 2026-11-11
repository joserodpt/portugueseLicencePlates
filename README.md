<div align="center">

![Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Sistema_de_numeração_das_matrículas.svg/2560px-Sistema_de_numeração_das_matrículas.svg.png)
# Matrículas Portuguesas
## Uma viagem desde a primeira licença em 1901 até ao século XXI

**[Abrir o descodificador](https://joserodpt.github.io/portugueseLicencePlates/)** ·
**[PDF em português](https://joserodpt.github.io/portugueseLicencePlates/pdf/historia-pt.pdf)** ·
**[PDF in English](https://joserodpt.github.io/portugueseLicencePlates/pdf/history-en.pdf)**

</div>

## Português

Este repositório reúne a história das matrículas portuguesas, de 1901 até hoje, e
uma aplicação para as descodificar.

- **História das Matrículas Portuguesas**: o texto, em LaTeX, em [`docs/`](docs/).
  Compila em PDF, em português e em inglês.
- **Descodificador**: escreves uma matrícula e vês a série, a região, a época e se
  pode existir. Por exemplo, `AB 31 CE` é impossível pela regra das vogais de 2020,
  e `QA-12-34` não pode ser anterior aos anos 80. Inclui ainda uma pesquisa de
  palavras que se leem numa matrícula e tabelas de referência.
- **Dados**: as regras e as tabelas estão em [`data/`](data/). A aplicação e o PDF
  usam os mesmos ficheiros e por isso não se contradizem. As entradas sem
  confirmação estão marcadas como `"verified": false`.

## English

This repository collects the history of Portuguese licence plates, from 1901 to
today, and an app that decodes them.

- **History of Portuguese Licence Plates**: the write-up, in LaTeX, in
  [`docs/`](docs/). It compiles to PDF in Portuguese and English.
- **Decoder**: type a plate to see its series, region, period and whether it can
  exist. For example, `AB 31 CE` is impossible under the 2020 vowel rule, and
  `QA-12-34` cannot be older than the 1980s. It also finds words you can read on a
  plate and has reference tables.
- **Data**: the rules and tables live in [`data/`](data/). The app and the PDF read
  the same files, so they cannot contradict each other. Unconfirmed entries are
  marked `"verified": false`.

## Desenvolvimento / Development

Node 20+ is required. Building the PDFs also needs [Tectonic](https://tectonic-typesetting.github.io/)
(`brew install tectonic`).

```sh
npm install
npm run dev      # app at http://localhost:5173
npm test         # rules engine tests
npm run build    # static app in dist/
npm run docs     # tables from data/ + both PDFs in dist/pdf/
```

| Path | Contents |
| --- | --- |
| `data/` | Rules and tables (JSON) shared by the app and the PDF |
| `src/rules/` | Rules engine: `decode()`, `convert1911()`, `next2020()`, `findWordPlates()` |
| `src/ui/` | App UI (Vite + TypeScript, no framework) |
| `docs/` | LaTeX sources; `chapters/pt` and `chapters/en`, `figures/` |
| `scripts/` | `gen-tex-tables.mjs` (data → LaTeX tables), `build-docs.mjs` (Tectonic) |

On every push to `main`, the `pages` workflow deploys the app and both PDFs to
GitHub Pages. Pushing a `v*` tag attaches the PDFs to the release.

Autor / Author: [José Rodrigues](https://github.com/joserodpt)
