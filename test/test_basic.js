// Testy Notes Migrator Basic na atrapie Zotero (node test/test_basic.js).
// Sprawdzają: język, nazwy kolorów z opcji, opcję kopii PDF, tylko Moja biblioteka, pełny zapis rekordu do sejfu.
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");

// ---- atrapa systemu plików (w pamięci) ----
const files = new Map(), dirs = new Set(["/sejf", "/sejf/.obsidian"]);
const IOUtils = {
  exists: async (p) => files.has(p) || dirs.has(p),
  readUTF8: async (p) => files.get(p),
  writeUTF8: async (p, c, o) => { files.set(p, o && o.mode === "appendOrCreate" ? (files.get(p) || "") + c : c); },
  makeDirectory: async (p) => { let cur = ""; for (const part of p.split("/").filter(Boolean)) dirs.add(cur += "/" + part); },
  getChildren: async (p) => [...new Set([...dirs, ...files.keys()].filter((x) => path.dirname(x) === p))],
  move: async (a, b) => {
    if (files.has(a)) { files.set(b, files.get(a)); files.delete(a); return; }
    for (const k of [...files.keys()]) if (k.startsWith(a + "/")) { files.set(b + k.slice(a.length), files.get(k)); files.delete(k); }
    for (const d of [...dirs]) if (d === a || d.startsWith(a + "/")) { dirs.delete(d); dirs.add(b + d.slice(a.length)); }
  },
  remove: async (p) => files.delete(p),
};
const PathUtils = { join: (...a) => path.join(...a), filename: (p) => path.basename(p), parent: (p) => path.dirname(p) };

// ---- atrapa Zotero ----
const prefs = {};
let exported = 0;
const ann = (key, color, text, comment = "") => ({ key, annotationType: "highlight", annotationColor: color, annotationPageLabel: "12",
  annotationSortIndex: key, annotationText: text, annotationComment: comment, annotationIsExternal: false,
  dateAdded: "2026-11-10 10:00:00", dateModified: "2026-11-10 10:00:00", getTags: () => [] });
const note = { key: "NOTE1", getNote: () => "<p>My <strong>idea</strong></p>", getTags: () => [{ tag: "method" }],
  dateAdded: "2026-11-10 10:00:00", dateModified: "2026-11-10 10:05:00" };
const pdf = { id: 3, key: "PDF1", isFileAttachment: () => true, isPDFAttachment: () => true, getField: (f) => (f === "title" ? "Full Text PDF" : ""),
  getAnnotations: () => [ann("A1", "#5fb236", "Ontological security is…", "compare lecture 3"), ann("A2", "#f19837", "Definition of a term")] };
const item = { id: 1, key: "ITEM1", libraryID: 1, itemType: "journalArticle", dateModified: "2026-11-10 10:00:00", deleted: false,
  isRegularItem: () => true, getCreatorsJSON: () => [{ creatorType: "author", lastName: "Kowalski", firstName: "Jan" }],
  getField: (f) => ({ title: "Arctic security", date: "2020", publicationTitle: "Journal" }[f] || ""),
  getTags: () => [], getNotes: () => [2], getAttachments: () => [3] };
const items = { 1: item, 2: note, 3: pdf };
const Zotero = {
  locale: "en-US",
  Prefs: { get: (k) => prefs[k], set: (k, v) => (prefs[k] = v) },
  Items: { get: (id) => items[id] },
  Libraries: { get: (id) => (id === 1 ? { libraryType: "user", name: "My Library" } : { libraryType: "group", name: "Class" }) },
  PDFWorker: { export: async (id, dest) => { exported++; files.set(dest, "%PDF"); return 2; } },
  debug: () => {},
};
const ctx = vm.createContext({ console, Zotero, IOUtils, PathUtils, Services: {}, ChromeUtils: {} });
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "bootstrap.js"), "utf8") + "\n;this.NM = NotesMigrator;", ctx);
const NM = ctx.NM;
NM.logPath = "/log.txt";

(async () => {
  // 1. Język: auto według Zotero, potem wymuszony
  assert.strictEqual(NM.lang(), "en");
  Zotero.locale = "pl-PL";
  assert.strictEqual(NM.lang(), "pl");
  prefs["extensions.notes-migrator-basic.language"] = "en";
  assert.strictEqual(NM.lang(), "en");
  assert.strictEqual(NM.t("done", 5), "Done. Items processed: 5.");

  // 2. Tylko Moja biblioteka
  assert.strictEqual(NM.libraryAllowed({ libraryType: "user" }), true);
  assert.strictEqual(NM.libraryAllowed({ libraryType: "group" }), false);

  // 3. Kolory: domyślne i własne
  assert.strictEqual(NM.colorFileName("#5FB236"), "Green highlights");
  prefs["extensions.notes-migrator-basic.color.#5fb236"] = "Agree";
  assert.strictEqual(NM.colorFileName("#5fb236"), "Agree");

  // 4. Pełny zapis rekordu (angielski)
  prefs["extensions.notes-migrator-basic.vaultPath"] = "/sejf";
  await NM.writeRecord(item);
  const dir = "/sejf/Zotero/My Library/Kowalski 2020 – Arctic security [ITEM1]";
  const ls = [...files.keys()].filter((k) => k.startsWith(dir + "/")).map((k) => path.basename(k)).sort();
  assert.ok(ls.includes("Agree.md") && ls.includes("Orange highlights.md") && ls.includes("_record.md"), ls.join(" | "));
  assert.ok(ls.some((f) => f.startsWith("Note – ")) && ls.some((f) => f.endsWith(".pdf")), ls.join(" | "));
  const agree = files.get(dir + "/Agree.md");
  assert.ok(agree.includes("## p. 12") && agree.includes("> [!note] Comment on highlight") && agree.includes("compare lecture 3"), agree);
  assert.ok(!/autor|Strona|Notatka/.test(agree), "bez polskich napisów w wersji angielskiej");
  assert.ok(files.get(dir + "/_record.md").includes("zotero_key: \"ITEM1\""));
  assert.strictEqual(exported, 1);

  // 5. Zmiana nazwy koloru: nowy plik, stary do _deleted
  prefs["extensions.notes-migrator-basic.color.#5fb236"] = "I agree";
  await NM.writeRecord(item);
  assert.ok(files.has(dir + "/I agree.md"));
  assert.ok(!files.has(dir + "/Agree.md"));
  assert.ok([...files.keys()].some((k) => k.startsWith(dir + "/_deleted/") && k.endsWith("Agree.md")));

  // 6. Kopia PDF wyłączona: brak nowego eksportu, istniejąca kopia zostaje na miejscu
  prefs["extensions.notes-migrator-basic.pdfExport"] = "false";
  pdf.getAnnotations = () => [ann("A1", "#5fb236", "Changed text"), ann("A2", "#f19837", "Definition of a term")];
  await NM.writeRecord(item);
  assert.strictEqual(exported, 1, "brak nowego eksportu PDF");
  assert.ok([...files.keys()].some((k) => k.startsWith(dir + "/Annotated PDF") && k.endsWith(".pdf")), "stara kopia zostaje");
  assert.ok(![...files.keys()].some((k) => k.includes("/_deleted/") && k.endsWith(".pdf")));

  // 7. Wersja polska: nazwy plików i nagłówki po polsku
  prefs["extensions.notes-migrator-basic.language"] = "pl";
  delete prefs["extensions.notes-migrator-basic.color.#5fb236"];
  assert.strictEqual(NM.colorFileName("#5fb236"), "Zielone zaznaczenia");
  const md = NM.renderNote({ key: "N", tags: [], added: "2026-11-10 10:00:00", modified: "2026-11-10 10:00:00", html: "<p>x</p>" }, item, "Moja biblioteka");
  assert.ok(md.includes("# Notatka") && md.includes("zotero_klucz:"), md);
  assert.strictEqual(NM.t("colorSample")["#5fb236"], "Zgadzam się");

  // 8. Brak danych prowadzącego i starego kodu grup w źródle
  const src = fs.readFileSync(path.join(__dirname, "..", "bootstrap.js"), "utf8");
  assert.ok(!/ppdamski|_historia|#autor\//.test(src));
  console.log("OK – Notes Migrator Basic");
})().catch((e) => { console.error(e); process.exit(1); });
