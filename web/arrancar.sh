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
      arm64)  PLATFORM="darwin-arm64" ;;   # Apple Silicon (M1/M2/M3/M4)
      x86_64) PLATFORM="darwin-x64"   ;;   # Intel Mac
      *) echo "[ERROR] Arquitectura Mac no soportada: $ARCH"; exit 1 ;;
    esac
    ;;
  Linux)
    case "$ARCH" in
      x86_64)  PLATFORM="linux-x64"    ;;
      aarch64) PLATFORM="linux-arm64"  ;;
      armv7l)  PLATFORM="linux-armv7l" ;;
      *) echo "[ERROR] Arquitectura Linux no soportada: $ARCH"; exit 1 ;;
    esac
    ;;
  *)
    echo "[ERROR] Sistema operativo no soportado: $OS"
    exit 1
    ;;
esac

NODE_TARBALL="node-${NODE_VERSION}-${PLATFORM}.tar.xz"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TARBALL}"
NODE_TMP="$SCRIPT_DIR/${NODE_TARBALL}"

echo ""
echo " ================================================="
echo "  JUJUTSU KAISEN  |  BATTLE SYSTEM"
echo "  Iniciando servidor..."
echo " ================================================="
echo ""

# ── Paso 1: Descargar Node.js si no existe ────────
if [ ! -f "$NODE_BIN" ]; then
  echo " [1/3] Node.js no encontrado. Descargando $NODE_VERSION ($PLATFORM)..."
  echo ""

  mkdir -p "$NODE_DIR"

  # Descargar con curl o wget — ambos funcionan sin permisos especiales
  if command -v curl &>/dev/null; then
    curl -fL --progress-bar "$NODE_URL" -o "$NODE_TMP"
  elif command -v wget &>/dev/null; then
    wget -q --show-progress "$NODE_URL" -O "$NODE_TMP"
  else
    echo " [ERROR] No se encontró curl ni wget."
    echo "         Descarga manualmente $NODE_URL"
    echo "         y coloca el .tar.xz en: $SCRIPT_DIR/"
    exit 1
  fi

  if [ ! -f "$NODE_TMP" ]; then
    echo " [ERROR] La descarga falló."
    exit 1
  fi

  echo " [1/3] Descomprimiendo..."

  # --strip-components=1 elimina la carpeta raíz del tar (node-vX.Y.Z-platform/)
  # y extrae el contenido directamente en NODE_DIR — sin sudo, sin make install
  tar -xf "$NODE_TMP" -C "$NODE_DIR" --strip-components=1
  rm -f "$NODE_TMP"

  if [ ! -f "$NODE_BIN" ]; then
    echo " [ERROR] La extracción falló. Comprueba espacio en disco."
    exit 1
  fi

  echo " [1/3] Node.js listo: $("$NODE_BIN" --version)"
  echo ""
else
  echo " [1/3] Node.js $("$NODE_BIN" --version) disponible."
fi

# ── Paso 2: Instalar dependencias si faltan ──────
if [ ! -f "$SCRIPT_DIR/node_modules/express/package.json" ]; then
  echo " [2/3] Instalando dependencias (solo la primera vez)..."
  echo ""

  cd "$SCRIPT_DIR"

  # --no-global       no instala nada a nivel de sistema
  # --ignore-scripts  omite scripts de compilación nativa (node-gyp, etc.)
  #                   que pueden necesitar Python, gcc o permisos de sistema
  # --no-audit        sin consultas extra a la red
  # --prefer-offline  usa caché local si ya existe
  "$NPM_BIN" install \
    --no-global \
    --ignore-scripts \
    --no-audit \
    --prefer-offline

  echo ""
  echo " [2/3] Dependencias instaladas."
  echo ""
else
  echo " [2/3] Dependencias ya instaladas."
fi

# ── Paso 3: Detectar IP local y arrancar ─────────
LOCAL_IP=""

if command -v ip &>/dev/null; then
  # Linux con iproute2
  LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP '(?<=src )\S+' || true)
fi

if [ -z "$LOCAL_IP" ] && command -v ifconfig &>/dev/null; then
  # macOS / Linux sin iproute2
  LOCAL_IP=$(ifconfig 2>/dev/null \
    | awk '/inet /{print $2}' \
    | grep -v '127.0.0.1' \
    | grep -v '^$' \
    | head -1 \
    | sed 's/addr://')
fi

[ -z "$LOCAL_IP" ] && LOCAL_IP="(no detectada — usa ifconfig para verla)"

echo ""
echo " [3/3] Arrancando en http://localhost:3000"
echo ""
echo " -------------------------------------------------"
echo "  COMO JUGAR:"
echo ""
echo "  Mismo PC   >  http://localhost:3000"
echo "  Red local  >  http://${LOCAL_IP}:3000"
echo ""
echo "  El otro jugador usa la URL de Red local."
echo " -------------------------------------------------"
echo ""
echo "  Ctrl+C para detener el servidor."
echo ""

cd "$SCRIPT_DIR"
"$NODE_BIN" server.js
