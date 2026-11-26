#!/usr/bin/env bash
# Saves a safe copy of the database and uploaded images in one .tar.gz.
#   On the server (runs every night):  bash deploy/backup.sh
#   On your computer, to move your shop to the server:  bash deploy/backup.sh data ~/zal3a-data.tar.gz
set -euo pipefail

dataDir="$(realpath "${1:-/var/lib/zal3a}")"
backupDir=/var/backups/zal3a
output="$(realpath -m "${2:-$backupDir/zal3a-$(date +%F).tar.gz}")"
workDir="$(mktemp -d)"
trap 'rm -rf "$workDir"' EXIT

# VACUUM INTO makes a consistent copy even while the shop is running.
node -e 'const { DatabaseSync } = require("node:sqlite"); new DatabaseSync(process.argv[1]).prepare("VACUUM INTO ?").run(process.argv[2]);' \
  "$dataDir/zal3a.db" "$workDir/zal3a.db"
tar -czf "$output" -C "$workDir" zal3a.db -C "$dataDir" uploads
echo "Backup saved: $output"

# Nightly backups keep the last 14 days.
[ -n "${2:-}" ] || find "$backupDir" -name "zal3a-*.tar.gz" -mtime +14 -delete
