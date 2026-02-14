#!/bin/bash
# Generador de iconos para apps NRD (herramienta compartida en nrd-common)
# Uso: ./generate-icon.sh "TEXTO_DEL_ICONO" [directorio_salida] [icon_type]
# Ejemplo desde nrd-catalogo: ../../nrd-common/tools/generate-icons/generate-icon.sh "NRD Catálogo" assets/icons
# Ejemplo bakery: ../../nrd-common/tools/generate-icons/generate-icon.sh "Panadería|Nueva Río D'or" assets/icons bakery

set -e

if [ -z "$1" ]; then
    echo "✗ Error: Debes proporcionar el texto del icono como parámetro"
    echo "   Uso: ./generate-icon.sh \"TEXTO_DEL_ICONO\" [directorio_salida] [icon_type]"
    echo "   Icon types: catalog (default), bakery"
    exit 1
fi

ICON_TEXT="$1"
OUTPUT_DIR="${2:-.}"
ICON_TYPE="${3:-catalog}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Generando icono con texto: \"$ICON_TEXT\""
echo "Directorio de salida: $OUTPUT_DIR"
echo ""

# Resolver ruta de salida respecto al directorio actual
if [[ "$OUTPUT_DIR" != /* ]]; then
    OUTPUT_DIR="$(pwd)/$OUTPUT_DIR"
fi
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR="$(cd "$OUTPUT_DIR" && pwd)"

# Usar venv en common si existe, si no crear uno
VENV_DIR="$COMMON_DIR/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creando entorno virtual en nrd-common..."
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
python3 "$SCRIPT_DIR/generate-icon.py" "$ICON_TEXT" "$OUTPUT_DIR" "$ICON_TYPE"

echo ""
echo "✓ Iconos generados exitosamente!"
echo "  - $OUTPUT_DIR/icon-192.png"
echo "  - $OUTPUT_DIR/icon-512.png"
