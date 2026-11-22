#!/bin/bash

# Script para sincronizar componentes comunes desde nrd-common a todos los proyectos NRD
# Uso: ./sync-common.sh [proyecto]
# Si no se especifica proyecto, sincroniza a todos los proyectos

set -e

# Directorio base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$BASE_DIR"
PROJECTS_DIR="$(dirname "$BASE_DIR")"

# Lista de proyectos NRD
PROJECTS=(
  "nrd-rrhh"
  "nrd-compras"
  "nrd-control-cajas"
  "nrd-costos"
  "nrd-pedidos"
  "nrd-portal"
  "nrd-productos"
)

# Función para sincronizar componentes comunes a un proyecto
sync_to_project() {
  local project=$1
  local project_path="$PROJECTS_DIR/$project"
  
  if [ ! -d "$project_path" ]; then
    echo "⚠️  Proyecto $project no encontrado, saltando..."
    return
  fi
  
  echo "📦 Sincronizando componentes comunes a $project..."
  
  # Crear estructura de directorios si no existe
  mkdir -p "$project_path/common/modules/core"
  mkdir -p "$project_path/common/modules/ui"
  mkdir -p "$project_path/common/modules/utils"
  mkdir -p "$project_path/common/modules/services"
  
  # Copiar módulos core
  echo "  → Copiando módulos core..."
  cp -f "$COMMON_DIR/modules/core/logger.js" "$project_path/common/modules/core/"
  cp -f "$COMMON_DIR/modules/core/config.js" "$project_path/common/modules/core/"
  cp -f "$COMMON_DIR/modules/core/app-init.js" "$project_path/common/modules/core/"
  cp -f "$COMMON_DIR/modules/core/index.js" "$project_path/common/modules/core/" 2>/dev/null || true
  
  # Copiar módulos UI
  echo "  → Copiando módulos UI..."
  cp -f "$COMMON_DIR/modules/ui/modal.js" "$project_path/common/modules/ui/"
  cp -f "$COMMON_DIR/modules/ui/spinner.js" "$project_path/common/modules/ui/"
  cp -f "$COMMON_DIR/modules/ui/index.js" "$project_path/common/modules/ui/"
  
  # Copiar módulos utils
  echo "  → Copiando módulos utils..."
  cp -f "$COMMON_DIR/modules/utils/format.js" "$project_path/common/modules/utils/"
  cp -f "$COMMON_DIR/modules/utils/dom.js" "$project_path/common/modules/utils/"
  cp -f "$COMMON_DIR/modules/utils/date.js" "$project_path/common/modules/utils/"
  cp -f "$COMMON_DIR/modules/utils/index.js" "$project_path/common/modules/utils/"
  
  # Copiar módulos services
  echo "  → Copiando módulos services..."
  cp -f "$COMMON_DIR/modules/services/auth.js" "$project_path/common/modules/services/"
  cp -f "$COMMON_DIR/modules/services/navigation.js" "$project_path/common/modules/services/"
  cp -f "$COMMON_DIR/modules/services/data-loader.js" "$project_path/common/modules/services/"
  cp -f "$COMMON_DIR/modules/services/index.js" "$project_path/common/modules/services/"
  
  # Copiar README si existe
  if [ -f "$COMMON_DIR/README.md" ]; then
    cp -f "$COMMON_DIR/README.md" "$project_path/common/" 2>/dev/null || true
  fi
  
  # Copiar herramientas comunes
  echo "  → Copiando herramientas comunes..."
  if [ -d "$COMMON_DIR/tools" ]; then
    mkdir -p "$project_path/tools"
    cp -rf "$COMMON_DIR/tools/"* "$project_path/tools/" 2>/dev/null || true
  fi
  
  # Copiar service worker genérico
  echo "  → Copiando service worker..."
  if [ -f "$COMMON_DIR/service-worker.js" ]; then
    cp -f "$COMMON_DIR/service-worker.js" "$project_path/service-worker.js" 2>/dev/null || true
  fi
  
  echo "✅ $project sincronizado correctamente"
}

# Función para personalizar logger según el proyecto
customize_logger() {
  local project=$1
  local project_path="$PROJECTS_DIR/$project"
  local logger_file="$project_path/common/modules/core/logger.js"
  
  if [ ! -f "$logger_file" ]; then
    return
  fi
  
  # Obtener nombre del proyecto (ej: nrd-rrhh -> NRD RRHH)
  local project_name=$(echo "$project" | sed 's/nrd-//' | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')
  project_name="NRD $project_name"
  
  # Reemplazar el nombre de la app en logger.js
  if grep -q "export const logger = new Logger" "$logger_file"; then
    # Si ya tiene una instancia exportada, actualizarla
    sed -i.bak "s/new Logger('[^']*'/new Logger('$project_name'/g" "$logger_file"
    rm -f "$logger_file.bak"
  else
    # Si no tiene instancia, agregar una al final antes del export
    if ! grep -q "export const logger" "$logger_file"; then
      cat >> "$logger_file" << EOF

// Create and export default logger instance for $project_name
export const logger = new Logger('$project_name', {
  logLevel: LOG_LEVELS.DEBUG, // Change to INFO in production
  enableColors: true,
  enableTimestamp: true,
  enableStack: false
});

// Maintain compatibility with window.logger for existing code
if (typeof window !== 'undefined') {
  window.logger = logger;
}
EOF
    fi
  fi
}

# Procesar argumentos
if [ $# -eq 0 ]; then
  # Sincronizar a todos los proyectos
  echo "🔄 Sincronizando componentes comunes a todos los proyectos..."
  echo ""
  
  for project in "${PROJECTS[@]}"; do
    sync_to_project "$project"
    customize_logger "$project"
    echo ""
  done
  
  echo "✨ Sincronización completada"
else
  # Sincronizar solo al proyecto especificado
  project=$1
  sync_to_project "$project"
  customize_logger "$project"
  echo "✨ Sincronización completada para $project"
fi
