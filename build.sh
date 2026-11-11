#!/bin/bash
# Buduje plik wtyczki .xpi i wpisuje jego sumę SHA-256 do updates.json.
# Użycie: bash build.sh   (w folderze repozytorium; potrzebne: zip, sha256sum, python3)
set -e
cd "$(dirname "$0")"
VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUT="notes-migrator-basic-$VERSION.xpi"
rm -f "$OUT"
zip -q -r "$OUT" manifest.json bootstrap.js prefs.js prefs.xhtml LICENSE
HASH=$(sha256sum "$OUT" | cut -d' ' -f1)
python3 - "$VERSION" "$HASH" <<'PY'
import json, sys
version, sha = sys.argv[1], sys.argv[2]
addon = "notes-migrator-basic@belferir.github.io"
data = {"addons": {addon: {"updates": []}}}
try:
    data = json.load(open("updates.json"))
except FileNotFoundError:
    pass
ups = [u for u in data["addons"][addon]["updates"] if u["version"] != version]
ups.append({
    "version": version,
    "update_link": f"https://github.com/belferIR/notes-migrator-basic/releases/download/v{version}/notes-migrator-basic-{version}.xpi",
    "update_hash": f"sha256:{sha}",
    "applications": {"zotero": {"strict_min_version": "7.0", "strict_max_version": "10.*"}},
})
data["addons"][addon]["updates"] = ups
json.dump(data, open("updates.json", "w"), indent=2)
PY
echo "Gotowe: $OUT (sha256 $HASH); updates.json zaktualizowany."
