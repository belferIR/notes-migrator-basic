// Panel opcji Notes Migrator Basic: napisy w języku wtyczki, sejf, język, kopia PDF, nazwy kolorów.
// Każda zmiana zapisuje się od razu w ustawieniach Zotero (extensions.notes-migrator-basic.*).
(function () {
  let tries = 0;
  const COLORS = ["#ffd400", "#ff6666", "#5fb236", "#2ea8e5", "#a28ae5", "#e56eee", "#f19837", "#aaaaaa"];

  function setup() {
    const NM = Zotero.NotesMigratorBasic;
    const $ = (id) => document.getElementById(id);
    if (!NM || !$("nmb-intro")) {
      if (tries++ < 30) setTimeout(setup, 100);
      return;
    }
    const t = (k) => NM.t(k);

    // Napisy (ponownie po zmianie języka)
    function texts() {
      const set = (id, key) => ($(id).textContent = t(key));
      set("nmb-intro", "paneIntro");
      set("nmb-vault-label", "paneVault");
      set("nmb-choose", "paneChoose");
      set("nmb-lang-label", "paneLang");
      set("nmb-lang-auto", "langAuto");
      set("nmb-lang-pl", "langPl");
      set("nmb-lang-en", "langEn");
      set("nmb-lang-hint", "paneLangHint");
      set("nmb-pdf-label", "panePdf");
      set("nmb-pdf-hint", "panePdfHint");
      set("nmb-colors-label", "paneColors");
      set("nmb-colors-hint", "paneColorsHint");
      set("nmb-sample", "paneSample");
      set("nmb-reset", "paneReset");
      set("nmb-refresh", "paneRefresh");
      $("nmb-vault-path").value = NM.vault() || t("paneNone");
      colors();
    }

    // Tabela kolorów: próbka, nazwa koloru, pole na własną nazwę pliku
    function colors() {
      const table = $("nmb-colors");
      table.textContent = "";
      const names = t("colorNames");
      const defaults = t("colors");
      for (const hex of COLORS) {
        const tr = document.createElementNS("http://www.w3.org/1999/xhtml", "tr");
        const sw = document.createElementNS("http://www.w3.org/1999/xhtml", "td");
        sw.style.cssText = `width: 18px; height: 18px; background: ${hex}; border: 1px solid #555;`;
        const nm = document.createElementNS("http://www.w3.org/1999/xhtml", "td");
        nm.textContent = names[hex];
        nm.style.padding = "2px 10px";
        const cell = document.createElementNS("http://www.w3.org/1999/xhtml", "td");
        const inp = document.createElementNS("http://www.w3.org/1999/xhtml", "input");
        inp.type = "text";
        inp.id = "nmb-color-" + hex.slice(1);
        inp.placeholder = defaults[hex];
        inp.value = NM.pref("color." + hex, "");
        inp.style.minWidth = "260px";
        inp.addEventListener("change", () => NM.setPref("color." + hex, inp.value.trim()));
        cell.appendChild(inp);
        tr.append(sw, nm, cell);
        table.appendChild(tr);
      }
    }

    $("nmb-choose").addEventListener("click", async () => {
      await NM.chooseVault(window);
      $("nmb-vault-path").value = NM.vault() || t("paneNone");
    });
    $("nmb-lang").value = String(NM.pref("language", "auto"));
    $("nmb-lang").addEventListener("change", () => {
      NM.setPref("language", $("nmb-lang").value);
      NM.refreshMenus();
      texts();
    });
    $("nmb-pdf").checked = NM.pdfEnabled();
    $("nmb-pdf").addEventListener("change", () => NM.setPref("pdfExport", $("nmb-pdf").checked ? "true" : "false"));
    $("nmb-sample").addEventListener("click", () => {
      const sample = t("colorSample");
      for (const hex of COLORS) NM.setPref("color." + hex, sample[hex]);
      colors();
    });
    $("nmb-reset").addEventListener("click", () => {
      for (const hex of COLORS) NM.setPref("color." + hex, "");
      colors();
    });
    texts();
  }
  setup();
})();
