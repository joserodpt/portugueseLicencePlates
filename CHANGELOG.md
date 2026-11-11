# Changelog

## [1.0.0] - 2026-11-11

First versioned release. Replaces the 2023 PDF and the `main.py` terminal menu.

### Added
- **History of Portuguese Licence Plates** as LaTeX, in Portuguese and English
  (`docs/`), built with Tectonic (`npm run docs`). Includes the photos from the
  2023 edition, a new chapter on legislation (DL 54/2005 and its amendments) and
  a chapter listing the validation rules.
- **Decoder web app** (`src/`): decode any plate type in the write-up, find words
  that can be read on a plate, and browse the reference tables, in PT and EN.
- **Shared data** (`data/`): rules and tables as JSON, read by both the app and
  the LaTeX annexes. Unconfirmed entries are marked `"verified": false`.
- Rules `main.py` lacked: the 2020 vowel rule, 1937 zones and reserved letter
  groups, Q/J/CU/FD before the 1980s, the 1997 K imports, diplomatic plates,
  and the 1992 switch date (01/03/1992).
- CI (tests, build, PDFs) and a GitHub Pages deploy of the app and both PDFs.

### Fixed
- 1911 hire (`-A`) and provisional (`-WW`) plates no longer crash.
- The word finder now flags plates the 2020 vowel rule forbids: 510 of the
  3,321 word plates can actually be issued.

### Removed
- `main.py`, the generated word-plate lists and the 2023 PDF.
