#!/bin/sh
# Rebuild, check content, then run the browser regression tests against the built files.
#   sh tools/test.sh            all tests        sh tools/test.sh v5 star    only these
# Needs node + playwright + a Chrome. Override with PW=<path to playwright/index.mjs> CHROME=<chrome binary>.
cd "$(dirname "$0")/.." || exit 1
: "${PW:=/opt/npm-tools/node_modules/playwright/index.mjs}"; [ -e "$PW" ] || PW=playwright
: "${CHROME:=/usr/bin/google-chrome}"; [ -x "$CHROME" ] || CHROME=
PORT=8765; export PW CHROME SA_URL="http://localhost:$PORT/" SA_DIST="file://$PWD/dist/index.html"
python3 build/build.py && node tools/check.mjs || exit 1
python3 -m http.server $PORT --directory . >/dev/null 2>&1 & SRV=$!; trap 'kill $SRV' EXIT; sleep 1
fail=0
for t in ${@:-v5 t3 fuzz f6 star backup feat4 fbmerge fbsync t8}; do
  out=$(timeout 300 node "test/$t.mjs" 2>&1); printf '%s\n' "$out" | tail -n 3 | cut -c1-200
  printf '%s\n' "$out" | grep -q 'NO ERRORS' && echo "PASS $t" || { echo "FAIL $t"; fail=1; }
done
exit $fail
