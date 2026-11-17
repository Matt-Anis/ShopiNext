#!/bin/sh
set -eu

cd /workspace/packages/search-tooling
case "${1:-}" in
  sync) entry=sync/index.ts ;;
  reconcile) entry=reconciliation/index.ts ;;
  *) echo "Expected sync or reconcile." >&2; exit 2 ;;
esac

exec /usr/local/bin/node node_modules/tsx/dist/cli.mjs "$entry"
