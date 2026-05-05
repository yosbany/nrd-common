#!/bin/bash
# Instala el hook pre-push en el repositorio git para actualizar la versión
# (version.json + index.html) en todos los proyectos NRD antes de cada push.
# Ejecutar desde la raíz del repo: ./nrd-common/tools/git-hooks/install-hooks.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [ -z "$REPO_ROOT" ]; then
    echo "❌ No se detectó un repositorio git. Ejecuta este script desde la raíz de nrd-system (donde está .git)."
    exit 1
fi

HOOKS_DIR="$REPO_ROOT/.git/hooks"
PRE_PUSH_SRC="$SCRIPT_DIR/pre-push"
PRE_PUSH_DST="$HOOKS_DIR/pre-push"

mkdir -p "$HOOKS_DIR"
cp "$PRE_PUSH_SRC" "$PRE_PUSH_DST"
chmod +x "$PRE_PUSH_DST"

echo "✅ Hook pre-push instalado en $PRE_PUSH_DST"
echo "   En cada 'git push' se actualizará la versión en todos los proyectos NRD"
echo "   y se creará un commit si hubo cambios (version.json / index.html)."
