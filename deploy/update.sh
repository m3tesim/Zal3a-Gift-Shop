#!/usr/bin/env bash
# Backs up the data, pulls the latest code from GitHub, rebuilds and restarts the shop.
# Usage, on the server: sudo bash /opt/zal3a/app/deploy/update.sh
set -euo pipefail

# Everything runs from inside a function so bash has read the whole file before `git pull` can change it.
main() {
  local appUser=zal3a
  local appDir=/opt/zal3a/app
  cd "$appDir"

  if [ -f /var/lib/zal3a/zal3a.db ]; then
    echo "==> Backup"
    sudo -u "$appUser" -H bash deploy/backup.sh
  fi

  echo "==> Latest code"
  sudo -u "$appUser" -H git pull --ff-only

  echo "==> Install and build (takes a few minutes on the free server)"
  sudo -u "$appUser" -H npm ci
  sudo -u "$appUser" -H env NODE_OPTIONS=--max-old-space-size=1536 npm run build

  echo "==> Restart"
  systemctl restart zal3a
}

main "$@"
