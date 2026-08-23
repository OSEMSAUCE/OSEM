#!/usr/bin/env bash
# Populate static/mobileAssets/ for this child's demo.
# See ASSETS.md. Fails loud — no silent fallbacks.
set -euo pipefail

DEST="${1:-static/mobileAssets}"
NEEDED=(worldBase getcache_DT_bg.webp pin_library_small hand_phoneV3.webp)

# Look for a sibling ReTreever checkout that already has them.
for guess in \
  "../../../../../../static/mobileAssets" \
  "$HOME/DEV/fetch/ReTreever/static/mobileAssets" \
  "${RETREEVER_ASSETS:-}"
do
  [ -n "$guess" ] && [ -d "$guess" ] || continue
  ok=1
  for n in "${NEEDED[@]}"; do [ -e "$guess/$n" ] || ok=0; done
  [ "$ok" = 1 ] || continue
  mkdir -p "$DEST"
  echo "Copying assets from $guess"
  for n in "${NEEDED[@]}"; do
    # The repo ships these paths as symlinks into a ReTreever checkout. In a
    # bare clone they DANGLE, and `cp -R` onto a dangling symlink fails with
    # "Not a directory". Clear whatever is there (dead link or stale copy)
    # first. SvelteKit walks static/ at build time and dies on a dangling
    # link, so this is what makes a fresh clone buildable at all.
    unlink "$DEST/$n" 2>/dev/null || true
    cp -R "$guess/$n" "$DEST/"
    echo "  ✓ $n"
  done
  echo "Done. Assets are in $DEST"
  exit 0
done

echo "ERROR: could not find the mobileAssets source." >&2
echo "" >&2
echo "This child needs ~50 MB of basemap assets that are not in git." >&2
echo "Either:" >&2
echo "  - set RETREEVER_ASSETS=/path/to/ReTreever/static/mobileAssets, or" >&2
echo "  - ask Ground Truth Data for the asset bundle." >&2
echo "" >&2
echo "See ASSETS.md." >&2
exit 1
