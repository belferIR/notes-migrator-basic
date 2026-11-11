# Notes Migrator Basic – developer notes

A bootstrapped Zotero 7+ plugin (no build step, no dependencies). Code comments are in Polish; identifiers are in English.

## Files

| File | Role |
|---|---|
| `manifest.json` | WebExtension-style manifest; `applications.zotero.id`, `update_url` (required by Zotero), version range |
| `bootstrap.js` | the whole plugin: settings, texts (PL/EN), Zotero → Markdown conversion, file writing, events, menu |
| `prefs.xhtml`, `prefs.js` | settings pane (registered with `Zotero.PreferencePanes.register`); texts filled in by `prefs.js` |
| `updates.json` | update manifest read by Zotero (version, download link, SHA-256 of the `.xpi`) |
| `build.sh` | builds `notes-migrator-basic-<version>.xpi` and writes its hash into `updates.json` |
| `test/test_basic.js` | tests on a mock Zotero with an in-memory file system: `node test/test_basic.js` |

## Data flow

1. `Zotero.Notifier` observer (`item` events: add, modify, trash, delete) → the top-level regular item of the changed
   note / annotation / attachment (`topItem`).
2. `schedule(top)` waits `NM_CONFIG.debounceMs` (5 s) so a series of edits produces one write; writes run one at a time
   (`enqueue`).
3. `writeRecord(item)` (My Library only – `libraryAllowed`):
   - folder `<vault>/Zotero/<library name>/<Surname Year – Title [KEY]>`; found by `[KEY]`, renamed when metadata change;
   - `gather` reads notes, annotations and annotated PDFs;
   - `syncPdfs` – annotated PDF copy via `Zotero.PDFWorker.export(id, path, false)` (never `transfer = true`: it would
     delete annotations from the Zotero database); skipped when the `pdfExport` pref is off – existing copies are kept;
   - `_record.md` / `_rekord.md`, one file per note, one file per colour (`colorFileName`);
   - files that disappeared since the previous state go to `_deleted/` (`_usuniete/`);
   - state `.nm-stan.json` (notes, annotations, written file names, PDF signatures) – used to detect deletions.
4. `delete` events carry only keys: deleted items → folder moved to `Zotero/_archive/`; deleted notes/annotations →
   their item is rewritten.

`htmlToMd` converts Zotero note HTML to Markdown with a small built-in parser (headings, bold/italic, lists, links,
tables, blockquotes, code). Highlights are coloured with Obsidian 1.14 syntax `==🟢 text==` where a matching Obsidian
colour exists, otherwise `<mark style="background: …">` (`NM_CONFIG.highlightMode`).

## Preferences (`extensions.notes-migrator-basic.*`)

| Key | Values |
|---|---|
| `vaultPath` | absolute path of the vault |
| `language` | `auto` (default; `pl` if `Zotero.locale` starts with `pl`, else `en`), `pl`, `en` |
| `pdfExport` | `"true"` (default) / `"false"` |
| `color.#rrggbb` | own file name for a Zotero highlight colour; empty = default name in the current language |

## Texts and languages

All user-visible texts and generated Markdown labels/YAML keys are in `NM_I18N` (`pl`, `en`); use `this.t(key, ...args)`.
To add a language, add a dictionary with the same keys and extend `lang()` and the `<select>` in `prefs.xhtml`.
Log messages are in English.

## Release

1. Raise `version` in `manifest.json`, add a `CHANGELOG.md` entry.
2. `bash build.sh` → `.xpi` + updated `updates.json`.
3. Commit `updates.json`; create a GitHub release with tag `v<version>` and attach **the same** `.xpi`
   (the hash in `updates.json` must match the uploaded file).

## Authorship

Code and documentation were written with Claude Opus 5.5 (Anthropic, `claude-opus-5-5`) under the direction of
belferIR, who specified the requirements and tested the plugin.

## Licence

GPL-3.0-or-later (see `LICENSE`).
