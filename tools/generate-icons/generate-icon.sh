#!/bin/bash
# Generador de iconos para proyectos NRD
# Uso: ./generate-icon.sh "TEXTO_DEL_ICONO" [proyecto]
# Ejemplo: ./generate-icon.sh "NRD RRHH" nrd-rrhh

set -e

if [ -z "$1" ]; then
    echo "✗ Error: Debes proporcionar el texto del icono como parámetro"
    echo "   Uso: ./generate-icon.sh \"TEXTO_DEL_ICONO\" [proyecto]"
    echo "   Ejemplo: ./generate-icon.sh \"NRD RRHH\" nrd-rrhh"
    exit 1
fi

ICON_TEXT="$1"
PROJECT_NAME="$2"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECTS_DIR="$(dirname "$COMMON_DIR")"

# Si se especifica proyecto, usar ese; si no, detectar desde el directorio actual
if [ -n "$PROJECT_NAME" ]; then
    PROJECT_ROOT="$PROJECTS_DIR/$PROJECT_NAME"
elif [[ "$(pwd)" == *"nrd-"* ]]; then
    # Estamos en un proyecto, usar ese
    PROJECT_ROOT="$(pwd)"
else
    echo "✗ Error: No se especificó el proyecto y no se puede detectar automáticamente"
    echo "   Uso: ./generate-icon.sh \"TEXTO_DEL_ICONO\" [proyecto]"
    echo "   Ejemplo: ./generate-icon.sh \"NRD RRHH\" nrd-rrhh"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT" ]; then
    echo "✗ Error: Proyecto '$PROJECT_ROOT' no encontrado"
    exit 1
fi

echo "Generando icono con texto: \"$ICON_TEXT\""
echo "Directorio del proyecto: $PROJECT_ROOT"
echo ""

cd "$PROJECT_ROOT"

VENV_DIR=".venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv "$VENV_DIR"
fi

echo "Activando entorno virtual..."
source "$VENV_DIR/bin/activate"

echo "Verificando dependencias..."
if ! python3 -c "import cairosvg" 2>/dev/null; then
    echo "Instalando cairosvg..."
    pip install -q cairosvg
else
    echo "✓ cairosvg ya está instalado"
fi

echo ""
echo "Generando iconos..."
if [ -n "$PROJECT_NAME" ]; then
    python3 "$SCRIPT_DIR/generate-icon.py" "$ICON_TEXT" "$PROJECT_NAME"
else
    python3 "$SCRIPT_DIR/generate-icon.py" "$ICON_TEXT"
fi

echo ""
echo "✓ Iconos generados exitosamente!"
echo "  - icon-192.png"
echo "  - icon-512.png"
