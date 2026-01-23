#!/bin/bash

# Script para iniciar todos los proyectos NRD en puertos diferentes
# Uso: ./start-all.sh

# Directorio base
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECTS_DIR="$(dirname "$COMMON_DIR")"
SERVER_SCRIPT="$SCRIPT_DIR/server.sh"

# Lista de proyectos y sus puertos
declare -A PROJECTS=(
    ["nrd-rrhh"]="8006"
    ["nrd-compras"]="8007"
    ["nrd-control-cajas"]="8008"
    ["nrd-costos"]="8009"
    ["nrd-flujo-caja"]="8010"
    ["nrd-pedidos"]="8011"
    ["nrd-portal"]="8012"
    ["nrd-productos"]="8013"
)

# Función para iniciar un proyecto
start_project() {
    local project=$1
    local port=$2
    local project_path="$PROJECTS_DIR/$project"
    
    if [ ! -d "$project_path" ]; then
        echo "⚠️  Proyecto $project no encontrado, saltando..."
        return 1
    fi
    
    echo "🚀 Iniciando $project en puerto $port..."
    bash "$SERVER_SCRIPT" "$project" "$port" > /dev/null 2>&1 &
    sleep 1
    echo "✅ $project iniciado en http://localhost:$port/$project/"
}

# Función para detener todos los servidores
stop_all() {
    echo "🛑 Deteniendo todos los servidores..."
    for project in "${!PROJECTS[@]}"; do
        port="${PROJECTS[$project]}"
        PID=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$PID" ]; then
            kill $PID 2>/dev/null
            echo "   ✅ $project (puerto $port) detenido"
        fi
    done
    echo "✨ Todos los servidores detenidos"
}

# Verificar si se quiere detener todos
if [ "$1" = "stop" ]; then
    stop_all
    exit 0
fi

# Iniciar todos los proyectos
echo "🚀 Iniciando todos los proyectos NRD..."
echo ""

for project in "${!PROJECTS[@]}"; do
    port="${PROJECTS[$project]}"
    start_project "$project" "$port"
done

echo ""
echo "✨ Todos los proyectos iniciados:"
echo ""
for project in "${!PROJECTS[@]}"; do
    port="${PROJECTS[$project]}"
    echo "   📦 $project: http://localhost:$port/$project/"
done
echo ""
echo "Para detener todos: ./start-all.sh stop"
