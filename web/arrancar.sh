#!/usr/bin/env bash
# ══════════════════════════════════════════════════
#  JJK BATTLE — ARRANQUE AUTOMÁTICO (macOS / Linux)
#  100% sin permisos de root ni sudo.
#  Coloca este archivo en jjk-battle/web/
#  Uso: bash arrancar.sh
# ══════════════════════════════════════════════════

set -euo pipefail

NODE_VERSION="v22.13.1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_DIR="$SCRIPT_DIR/node_portable"
NODE_BIN="$NODE_DIR/bin/node"
NPM_BIN="$NODE_DIR/bin/npm"

# ── Detectar plataforma ───────────────────────────
OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64)  PLATFORM="darwin-arm64" ;;
      x86_64) PLATFORM="darwin-x64"   ;;
      *)      echo "[ERROR] Arquitectura Mac no soportada: $ARCH"; exit 1 ;;
    esac ;;
  Linux)
    case "$ARCH" in
      x86_64)  PLATFORM="linux-x64"   ;;
      aarch64) PLATFORM="linux-arm64" ;;
      armv7l)  PLATFORM="linux-armv7l";;
      *)       echo "[ERROR] Arquitectura no soportada: $ARCH"; exit 1 ;;
    esac ;;
  *)
    echo "[ERROR] Sistema operativo no soportado: $OS"; exit 1 ;;
esac

NODE_TARBALL="node-${NODE_VERSION}-${PLATFORM}.tar.xz"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TARBALL}"
NODE_TMP="$SCRIPT_DIR/${NODE_TARBALL}"

echo ""
echo " ================================================="
echo "  JUJUTSU KAISEN  |  BATTLE SYSTEM"
echo " ================================================="
echo ""

# ── Paso 1: Usar Node.js incluido ─────────────────
if [ ! -f "$NODE_BIN" ]; then
  echo " [ERROR] Node.js portable no encontrado."
  echo "         Asegurate de distribuir '$NODE_DIR/' junto al juego."
  echo "         No se requiere descargar nada para jugar en LAN."
  exit 1
fi

echo " [1/4] Node.js $("$NODE_BIN" --version) disponible."

echo ""
# ── Paso 2: Usar dependencias incluidas ──────────
if [ ! -f "$SCRIPT_DIR/node_modules/express/package.json" ]; then
  echo " [ERROR] Dependencias del servidor no encontradas."
  echo "         Asegurate de distribuir 'node_modules/' completo con el juego."
  echo "         Este script no descargara paquetes adicionales."
  exit 1
fi

echo " [2/4] Dependencias ya instaladas."

# ── Paso 3: Elegir modo de red ────────────────────
echo ""
echo " -------------------------------------------------"
echo "  ¿CÓMO QUIERES JUGAR?"
echo ""
echo "  1) Red local (LAN / WiFi)"
echo "     Ambos PCs deben estar en la misma red."
echo "     Sin configuración extra en macOS/Linux."
echo ""
echo "  2) Túnel internet (opcional)"
echo "     Genera una URL pública que funciona desde"
echo "     cualquier red. Requiere internet y localtunnel."
echo "     No es necesario para multijugador local."
echo ""
echo " -------------------------------------------------"
echo ""
read -rp "  Opción (1 o 2): " MODO

while [[ "$MODO" != "1" && "$MODO" != "2" ]]; do
  echo "  Elige 1 o 2."
  read -rp "  Opción: " MODO
done

# ════════════════════════════════════════════════
#  MODO 1: LAN DIRECTO
# ════════════════════════════════════════════════
if [ "$MODO" = "1" ]; then

  LOCAL_IP=""
  if command -v ip &>/dev/null; then
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP '(?<=src )\S+' || true)
  fi
  if [ -z "$LOCAL_IP" ] && command -v ifconfig &>/dev/null; then
    LOCAL_IP=$(ifconfig 2>/dev/null \
      | awk '/inet /{print $2}' \
      | grep -v '127.0.0.1' | grep -v '^$' | head -1 \
      | sed 's/addr://')
  fi
  [ -z "$LOCAL_IP" ] && LOCAL_IP="(usa ifconfig para verla)"

  echo ""
  echo " [3/4] Modo: Red local (LAN)"
  echo " [4/4] Arrancando servidor..."
  echo ""
  echo " -------------------------------------------------"
  echo "  Mismo PC   >  http://localhost:3000"
  echo "  Otro PC    >  http://${LOCAL_IP}:3000"
  echo ""
  echo "  El otro jugador abre la URL 'Otro PC'."
  echo "  Ambos deben estar en la misma red WiFi/LAN."
  echo " -------------------------------------------------"
  echo ""
  echo "  Ctrl+C para detener."
  echo ""

  cd "$SCRIPT_DIR"
  "$NODE_BIN" server.js

# ════════════════════════════════════════════════
#  MODO 2: TÚNEL (localtunnel)
# ════════════════════════════════════════════════
else

  echo ""
  echo " [3/4] Modo: Túnel internet (localtunnel)"

  if [ ! -f "$SCRIPT_DIR/node_modules/localtunnel/package.json" ]; then
    echo " [ERROR] localtunnel no está instalado."
    echo "         El modo túnel requiere internet y el paquete localtunnel preinstalado."
    echo "         Para jugar en LAN, elige la opción 1."
    exit 1
  fi

  echo " [4/4] Arrancando servidor con túnel..."
  echo ""
  echo " -------------------------------------------------"
  echo "  Esperando URL pública..."
  echo "  (puede tardar unos segundos)"
  echo ""
  echo "  Cuando aparezca la URL, compártela con el"
  echo "  otro jugador. Funciona desde cualquier red."
  echo " -------------------------------------------------"
  echo ""
  echo "  Ctrl+C para detener."
  echo ""

  cd "$SCRIPT_DIR"
  "$NODE_BIN" server.js --tunnel

fi
