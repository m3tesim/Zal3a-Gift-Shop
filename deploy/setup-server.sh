#!/usr/bin/env bash
# Turns a fresh Ubuntu server into the shop: Node, the app, HTTPS (Caddy) and daily backups.
# Safe to run again. Usage, on the server:
#   curl -fsSL https://raw.githubusercontent.com/m3tesim/Zal3a-Gift-Shop/main/deploy/setup-server.sh | sudo bash -s -- your-domain.com
# If ~/zal3a-data.tar.gz exists (made with deploy/backup.sh), it becomes the shop's data on the first run.
set -euo pipefail

DOMAIN="${1:?Usage: sudo bash setup-server.sh your-domain.com}"
REPO_URL="https://github.com/m3tesim/Zal3a-Gift-Shop.git"
APP_USER=zal3a
APP_DIR=/opt/zal3a/app
DATA_DIR=/var/lib/zal3a
BACKUP_DIR=/var/backups/zal3a
NODE_MAJOR=26
RESTORE_FILE="$(getent passwd "${SUDO_USER:-root}" | cut -d: -f6)/zal3a-data.tar.gz"

[ "$(id -u)" -eq 0 ] || { echo "Run this with sudo."; exit 1; }

echo "==> Swap file (the build needs more memory than the 1 GB the free server has)"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

echo "==> Packages: git, Node $NODE_MAJOR, Caddy"
apt-get update
apt-get install -y ca-certificates curl git caddy
if ! node --version 2>/dev/null | grep -q "^v$NODE_MAJOR\."; then
  curl -fsSL "https://deb.nodesource.com/setup_$NODE_MAJOR.x" | bash -
  apt-get install -y nodejs
fi

echo "==> App user, folders and code"
id "$APP_USER" &>/dev/null || useradd --system --home-dir /opt/zal3a --shell /usr/sbin/nologin "$APP_USER"
mkdir -p /opt/zal3a "$DATA_DIR" "$BACKUP_DIR"
[ -d "$APP_DIR/.git" ] || git clone "$REPO_URL" "$APP_DIR"

isRestoring=false
if [ ! -f "$DATA_DIR/zal3a.db" ] && [ -f "$RESTORE_FILE" ]; then
  echo "==> Restoring shop data from $RESTORE_FILE"
  tar -xzf "$RESTORE_FILE" -C "$DATA_DIR"
  isRestoring=true
fi

adminPassword=""
if [ ! -f "$APP_DIR/.env.local" ]; then
  [ -f "$DATA_DIR/zal3a.db" ] || adminPassword="$(openssl rand -base64 12)"
  cat > "$APP_DIR/.env.local" <<EOF
DATA_DIR=$DATA_DIR
SITE_URL=https://$DOMAIN

# Used only once, to create the first admin when the database is new.
ADMIN_EMAIL=admin@zal3a.local
ADMIN_PASSWORD=$adminPassword

# Email (Resend). Fill these in, remove the #, then run: sudo systemctl restart zal3a
# SMTP_HOST=smtp.resend.com
# SMTP_PORT=465
# SMTP_USER=resend
# SMTP_PASS=your-resend-api-key
# MAIL_FROM="zal3a <hello@$DOMAIN>"
EOF
  chmod 600 "$APP_DIR/.env.local"
fi
chown -R "$APP_USER:$APP_USER" /opt/zal3a "$DATA_DIR" "$BACKUP_DIR"

echo "==> Service, HTTPS and nightly backup"
cp "$APP_DIR/deploy/zal3a.service" /etc/systemd/system/zal3a.service
systemctl daemon-reload
systemctl enable zal3a
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000
}
EOF
systemctl reload-or-restart caddy
echo "30 3 * * * $APP_USER bash $APP_DIR/deploy/backup.sh" > /etc/cron.d/zal3a-backup

bash "$APP_DIR/deploy/update.sh"

echo
echo "✅ The shop is running at https://$DOMAIN"
if [ -n "$adminPassword" ]; then
  echo "   Admin: https://$DOMAIN/admin"
  echo "   email:    admin@zal3a.local"
  echo "   password: $adminPassword   (save it now, then change it in Admin → Account)"
elif [ "$isRestoring" = true ]; then
  echo "   Your products, orders and admin login came from $RESTORE_FILE."
fi
echo "   Settings (email etc.): sudo nano $APP_DIR/.env.local"
