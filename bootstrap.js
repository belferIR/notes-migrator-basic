/*
 * Notes Migrator Basic 1.0.0
 * Copyright (C) 2026 belferIR
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version. This program is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; see the GNU General Public License for more details.
 * You should have received a copy of the license (LICENSE); if not, see <https://www.gnu.org/licenses/>.
 *
 * Wtyczka CZYTA dane Zotero (Moja biblioteka) i zapisuje pliki Markdown w sejfie Obsidian.
 * Niczego nie zmienia w bibliotece Zotero. Dziennik: notes-migrator-basic.log w katalogu danych Zotero.
 * Opis budowy: DEVELOPMENT.md (EN) / DOKUMENTACJA.md (PL).
 */

// ---------------------------------------------------------------
// USTAWIENIA STAŁE (to, czego nie ma w panelu opcji)
// ---------------------------------------------------------------
const NM_CONFIG = {
  // Folder w sejfie, w którym powstają katalogi bibliotek.
  outDir: "Zotero",
  // Czas oczekiwania na koniec serii zmian (ms): seria zmian tego samego rekordu = jeden zapis.
  debounceMs: 5000,
  // Czy w dzienniku wypisywać każde zdarzenie (przydatne tylko przy diagnozie).
  verboseEvents: false,
  // Podświetlenie cytatów w kolorze zaznaczenia z Zotero (komentarz nie jest podświetlany).
  //  "native" – Obsidian 1.14 lub nowszy: ==🟢 tekst== (sześć kolorów); pozostałe kolory przez HTML,
  //  "html"   – zawsze <mark style="background: …"> (dokładny kolor, działa też w starszych wersjach),
  //  "off"    – bez podświetlania.
  highlightMode: "native",
  // Przezroczystość tła w trybie HTML (szesnastkowo: 66 = 40%).
  highlightAlpha: "66",
  // Kolory Zotero, które mają odpowiednik wśród sześciu kolorów Obsidiana.
  highlightEmoji: {
    "#ffd400": "🟡",
    "#ff6666": "🔴",
    "#5fb236": "🟢",
    "#2ea8e5": "🔵",
    "#a28ae5": "🟣",
    "#f19837": "🟠",
  },
};

// Osiem kolorów zaznaczeń Zotero (kolejność jak w czytniku PDF Zotero).
const NM_COLORS = ["#ffd400", "#ff6666", "#5fb236", "#2ea8e5", "#a28ae5", "#e56eee", "#f19837", "#aaaaaa"];

// ---------------------------------------------------------------
// TEKSTY: polski i angielski. Klucz → tekst; {0}, {1} – wstawiane wartości.
// ---------------------------------------------------------------
const NM_I18N = {
  pl: {
    name: "Notes Migrator Basic",
    menuBackfill: "Zapisz bibliotekę do sejfu…",
    menuChoose: "Wybierz sejf Obsidian…",
    pickerTitle: "Notes Migrator Basic: wybierz folder sejfu Obsidian",
    outDirChosen: "Wybrano folder „{0}”, który wtyczka tworzy sama. Pliki trafiłyby do „{0}/{0}”.\n\nUżyć folderu wyżej (zalecane)?\n{1}\n\nOK = folder wyżej, Anuluj = zostaw wybrany",
    notVault: "Nie znaleziono katalogu .obsidian w tym folderze ani wyżej, więc może to nie być sejf Obsidian:\n{0}\n\nUżyć go mimo to?",
    pickError: "Nie udało się wybrać folderu: {0}",
    chooseFirst: "Najpierw wybierz sejf Obsidian, do którego wtyczka ma zapisywać pliki.\n(Do wyboru w następnym oknie; później zmienisz go w opcjach wtyczki.)",
    confirmBackfill: "Zapisać {0} rekordów z Mojej biblioteki?\n\nWtyczka tylko czyta Zotero.\nPliki powstaną w:\n{1}",
    done: "Zakończono. Przetworzono rekordów: {0}.",
    generatedRecord: "Plik generowany automatycznie przez Notes Migrator Basic. Nie edytuj go – zmiany zostaną nadpisane. Własne notatki zapisuj w osobnym pliku, np. `Moje.md`.",
    generated: "Plik generowany automatycznie przez Notes Migrator Basic. Nie edytuj go.",
    creators: "Twórcy", date: "Data", publication: "Publikacja", publisher: "Wydawca", doi: "DOI", url: "Adres",
    pdfLink: "PDF z adnotacjami", added: "Dodano", modified: "Zmodyfikowano", tags: "Tagi", none: "(brak)",
    note: "Notatka", emptyNote: "(pusta notatka)", empty: "(puste)", page: "Strona", file: "Plik", pageShort: "s.",
    comment: "Komentarz do zaznaczenia", noText: "(bez tekstu)",
    kindImage: "(zaznaczenie obrazu)", kindInk: "(rysunek)", kindNote: "(notatka na stronie)", kindText: "(tekst na stronie)",
    noAuthor: "Brak autora", noDate: "b.d.", untitled: "bez nazwy", pdfFile: "PDF z adnotacjami", fileDefault: "plik",
    recordFile: "_rekord.md", deletedDir: "_usuniete", archiveDir: "_archiwum",
    yKey: "zotero_klucz", yItem: "zotero_rekord", yLib: "zotero_biblioteka", yType: "typ", yModZ: "zmodyfikowano_w_zotero",
    yTags: "tagi_zotero", yAdded: "dodano", yMod: "zmodyfikowano", yColor: "kolor", yCount: "liczba",
    tNote: "notatka", tHl: "zaznaczenia",
    colors: { "#ffd400": "Żółte zaznaczenia", "#ff6666": "Czerwone zaznaczenia", "#5fb236": "Zielone zaznaczenia",
      "#2ea8e5": "Niebieskie zaznaczenia", "#a28ae5": "Fioletowe zaznaczenia", "#e56eee": "Purpurowe zaznaczenia",
      "#f19837": "Pomarańczowe zaznaczenia", "#aaaaaa": "Szare zaznaczenia" },
    colorSample: { "#ffd400": "Interesująca uwaga autora", "#ff6666": "Nie zgadzam się", "#5fb236": "Zgadzam się",
      "#2ea8e5": "Zobacz innego autora", "#a28ae5": "Fioletowe zaznaczenia", "#e56eee": "O co tutaj chodzi",
      "#f19837": "Definicje", "#aaaaaa": "Szare zaznaczenia" },
    colorOther: "Kolor {0} – zaznaczenia",
    paneIntro: "Zapisuje notatki i zaznaczenia z Mojej biblioteki Zotero do sejfu Obsidian. Wtyczka tylko czyta Zotero.",
    paneVault: "Sejf Obsidian", paneChoose: "Wybierz folder…", paneNone: "(nie wybrano)",
    paneLang: "Język plików i menu", langAuto: "jak Zotero", langPl: "polski", langEn: "angielski",
    paneLangHint: "Wybierz przed pierwszym zapisem – zmiana języka zmienia nazwy plików i folderów.",
    panePdf: "Zapisuj w sejfie kopię PDF z zaznaczeniami",
    panePdfHint: "Po wyłączeniu nowe kopie nie powstają; istniejące zostają na miejscu.",
    paneColors: "Kolory zaznaczeń → nazwy plików w sejfie",
    paneColorsHint: "Puste pole = nazwa domyślna. Nowe nazwy obowiązują przy następnym zapisie; pliki ze starą nazwą trafią do folderu _usuniete.",
    paneSample: "Wstaw przykładowy zestaw", paneReset: "Przywróć nazwy domyślne",
    paneRefresh: "Aby od razu odświeżyć wszystkie pliki: Narzędzia → Notes Migrator Basic → Zapisz bibliotekę do sejfu…",
    colorNames: { "#ffd400": "żółty", "#ff6666": "czerwony", "#5fb236": "zielony", "#2ea8e5": "niebieski",
      "#a28ae5": "fioletowy", "#e56eee": "purpurowy", "#f19837": "pomarańczowy", "#aaaaaa": "szary" },
  },
  en: {
    name: "Notes Migrator Basic",
    menuBackfill: "Export library to vault…",
    menuChoose: "Choose Obsidian vault…",
    pickerTitle: "Notes Migrator Basic: choose your Obsidian vault folder",
    outDirChosen: "You chose the folder “{0}”, which the plugin creates itself. Files would end up in “{0}/{0}”.\n\nUse the parent folder instead (recommended)?\n{1}\n\nOK = parent folder, Cancel = keep my choice",
    notVault: "No .obsidian folder was found in this folder or above it, so it may not be an Obsidian vault:\n{0}\n\nUse it anyway?",
    pickError: "Could not choose the folder: {0}",
    chooseFirst: "First choose the Obsidian vault the plugin should write to.\n(You can choose it in the next window and change it later in the plugin settings.)",
    confirmBackfill: "Export {0} items from My Library?\n\nThe plugin only reads Zotero.\nFiles will be created in:\n{1}",
    done: "Done. Items processed: {0}.",
    generatedRecord: "This file is generated by Notes Migrator Basic. Do not edit it – changes will be overwritten. Keep your own notes in a separate file, e.g. `My notes.md`.",
    generated: "This file is generated by Notes Migrator Basic. Do not edit it.",
    creators: "Creators", date: "Date", publication: "Publication", publisher: "Publisher", doi: "DOI", url: "URL",
    pdfLink: "Annotated PDF", added: "Added", modified: "Modified", tags: "Tags", none: "(none)",
    note: "Note", emptyNote: "(empty note)", empty: "(empty)", page: "Page", file: "File", pageShort: "p.",
    comment: "Comment on highlight", noText: "(no text)",
    kindImage: "(image selection)", kindInk: "(drawing)", kindNote: "(note on page)", kindText: "(text on page)",
    noAuthor: "No author", noDate: "n.d.", untitled: "untitled", pdfFile: "Annotated PDF", fileDefault: "file",
    recordFile: "_record.md", deletedDir: "_deleted", archiveDir: "_archive",
    yKey: "zotero_key", yItem: "zotero_item", yLib: "zotero_library", yType: "type", yModZ: "modified_in_zotero",
    yTags: "zotero_tags", yAdded: "added", yMod: "modified", yColor: "color", yCount: "count",
    tNote: "note", tHl: "highlights",
    colors: { "#ffd400": "Yellow highlights", "#ff6666": "Red highlights", "#5fb236": "Green highlights",
      "#2ea8e5": "Blue highlights", "#a28ae5": "Purple highlights", "#e56eee": "Magenta highlights",
      "#f19837": "Orange highlights", "#aaaaaa": "Gray highlights" },
    colorSample: { "#ffd400": "Interesting point", "#ff6666": "Disagree", "#5fb236": "Agree",
      "#2ea8e5": "See another author", "#a28ae5": "Purple highlights", "#e56eee": "What does this mean",
      "#f19837": "Definitions", "#aaaaaa": "Gray highlights" },
    colorOther: "Color {0} – highlights",
    paneIntro: "Exports notes and highlights from your Zotero My Library to an Obsidian vault. The plugin only reads Zotero.",
    paneVault: "Obsidian vault", paneChoose: "Choose folder…", paneNone: "(not chosen)",
    paneLang: "Language of files and menus", langAuto: "same as Zotero", langPl: "Polish", langEn: "English",
    paneLangHint: "Choose before the first export – changing the language changes file and folder names.",
    panePdf: "Save a copy of the PDF with highlights in the vault",
    panePdfHint: "When off, no new copies are made; existing copies stay where they are.",
    paneColors: "Highlight colours → file names in the vault",
    paneColorsHint: "Empty field = default name. New names apply at the next export; files with the old name go to the _deleted folder.",
    paneSample: "Insert sample set", paneReset: "Restore default names",
    paneRefresh: "To refresh all files now: Tools → Notes Migrator Basic → Export library to vault…",
    colorNames: { "#ffd400": "yellow", "#ff6666": "red", "#5fb236": "green", "#2ea8e5": "blue",
      "#a28ae5": "purple", "#e56eee": "magenta", "#f19837": "orange", "#aaaaaa": "gray" },
  },
};

var NotesMigrator = {
  id: null,
  version: null,
  observerID: null,
  logPath: null,
  pending: new Map(), // "bibliotekaID/klucz" -> { dirty }
  chain: null, // kolejka zapisów: jeden zapis naraz
  windows: new Set(),

  // ================= Wybór sejfu =================

  PREF: "extensions.notes-migrator-basic.",
  get PREF_VAULT() {
    return this.PREF + "vaultPath";
  },

  pref(name, def) {
    try {
      const v = Zotero.Prefs.get(this.PREF + name, true);
      return v === undefined || v === null || v === "" ? def : v;
    } catch (e) {
      return def;
    }
  },

  setPref(name, value) {
    Zotero.Prefs.set(this.PREF + name, value, true);
  },

  // Język: ustawienie „auto” = język Zotero (polski → pl, każdy inny → en).
  lang() {
    const p = String(this.pref("language", "auto"));
    if (p === "pl" || p === "en") return p;
    const loc = String((Zotero.locale || "en")).toLowerCase();
    return loc.startsWith("pl") ? "pl" : "en";
  },

  // Tekst w bieżącym języku; {0}, {1}… zastąpione kolejnymi argumentami.
  t(key, ...args) {
    const d = NM_I18N[this.lang()] || NM_I18N.en;
    let s = d[key] !== undefined ? d[key] : NM_I18N.en[key];
    if (typeof s !== "string") return s;
    args.forEach((a, i) => (s = s.split(`{${i}}`).join(String(a))));
    return s;
  },

  // Kopia PDF z wtopionymi adnotacjami w sejfie (opcja; domyślnie włączona).
  pdfEnabled() {
    return String(this.pref("pdfExport", "true")) !== "false";
  },

  vault() {
    try {
      return String(Zotero.Prefs.get(this.PREF_VAULT, true) || "").trim();
    } catch (e) {
      return "";
    }
  },

  async vaultOk() {
    const v = this.vault();
    return !!v && (await IOUtils.exists(v));
  },

  // Okno wyboru folderu. Zwraca true, gdy zapisano nowy wybór.
  async chooseVault(window) {
    try {
      const { FilePicker } = ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs");
      const fp = new FilePicker();
      fp.init(window, this.t("pickerTitle"), fp.modeGetFolder);
      const cur = this.vault();
      if (cur && (await IOUtils.exists(cur))) fp.displayDirectory = cur;
      const rv = await fp.show();
      if (rv !== fp.returnOK) return false;
      let dir = fp.file;
      if (!dir) return false;
      // Folder o nazwie takiej jak folder wyjściowy (Zotero): to prawie na pewno błąd, bo wtyczka sama go tworzy.
      if (PathUtils.filename(dir) === NM_CONFIG.outDir) {
        const parent = PathUtils.parent(dir);
        if (parent && parent !== dir) {
          const useParent = Services.prompt.confirm(
            window,
            this.t("name"),
            this.t("outDirChosen", NM_CONFIG.outDir, parent)
          );
          if (useParent) dir = parent;
        }
      }
      // Folder musi leżeć w sejfie Obsidian: .obsidian w nim samym lub w którymś folderze wyżej (do 6 poziomów).
      let inVault = false;
      for (let up = dir, i = 0; i <= 6 && up; i++) {
        if (await IOUtils.exists(PathUtils.join(up, ".obsidian"))) {
          inVault = true;
          break;
        }
        const parent = PathUtils.parent(up);
        if (!parent || parent === up) break;
        up = parent;
      }
      if (!inVault) {
        const ok = Services.prompt.confirm(
          window,
          this.t("name"),
          this.t("notVault", dir)
        );
        if (!ok) return false;
      }
      Zotero.Prefs.set(this.PREF_VAULT, dir, true);
      await this.log(`Vault chosen: ${dir}`);
      try {
        window.document.getElementById("nmb-vault-path").value = dir;
      } catch (e) {}
      return true;
    } catch (e) {
      await this.log(`ERROR choosing vault: ${e}`);
      Services.prompt.alert(window, this.t("name"), this.t("pickError", e));
      return false;
    }
  },

  // Gwarantuje wybrany, istniejący sejf (przy pierwszej migracji pyta o folder).
  async ensureVault(window) {
    if (await this.vaultOk()) return true;
    Services.prompt.alert(
      window,
      this.t("name"),
      this.t("chooseFirst")
    );
    if (!(await this.chooseVault(window))) return false;
    return this.vaultOk();
  },

  async log(msg) {
    const line = `${new Date().toISOString()}  ${msg}\n`;
    Zotero.debug(`[Notes Migrator Basic] ${msg}`);
    try {
      await IOUtils.writeUTF8(this.logPath, line, { mode: "appendOrCreate" });
    } catch (e) {
      Zotero.debug(`[Notes Migrator Basic] log write error: ${e}`);
    }
  },

  enqueue(fn) {
    this.chain = (this.chain || Promise.resolve())
      .then(fn)
      .catch((e) => this.log(`ERROR in write queue: ${e}`));
    return this.chain;
  },

  // ================= Narzędzia tekstowe =================

  safeField(item, name) {
    try {
      return item.getField(name) || "";
    } catch (e) {
      return "";
    }
  },

  // Nazwa bezpieczna dla systemu plików.
  sanitize(name, maxLen) {
    let s = String(name)
      .replace(/[\\\/:*?"<>|\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (maxLen && s.length > maxLen) s = s.slice(0, maxLen).trim();
    return s || this.t("untitled");
  },

  // Tag w postaci akceptowanej przez Obsidiana (bez spacji i znaków specjalnych).
  sanitizeTag(t) {
    return String(t)
      .trim()
      .replace(/[^\p{L}\p{N}_\-\/]+/gu, "_")
      .replace(/^_+|_+$/g, "");
  },

  hashTags(tags) {
    const out = tags.map((t) => this.sanitizeTag(t)).filter(Boolean).map((t) => "#" + t);
    return out.join(" ");
  },

  yamlStr(s) {
    return JSON.stringify(String(s));
  },

  yamlList(key, arr) {
    return arr.length ? [`${key}:`, ...arr.map((x) => `  - ${this.yamlStr(x)}`)] : [`${key}: []`];
  },

  // Data Zotero (UTC, "RRRR-MM-DD GG:MM:SS") na czas lokalny "RRRR-MM-DD GG:MM".
  fmtLocal(zdate) {
    if (!zdate) return "";
    const d = new Date(String(zdate).replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return String(zdate);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  },

  fmtLocalFile(zdate) {
    return this.fmtLocal(zdate).replace(":", "-");
  },

  quote(text, max = 2000) {
    let t = String(text || "").trim();
    if (!t) return "> " + this.t("empty");
    if (t.length > max) t = t.slice(0, max) + " […]";
    return t.split("\n").map((l) => "> " + l).join("\n");
  },

  // Podświetla cytat w kolorze zaznaczenia (każda linia osobno, bo podświetlenie nie przechodzi przez akapity).
  highlight(text, color) {
    const hex = String(color || "").toLowerCase();
    const mode = NM_CONFIG.highlightMode;
    if (mode === "off" || !/^#[0-9a-f]{6}$/.test(hex)) return text;
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const emoji = NM_CONFIG.highlightEmoji[hex];
    const wrap =
      mode === "native" && emoji
        ? (s) => `==${emoji} ${s.replace(/</g, "\\<")}==`
        : (s) => `<mark style="background: ${hex}${NM_CONFIG.highlightAlpha};">${esc(s)}</mark>`;
    return String(text)
      .split("\n")
      .map((l) => (l.trim() ? wrap(l.trim()) : l))
      .join("\n");
  },

  // Cytat z zaznaczenia: obcięcie, podświetlenie, blok cytatu.
  quoteHl(text, color, max = 2000) {
    let t = String(text || "").trim();
    if (!t) return "> " + this.t("empty");
    if (t.length > max) t = t.slice(0, max) + " […]";
    return this.quote(this.highlight(t, color), 1e9);
  },

  // ================= Notatka Zotero (HTML) -> Markdown =================

  decodeEntities(s) {
    return String(s)
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&#x27;/g, "'")
      .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
      .replace(/&amp;/g, "&");
  },

  parseAttrs(str) {
    const attrs = {};
    const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let m;
    while ((m = re.exec(str))) attrs[m[1].toLowerCase()] = this.decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
    return attrs;
  },

  // Prosty parser HTML -> drzewo (bez zależności od przeglądarki).
  parseHtml(html) {
    const root = { tag: "#root", attrs: {}, children: [] };
    const stack = [root];
    const VOID = new Set(["br", "img", "hr", "meta", "input"]);
    const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][a-zA-Z0-9]*)\s*>|<([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|[^<]+|</g;
    let m;
    while ((m = re.exec(html))) {
      const s = m[0];
      if (s.startsWith("<!--")) continue;
      if (m[1]) {
        const tag = m[1].toLowerCase();
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === tag) {
            stack.length = i;
            break;
          }
        }
      } else if (m[2]) {
        const tag = m[2].toLowerCase();
        const node = { tag, attrs: this.parseAttrs(m[3] || ""), children: [] };
        stack[stack.length - 1].children.push(node);
        if (!VOID.has(tag) && !/\/\s*$/.test(m[3] || "")) stack.push(node);
      } else {
        stack[stack.length - 1].children.push({ text: this.decodeEntities(s) });
      }
    }
    return root;
  },

  // Znaczniki Markdown wokół tekstu; spacje zostają na zewnątrz (inaczej Obsidian nie pogrubi).
  mdWrap(text, mark) {
    const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m[2]) return text;
    return m[1] + mark + m[2] + mark + m[3];
  },

  mdInline(nodes, pre) {
    let out = "";
    for (const n of nodes) {
      if (n.text !== undefined) {
        out += pre ? n.text : n.text.replace(/[ \t\r\n]+/g, " ").replace(/</g, "\\<");
        continue;
      }
      const inner = () => this.mdInline(n.children, pre);
      switch (n.tag) {
        case "strong":
        case "b":
          out += this.mdWrap(inner(), "**");
          break;
        case "em":
        case "i":
          out += this.mdWrap(inner(), "*");
          break;
        case "s":
        case "strike":
        case "del":
          out += this.mdWrap(inner(), "~~");
          break;
        case "u":
          {
            const s = inner();
            out += s.trim() ? `<u>${s}</u>` : s;
          }
          break;
        case "code":
          out += this.mdWrap(inner(), "`");
          break;
        case "sub":
        case "sup":
          out += `<${n.tag}>${inner()}</${n.tag}>`;
          break;
        case "br":
          out += "  \n";
          break;
        case "img":
          out += "*(obraz w notatce Zotero)*";
          break;
        case "a": {
          const href = (n.attrs.href || "").trim();
          const text = inner().trim() || href;
          if (!href) out += text;
          else out += `[${text}](${href.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29")})`;
          break;
        }
        case "span": {
          const cls = n.attrs.class || "";
          out += /\bhighlight\b/.test(cls) ? this.mdWrap(inner(), "==") : inner();
          break;
        }
        default:
          out += inner();
      }
    }
    return out;
  },

  mdList(n) {
    const ordered = n.tag === "ol";
    let num = parseInt(n.attrs.start, 10);
    if (isNaN(num)) num = 1;
    const items = [];
    for (const li of n.children) {
      if (li.tag !== "li") continue;
      const marker = ordered ? `${num++}. ` : "- ";
      const pad = " ".repeat(marker.length);
      let text = "";
      this.mdBlocks(li.children).forEach((b, i) => {
        if (i === 0) text = b;
        else text += (/^\s*(?:[-*]|\d+\.) /.test(b) ? "\n" : "\n\n") + b;
      });
      items.push(
        marker + text.split("\n").map((l, i) => (i === 0 || !l ? l : pad + l)).join("\n")
      );
    }
    return items.join("\n");
  },

  mdTable(n) {
    const rows = [];
    const collect = (node) => {
      for (const c of node.children || []) {
        if (c.tag === "tr") {
          rows.push(
            c.children
              .filter((x) => x.tag === "td" || x.tag === "th")
              .map((x) => this.mdInline(x.children).trim().replace(/\n/g, "<br>").replace(/\|/g, "\\|"))
          );
        } else if (["thead", "tbody", "tfoot"].includes(c.tag)) collect(c);
      }
    };
    collect(n);
    if (!rows.length) return "";
    const cols = Math.max(...rows.map((r) => r.length));
    const fmt = (r) => "| " + Array.from({ length: cols }, (_, i) => r[i] || "").join(" | ") + " |";
    return [fmt(rows[0]), "|" + " --- |".repeat(cols), ...rows.slice(1).map(fmt)].join("\n");
  },

  // Bloki (akapity, nagłówki, listy…) -> tablica bloków Markdown.
  mdBlocks(nodes) {
    const BLOCK = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "pre", "hr", "table", "div", "li"]);
    const out = [];
    let buf = [];
    const flush = () => {
      if (!buf.length) return;
      const t = this.mdInline(buf).trim();
      buf = [];
      if (t) out.push(t);
    };
    for (const n of nodes) {
      if (n.text !== undefined || !BLOCK.has(n.tag)) {
        buf.push(n);
        continue;
      }
      flush();
      if (n.tag === "div" || n.tag === "li") out.push(...this.mdBlocks(n.children));
      else if (n.tag === "p") {
        // Pusty akapit (Enter w Zotero) -> <br>, żeby Obsidian pokazał pustą linię
        const t = this.mdInline(n.children).replace(/^[ \t\n]+|[ \t\n]+$/g, "");
        out.push(t || "<br>");
      } else if (/^h[1-6]$/.test(n.tag)) {
        out.push("#".repeat(+n.tag[1]) + " " + this.mdInline(n.children).trim());
      } else if (n.tag === "blockquote") {
        const inner = this.mdBlocks(n.children).join("\n\n");
        out.push(inner.split("\n").map((l) => (l ? "> " + l : ">")).join("\n"));
      } else if (n.tag === "ul" || n.tag === "ol") out.push(this.mdList(n));
      else if (n.tag === "pre") out.push("```\n" + this.mdInline(n.children, true).replace(/\n+$/, "") + "\n```");
      else if (n.tag === "hr") out.push("---");
      else if (n.tag === "table") {
        const tb = this.mdTable(n);
        if (tb) out.push(tb);
      }
    }
    flush();
    return out;
  },

  htmlToMd(html) {
    const blocks = this.mdBlocks(this.parseHtml(String(html || "")).children);
    while (blocks.length && blocks[0] === "<br>") blocks.shift();
    while (blocks.length && blocks[blocks.length - 1] === "<br>") blocks.pop();
    return blocks.join("\n\n").trim();
  },

  // Nazwa pliku zaznaczeń dla koloru: własna z opcji wtyczki albo domyślna w bieżącym języku.
  colorFileName(hex) {
    const h = String(hex || "").toLowerCase();
    const own = String(this.pref("color." + h, "")).trim();
    if (own) return own;
    return this.t("colors")[h] || this.t("colorOther", h || "?");
  },

  // ================= Zotero: rekord, biblioteka =================

  // Rekord bibliograficzny, do którego należy element (adnotacja -> załącznik -> rekord).
  topItem(item) {
    let cur = item;
    for (let i = 0; i < 4 && cur; i++) {
      if (cur.isRegularItem()) return cur;
      if (!cur.parentItemID) return null;
      cur = Zotero.Items.get(cur.parentItemID);
    }
    return null;
  },

  libraryAllowed(lib) {
    if (!lib) return false;
    return lib.libraryType === "user"; // tylko Moja biblioteka (biblioteki grupowe są pomijane)
  },

  authorSurname(item) {
    const creators = item.getCreatorsJSON();
    const c = creators.find((x) => x.creatorType === "author") || creators[0];
    if (!c) return this.t("noAuthor");
    return c.lastName || c.name || this.t("noAuthor");
  },

  folderName(item) {
    const surname = this.authorSurname(item);
    const year = (this.safeField(item, "date").match(/\d{4}/) || [this.t("noDate")])[0];
    const title = this.sanitize(this.safeField(item, "title"), 60);
    return this.sanitize(`${surname} ${year} – ${title}`, 110) + ` [${item.key}]`;
  },

  // ================= Stan rekordu (notatki, zaznaczenia) =================

  gather(top) {
    const notes = {};
    const anns = {};
    const pdfs = {};
    for (const nid of top.getNotes()) {
      const n = Zotero.Items.get(nid);
      if (!n) continue;
      notes[n.key] = {
        key: n.key,
        html: n.getNote(),
        tags: n.getTags().map((t) => t.tag),
        added: n.dateAdded,
        modified: n.dateModified,
      };
    }
    for (const aid of top.getAttachments()) {
      const att = Zotero.Items.get(aid);
      if (!att) continue;
      let list = [];
      try {
        list = att.isFileAttachment() ? att.getAnnotations() : [];
      } catch (e) {
        list = [];
        if (!this._annWarned) {
          this._annWarned = true;
          this.log(`WARNING: cannot read annotations of attachment ${att.key}: ${e}`);
        }
      }
      // PDF-y z adnotacjami zapisanymi w bazie Zotero (do kopii z wtopionymi adnotacjami).
      try {
        const own = list.filter((x) => !x.annotationIsExternal);
        if (own.length && att.isPDFAttachment && att.isPDFAttachment()) {
          const raw = own
            .map((x) => `${x.key}|${x.dateModified}|${x.annotationColor}|${x.annotationComment}`)
            .sort()
            .join("\n");
          let h = 5381;
          for (let i = 0; i < raw.length; i++) h = ((h * 33) ^ raw.charCodeAt(i)) >>> 0;
          pdfs[att.key] = { id: att.id, title: this.safeField(att, "title"), sig: `${own.length}:${h}` };
        }
      } catch (e) {}
      for (const an of list) {
        anns[an.key] = {
          key: an.key,
          att: att.key,
          attTitle: this.safeField(att, "title"),
          type: an.annotationType,
          color: String(an.annotationColor || "").toLowerCase(),
          page: an.annotationPageLabel || "",
          sort: an.annotationSortIndex || "",
          text: an.annotationText || "",
          comment: an.annotationComment || "",
          tags: an.getTags().map((t) => t.tag),
          added: an.dateAdded,
          modified: an.dateModified,
        };
      }
    }
    return { notes, anns, pdfs };
  },

  // ================= Renderowanie plików =================

  renderRecord(item, libName, pdfNames = []) {
    const tags = item.getTags().map((t) => t.tag).sort((a, b) => a.localeCompare(b));
    const creators = item.getCreatorsJSON().map((c) => {
      const name = c.lastName ? c.lastName + (c.firstName ? ", " + c.firstName : "") : c.name || "";
      return `${name} (${c.creatorType})`;
    });
    const lines = [
      "---",
      `${this.t("yKey")}: ${this.yamlStr(item.key)}`,
      `${this.t("yLib")}: ${this.yamlStr(libName)}`,
      `${this.t("yType")}: ${this.yamlStr(item.itemType)}`,
      `${this.t("yModZ")}: ${this.yamlStr(item.dateModified)}`,
      ...this.yamlList(this.t("yTags"), tags),
      "---",
      `# ${this.safeField(item, "title")}`,
      "",
      "> " + this.t("generatedRecord"),
      "",
    ];
    const add = (label, value) => {
      if (value) lines.push(`**${label}:** ${value}  `);
    };
    add(this.t("creators"), creators.join("; "));
    add(this.t("date"), this.safeField(item, "date"));
    add(this.t("publication"), this.safeField(item, "publicationTitle"));
    add(this.t("publisher"), this.safeField(item, "publisher"));
    add(this.t("doi"), this.safeField(item, "DOI"));
    add(this.t("url"), this.safeField(item, "url"));
    for (const n of pdfNames) lines.push(`**${this.t("pdfLink")}:** [[${n}]]  `);
    lines.push("");
    return lines.join("\n");
  },

  noteFileName(n) {
    return this.sanitize(`${this.t("note")} – ${this.fmtLocalFile(n.added)} [${n.key}]`, 120) + ".md";
  },

  renderNote(n, top, libName) {
    const clean = n.tags.map((t) => this.sanitizeTag(t)).filter(Boolean);
    const lines = [
      "---",
      `${this.t("yKey")}: ${this.yamlStr(n.key)}`,
      `${this.t("yItem")}: ${this.yamlStr(top.key)}`,
      `${this.t("yLib")}: ${this.yamlStr(libName)}`,
      `${this.t("yType")}: ${this.yamlStr(this.t("tNote"))}`,
      `${this.t("yAdded")}: ${this.yamlStr(this.fmtLocal(n.added))}`,
      `${this.t("yMod")}: ${this.yamlStr(this.fmtLocal(n.modified))}`,
      ...this.yamlList("tags", clean),
      "---",
      `# ${this.t("note")}`,
      "",
      `**${this.t("added")}:** ${this.fmtLocal(n.added)} · **${this.t("modified")}:** ${this.fmtLocal(n.modified)}  `,
      `**${this.t("tags")}:** ${this.hashTags(n.tags) || this.t("none")}  `,
      "",
      this.htmlToMd(n.html) || this.t("emptyNote"),
      "",
    ];
    return lines.join("\n");
  },

  renderColorFile(fileName, list, top, libName) {
    list.sort((a, b) => (a.att + "|" + a.sort).localeCompare(b.att + "|" + b.sort));
    const title = fileName.replace(/\.md$/, "");
    const lines = [
      "---",
      `${this.t("yItem")}: ${this.yamlStr(top.key)}`,
      `${this.t("yLib")}: ${this.yamlStr(libName)}`,
      `${this.t("yType")}: ${this.yamlStr(this.t("tHl"))}`,
      `${this.t("yColor")}: ${this.yamlStr(list[0].color)}`,
      `${this.t("yCount")}: ${list.length}`,
      "---",
      `# ${title}`,
      "",
      "> " + this.t("generated"),
      "",
    ];
    const kindLabel = { image: this.t("kindImage"), ink: this.t("kindInk"), note: this.t("kindNote"), text: this.t("kindText") };
    for (const a of list) {
      lines.push(`## ${this.t("pageShort")} ${a.page || "?"}`, "");
      lines.push(a.text ? this.quoteHl(a.text, a.color, 5000) : this.quote(kindLabel[a.type] || this.t("noText")), "");
      if (a.comment.trim()) {
        lines.push(`> [!note] ${this.t("comment")}`);
        for (const l of a.comment.trim().split("\n")) lines.push("> " + l);
        lines.push("");
      }
      lines.push(`**${this.t("page")}:** ${a.page || "?"} · **${this.t("file")}:** ${a.attTitle || a.att}  `);
      lines.push(`**${this.t("tags")}:** ${this.hashTags(a.tags) || this.t("none")}  `);
      lines.push(`**${this.t("modified")}:** ${this.fmtLocal(a.modified)}  `);
      lines.push("");
    }
    return lines.join("\n");
  },

  // ================= Zapis rekordu =================

  async writeIfChanged(path, content) {
    let old = null;
    if (await IOUtils.exists(path)) {
      try {
        old = await IOUtils.readUTF8(path);
      } catch (e) {
        old = null;
      }
    }
    if (old === content) return false;
    await IOUtils.writeUTF8(path, content);
    return true;
  },

  // Czas lokalny do nazw plików: RRRR-MM-DD GG-MM-SS.
  stampFile() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  },

  pdfFileName(title, key) {
    return this.sanitize(`${this.t("pdfFile")} – ${title || this.t("fileDefault")} [${key}]`, 120) + ".pdf";
  },

  // Kopia PDF z adnotacjami: tylko gdy zmieniły się adnotacje (podpis) lub brakuje pliku.
  async syncPdfs(recDir, cur, prev, changed) {
    const out = {};
    // Opcja wyłączona: nowe kopie nie powstają, istniejące zostają na miejscu (nie trafiają do kosza).
    if (!this.pdfEnabled()) return Object.assign(out, (prev && prev.pdfFiles) || {});
    if (!Zotero.PDFWorker || typeof Zotero.PDFWorker.export !== "function") {
      if (!this._warnedPdf) {
        this._warnedPdf = true;
        await this.log("WARNING: Zotero.PDFWorker.export not available; annotated PDF copies skipped");
      }
      return out;
    }
    for (const [ak, p] of Object.entries(cur.pdfs)) {
      const fname = this.pdfFileName(p.title, ak);
      const dest = PathUtils.join(recDir, fname);
      const old = prev && prev.pdfFiles && prev.pdfFiles[ak];
      if (old && old.sig === p.sig && old.file === fname && (await IOUtils.exists(dest))) {
        out[ak] = old;
        continue;
      }
      const tmp = PathUtils.join(recDir, `.nm-tmp-${ak}.pdf`);
      try {
        const n = await Zotero.PDFWorker.export(p.id, tmp, false); // transfer NIE (kasowałby adnotacje)
        if (n > 0 && (await IOUtils.exists(tmp))) {
          await IOUtils.move(tmp, dest);
          out[ak] = { file: fname, sig: p.sig };
          changed.push(fname);
        } else {
          if (await IOUtils.exists(tmp)) await IOUtils.remove(tmp);
          await this.log(`PDF without file or annotations, skipped [${ak}] (${n})`);
        }
      } catch (e) {
        try {
          if (await IOUtils.exists(tmp)) await IOUtils.remove(tmp);
        } catch (e2) {}
        await this.log(`ERROR exporting PDF [${ak}]: ${e}`);
        if (old && (await IOUtils.exists(dest))) out[ak] = old; // zostaje poprzednia kopia
      }
    }
    return out;
  },

  async moveToRemoved(recDir, fileName) {
    const src = PathUtils.join(recDir, fileName);
    if (!(await IOUtils.exists(src))) return;
    const dir = PathUtils.join(recDir, this.t("deletedDir"));
    await IOUtils.makeDirectory(dir, { createAncestors: true });
    await IOUtils.move(src, PathUtils.join(dir, `${this.stampFile()} ${fileName}`));
  },

  async writeRecord(item) {
    const lib = Zotero.Libraries.get(item.libraryID);
    if (!this.libraryAllowed(lib)) return;
    const libName = lib.name;

    if (!(await this.vaultOk())) {
      if (!this._warnedVault) {
        this._warnedVault = true;
        await this.log(`WARNING: no vault chosen or folder missing (${this.vault() || "none"}). Choose the vault in the plugin settings.`);
      }
      return;
    }
    const libDir = PathUtils.join(this.vault(), NM_CONFIG.outDir, this.sanitize(libName, 100));
    await IOUtils.makeDirectory(libDir, { createAncestors: true });

    // Katalog rekordu: szukamy po kluczu (tytuł mógł się zmienić).
    const wanted = this.folderName(item);
    let recDir = PathUtils.join(libDir, wanted);
    const children = await IOUtils.getChildren(libDir);
    const existing = children.find((p) => PathUtils.filename(p).endsWith(`[${item.key}]`));
    if (existing && PathUtils.filename(existing) !== wanted) {
      await IOUtils.move(existing, recDir);
      await this.log(`RENAME: ${PathUtils.filename(existing)} -> ${wanted}`);
    } else if (existing) {
      recDir = existing;
    }
    await IOUtils.makeDirectory(recDir, { createAncestors: true });

    const changed = [];
    const cur = this.gather(item);

    // Poprzedni stan (do wykrycia zmian i usuniętych plików).
    const statePath = PathUtils.join(recDir, ".nm-stan.json");
    let prev = null;
    if (await IOUtils.exists(statePath)) {
      try {
        prev = JSON.parse(await IOUtils.readUTF8(statePath));
      } catch (e) {
        prev = null;
      }
    }

    // 0. Kopie PDF z wtopionymi adnotacjami
    const pdfFiles = await this.syncPdfs(recDir, cur, prev, changed);
    const pdfNames = Object.values(pdfFiles).map((x) => x.file);

    // 1. Rekord
    if (await this.writeIfChanged(PathUtils.join(recDir, this.t("recordFile")), this.renderRecord(item, libName, pdfNames))) {
      changed.push(this.t("recordFile"));
    }

    // 2. Notatki: jeden plik na notatkę
    const noteFiles = {};
    for (const n of Object.values(cur.notes)) {
      const f = this.noteFileName(n);
      noteFiles[n.key] = f;
      if (await this.writeIfChanged(PathUtils.join(recDir, f), this.renderNote(n, item, libName))) {
        changed.push(f);
      }
    }

    // 3. Zaznaczenia: jeden plik na kolor
    const byColor = {};
    for (const a of Object.values(cur.anns)) {
      const f = this.sanitize(this.colorFileName(a.color), 100) + ".md";
      (byColor[f] = byColor[f] || []).push(a);
    }
    for (const [f, list] of Object.entries(byColor)) {
      if (await this.writeIfChanged(PathUtils.join(recDir, f), this.renderColorFile(f, list, item, libName))) {
        changed.push(f);
      }
    }

    // 4. Pliki, których już nie ma w Zotero, trafiają do _usuniete/ (_deleted/) – nic nie kasujemy
    if (prev) {
      const keep = new Set([...Object.values(noteFiles), ...Object.keys(byColor)]);
      for (const f of Object.values(prev.pdfFiles || {}).map((x) => x.file)) {
        if (!pdfNames.includes(f)) {
          await this.moveToRemoved(recDir, f);
          changed.push(`(-> ${this.t("deletedDir")}) ${f}`);
        }
      }
      for (const f of [...Object.values(prev.noteFiles || {}), ...(prev.colorFiles || [])]) {
        if (!keep.has(f)) {
          await this.moveToRemoved(recDir, f);
          changed.push(`(-> ${this.t("deletedDir")}) ${f}`);
        }
      }
    }

    // 5. Stan (na końcu)
    const state = JSON.stringify(
      { notes: cur.notes, anns: cur.anns, noteFiles, colorFiles: Object.keys(byColor), pdfFiles },
      null,
      1
    );
    await this.writeIfChanged(statePath, state);

    if (changed.length) {
      await this.log(`WRITE [${libName}] ${PathUtils.filename(recDir)}: ${changed.join("; ")}`);
    } else if (NM_CONFIG.verboseEvents) {
      await this.log(`UNCHANGED [${libName}] ${PathUtils.filename(recDir)}`);
    }
  },

  // Zapis z opóźnieniem: seria zmian tego samego rekordu daje jeden zapis.
  schedule(top) {
    const lib = Zotero.Libraries.get(top.libraryID);
    if (!this.libraryAllowed(lib)) return;
    const k = `${top.libraryID}/${top.key}`;
    const cur = this.pending.get(k);
    if (cur) {
      cur.dirty = true;
      return;
    }
    const entry = { dirty: false };
    this.pending.set(k, entry);
    (async () => {
      try {
        let again;
        do {
          await Zotero.Promise.delay(NM_CONFIG.debounceMs);
          entry.dirty = false;
          await this.enqueue(async () => {
            const fresh = Zotero.Items.get(top.id);
            if (fresh && !fresh.deleted) await this.writeRecord(fresh);
          });
          again = entry.dirty;
        } while (again);
      } catch (e) {
        await this.log(`ERROR writing item ${top.key}: ${e}`);
      } finally {
        this.pending.delete(k);
      }
    })();
  },

  // ================= Usunięcia =================

  // Zdarzenie "delete" podaje tylko klucz elementu. Rekord usunięty w Zotero trafia do
  // _archiwum/ (nic nie kasujemy); dla notatki lub zaznaczenia odświeżamy jego rekord.
  async handleDeletes(libraryID, keys) {
    const lib = Zotero.Libraries.get(libraryID);
    if (!this.libraryAllowed(lib)) return;
    if (!(await this.vaultOk())) return;
    const libDir = PathUtils.join(this.vault(), NM_CONFIG.outDir, this.sanitize(lib.name, 100));
    if (!(await IOUtils.exists(libDir))) return;
    const children = await IOUtils.getChildren(libDir);
    const rest = new Set(keys);

    for (const key of keys) {
      const dir = children.find((p) => PathUtils.filename(p).endsWith(`[${key}]`));
      if (!dir) continue;
      const arch = PathUtils.join(this.vault(), NM_CONFIG.outDir, this.t("archiveDir"), this.sanitize(lib.name, 100));
      await IOUtils.makeDirectory(arch, { createAncestors: true });
      let dest = PathUtils.join(arch, PathUtils.filename(dir));
      if (await IOUtils.exists(dest)) dest += " " + this.stampFile();
      await IOUtils.move(dir, dest);
      rest.delete(key);
      await this.log(`ARCHIVE [${lib.name}] item deleted in Zotero: ${PathUtils.filename(dir)}`);
    }
    if (!rest.size) return;

    // Pozostałe klucze: szukamy ich w plikach stanu rekordów (notatki, zaznaczenia).
    for (const dir of children) {
      const m = PathUtils.filename(dir).match(/\[([A-Za-z0-9]+)\]$/);
      if (!m) continue;
      const sp = PathUtils.join(dir, ".nm-stan.json");
      if (!(await IOUtils.exists(sp))) continue;
      let st = null;
      try {
        st = JSON.parse(await IOUtils.readUTF8(sp));
      } catch (e) {
        continue;
      }
      const hit = [...rest].some((k) => (st.notes && st.notes[k]) || (st.anns && st.anns[k]));
      if (hit) {
        const top = Zotero.Items.getByLibraryAndKey(libraryID, m[1]);
        if (top) this.schedule(top);
      }
    }
  },

  // ================= Zapis wszystkiego (z menu Narzędzia) =================

  async backfillAll(window) {
    try {
      if (!(await this.ensureVault(window))) {
        await this.log("Export: cancelled (no vault)");
        return;
      }
      const libs = Zotero.Libraries.getAll().filter((l) => this.libraryAllowed(l));
      const all = [];
      for (const lib of libs) {
        const items = (await Zotero.Items.getAll(lib.libraryID, true)).filter((i) => i.isRegularItem() && !i.deleted);
        all.push({ lib, items });
      }
      const plan = all;
      const count = plan.reduce((s, p) => s + p.items.length, 0);
      if (!Services.prompt.confirm(window, this.t("name"), this.t("confirmBackfill", count, `${this.vault()}/${NM_CONFIG.outDir}`))) {
        await this.log("Export: cancelled by user");
        return;
      }
      await this.log(`Export: start (${plan.length} libraries, ${count} items) -> ${this.vault()}`);
      let n = 0;
      for (const p of plan) {
        for (const it of p.items) {
          await this.enqueue(() => this.writeRecord(it));
          n++;
          if (n % 50 === 0) await this.log(`Export: ${n}/${count}`);
        }
      }
      await this.log(`Export: done (${n} items)`);
      Services.prompt.alert(window, this.t("name"), this.t("done", n));
    } catch (e) {
      await this.log(`ERROR during export: ${e}`);
    }
  },

  addMenu(window) {
    try {
      const doc = window.document;
      if (doc.getElementById("nmb-tools-menu")) return;
      const tools = doc.getElementById("menu_ToolsPopup");
      if (!tools) return;
      // Menu Narzędzia: jedna pozycja „Notes Migrator”, opcje rozwijają się po najechaniu (podmenu).
      const menu = doc.createXULElement("menu");
      menu.id = "nmb-tools-menu";
      menu.setAttribute("label", this.t("name"));
      const popup = doc.createXULElement("menupopup");
      popup.id = "nmb-tools-popup";
      menu.appendChild(popup);
      tools.appendChild(menu);
      const add = (id, label, fn) => {
        const mi = doc.createXULElement("menuitem");
        mi.id = id;
        mi.setAttribute("label", label);
        mi.addEventListener("command", fn);
        popup.appendChild(mi);
      };
      add("nmb-backfill", this.t("menuBackfill"), () => this.backfillAll(window));
      add("nmb-choose", this.t("menuChoose"), () => this.chooseVault(window));
      this.windows.add(window);
    } catch (e) {
      this.log(`ERROR menu: ${e}`);
    }
  },

  // Po zmianie języka: menu z nowymi napisami
  refreshMenus() {
    for (const w of [...this.windows]) {
      this.removeMenu(w);
      this.addMenu(w);
    }
  },

  removeMenu(window) {
    try {
      for (const id of ["nmb-tools-menu"]) window.document.getElementById(id)?.remove();
    } catch (e) {}
    this.windows.delete(window);
  },

  // ================= Zdarzenia =================

  describe(id, extraData) {
    try {
      const item = Zotero.Items.get(id);
      if (!item) return `id=${id} (no such item)`;
      const lib = Zotero.Libraries.get(item.libraryID);
      return `id=${id} key=${item.key} library="${lib ? lib.name : item.libraryID}" typ=${item.itemType}`;
    } catch (e) {
      return `id=${id} describe error: ${e}`;
    }
  },

  async init(id, version, rootURI) {
    this.id = id;
    this.version = version;
    this.logPath = PathUtils.join(Zotero.DataDirectory.dir, "notes-migrator-basic.log");
    Zotero.NotesMigratorBasic = this; // dla panelu opcji (prefs.js)

    await this.log(`=== START Notes Migrator Basic ${version}; Zotero ${Zotero.version}; language ${this.lang()} ===`);
    // Panel opcji wtyczki.
    try {
      if (Zotero.PreferencePanes?.register && rootURI) {
        this.prefPaneID = await Zotero.PreferencePanes.register({
          pluginID: id,
          src: rootURI + "prefs.xhtml",
          scripts: [rootURI + "prefs.js"],
          label: "Notes Migrator Basic",
        });
      }
    } catch (e) {
      await this.log(`WARNING: could not add the settings pane (${e}); use the Tools menu`);
    }
    await this.log(`Vault: ${this.vault() || "(none)"}; PDF copies: ${this.pdfEnabled()}`);

    const self = this;
    this.observerID = Zotero.Notifier.registerObserver(
      {
        notify: async (event, type, ids, extraData) => {
          try {
            if (!["add", "modify", "trash", "delete"].includes(event)) return;
            const sync = Zotero.Sync?.Runner?.syncInProgress ? "yes" : "no";
            if (NM_CONFIG.verboseEvents) {
              await self.log(`EVENT ${event}/${type} count=${ids.length} sync_in_progress=${sync}`);
              for (const itemID of ids) await self.log("    " + self.describe(itemID, extraData));
            }
            if (event === "delete") {
              const byLib = new Map();
              for (const itemID of ids) {
                const e = extraData && extraData[itemID];
                if (e && e.libraryID && e.key) {
                  if (!byLib.has(e.libraryID)) byLib.set(e.libraryID, []);
                  byLib.get(e.libraryID).push(e.key);
                }
              }
              for (const [lid, keys] of byLib) self.enqueue(() => self.handleDeletes(lid, keys));
              return;
            }
            for (const itemID of ids) {
              const item = Zotero.Items.get(itemID);
              const top = item ? self.topItem(item) : null;
              if (top) self.schedule(top);
            }
          } catch (e) {
            await self.log(`ERROR in observer: ${e}`);
          }
        },
      },
      ["item"],
      "notes-migrator-basic"
    );

    try {
      for (const w of Zotero.getMainWindows()) this.addMenu(w);
    } catch (e) {}
  },

  async shutdown() {
    if (this.observerID) {
      Zotero.Notifier.unregisterObserver(this.observerID);
      this.observerID = null;
    }
    for (const w of [...this.windows]) this.removeMenu(w);
    await this.log("=== STOP Notes Migrator Basic ===");
  },
};

async function startup({ id, version, rootURI }, reason) {
  await Zotero.initializationPromise;
  await NotesMigrator.init(id, version, rootURI);
}

async function shutdown({ id, version }, reason) {
  await NotesMigrator.shutdown();
}

function install() {}
function uninstall() {}
function onMainWindowLoad({ window }) {
  NotesMigrator.addMenu(window);
}
function onMainWindowUnload({ window }) {
  NotesMigrator.removeMenu(window);
}
