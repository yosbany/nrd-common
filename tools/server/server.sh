#!/bin/bash

# Script genérico para iniciar/detener servidor HTTP local para cualquier proyecto NRD
# Uso: ./server.sh [proyecto] [puerto]
# Ejemplo: ./server.sh nrd-rrhh 8006

# Obtener parámetros
PROJECT_NAME=${1:-""}
PORT=${2:-8006}

# Directorio base (nrd-system)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECTS_DIR="$(dirname "$COMMON_DIR")"

# Si no se especifica proyecto, mostrar menú
if [ -z "$PROJECT_NAME" ]; then
    # Intentar detectar el proyecto desde el directorio actual
    CURRENT_DIR="$(pwd)"
    if [[ "$CURRENT_DIR" == *"nrd-"* ]] && [[ "$(basename "$CURRENT_DIR")" == nrd-* ]]; then
        PROJECT_NAME=$(basename "$CURRENT_DIR")
    else
        # Mostrar menú de selección
        echo "📦 Selecciona un proyecto NRD:"
        echo ""
        
        # Detectar todos los proyectos disponibles
        PROJECTS=()
        INDEX=1
        declare -A PROJECT_MAP
        
        # Ordenar los proyectos alfabéticamente
        while IFS= read -r dir; do
            if [ -d "$dir" ]; then
                PROJECT_NAME_FOUND=$(basename "$dir")
                PROJECTS+=("$PROJECT_NAME_FOUND")
                PROJECT_MAP["$INDEX"]="$PROJECT_NAME_FOUND"
                echo "   $INDEX) $PROJECT_NAME_FOUND"
                ((INDEX++))
            fi
        done < <(find "$PROJECTS_DIR" -maxdepth 1 -type d -name "nrd-*" | sort)
        
        if [ $INDEX -eq 1 ]; then
            echo "❌ No se encontraron proyectos NRD en $PROJECTS_DIR"
            exit 1
        fi
        
        echo "   $INDEX) Abrir todos los proyectos"
        echo "   0) Cancelar"
        echo ""
        read -p "Selecciona una opción [1-$INDEX, 0 para cancelar]: " SELECTION
        
        if [ "$SELECTION" = "0" ] || [ -z "$SELECTION" ]; then
            echo "❌ Operación cancelada"
            exit 0
        elif [ "$SELECTION" = "$INDEX" ]; then
            # Abrir todos los proyectos
            echo ""
            echo "🚀 Abriendo todos los proyectos..."
            "$SCRIPT_DIR/start-all.sh"
            exit 0
        elif [ -n "${PROJECT_MAP[$SELECTION]}" ]; then
            PROJECT_NAME="${PROJECT_MAP[$SELECTION]}"
            echo ""
            echo "✅ Proyecto seleccionado: $PROJECT_NAME"
        else
            echo "❌ Opción inválida"
            exit 1
        fi
    fi
fi

# Verificar que se tiene un proyecto válido
if [ -z "$PROJECT_NAME" ]; then
    echo "❌ Error: No se especificó un proyecto válido"
    exit 1
fi

PROJECT_ROOT="$PROJECTS_DIR/$PROJECT_NAME"

# Verificar que el proyecto existe
if [ ! -d "$PROJECT_ROOT" ]; then
    echo "❌ Error: Proyecto '$PROJECT_NAME' no encontrado en $PROJECTS_DIR"
    exit 1
fi

# Función para verificar si el puerto está en uso
check_port() {
    lsof -ti:$PORT > /dev/null 2>&1
}

# Función para iniciar el servidor
start_server() {
    if check_port; then
        echo "⚠️  El servidor ya está corriendo en el puerto $PORT"
        echo "   Accede a: http://localhost:$PORT/$PROJECT_NAME/"
        return 1
    fi
    
    echo "🚀 Iniciando servidor HTTP para $PROJECT_NAME en el puerto $PORT..."
    echo "   Directorio base: $PROJECTS_DIR"
    echo "   Proyecto: $PROJECT_ROOT"
    
    # Actualizar versión antes de iniciar el servidor (si existe)
    UPDATE_VERSION_SCRIPT="$PROJECT_ROOT/tools/update-version/update-version.py"
    if [ -f "$UPDATE_VERSION_SCRIPT" ]; then
        echo "📝 Actualizando versión..."
        python3 "$UPDATE_VERSION_SCRIPT" "$PROJECT_NAME" 2>/dev/null || python3 "$UPDATE_VERSION_SCRIPT" 2>/dev/null || true
    fi
    
    # Ejecutar el servidor Python con el script que maneja el path del proyecto
    SERVER_SCRIPT="$SCRIPT_DIR/server.py"
    cd "$PROJECTS_DIR"
    python3 "$SERVER_SCRIPT" "$PROJECT_NAME" "$PORT" > /dev/null 2>&1 &
    SERVER_PID=$!
    echo "✅ Servidor iniciado (PID: $SERVER_PID)"
    echo "   Accede a: http://localhost:$PORT/$PROJECT_NAME/"
    echo "   Para detener: kill $SERVER_PID o ./server.sh stop $PROJECT_NAME $PORT"
    
    # Esperar un momento para que el servidor esté listo
    sleep 1
    
    # El navegador se abre desde server.py para evitar duplicados
    echo "🌐 El navegador se abrirá automáticamente..."
}

# Función para detener el servidor
stop_server() {
    if ! check_port; then
        echo "ℹ️  El servidor no está corriendo en el puerto $PORT"
        return 1
    fi
    
    # Buscar proceso por puerto
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ ! -z "$PID" ]; then
        kill $PID
        echo "🛑 Servidor detenido (PID: $PID)"
    else
        echo "ℹ️  No se encontró el proceso del servidor"
    fi
}

# Lógica principal
if [ "$1" = "stop" ]; then
    # Modo stop: ./server.sh stop [proyecto] [puerto]
    PROJECT_NAME=$2
    PORT=${3:-8006}
    if [ -z "$PROJECT_NAME" ]; then
        echo "❌ Error: Debes especificar el proyecto para detener"
        echo "Uso: ./server.sh stop [proyecto] [puerto]"
        exit 1
    fi
    PROJECT_ROOT="$PROJECTS_DIR/$PROJECT_NAME"
    if [ ! -d "$PROJECT_ROOT" ]; then
        echo "❌ Error: Proyecto '$PROJECT_NAME' no encontrado en $PROJECTS_DIR"
        exit 1
    fi
    stop_server
elif [ -n "$PROJECT_NAME" ] && check_port; then
    # Si se especificó un proyecto y el puerto está en uso, detener
    stop_server
elif [ -n "$PROJECT_NAME" ]; then
    # Si se especificó un proyecto, iniciar
    start_server
else
    # No se especificó proyecto, ya se mostró el menú arriba
    # Si llegamos aquí, el usuario canceló o seleccionó "abrir todos"
    exit 0
fi
