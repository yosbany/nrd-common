#!/bin/bash

# Script para iniciar/detener servidor HTTP local para todos los proyectos NRD
# Funciona como toggle: si está corriendo, lo detiene; si no está corriendo, lo inicia
# Uso: ./server.sh [puerto]
# Ejemplo: ./server.sh 80

# Directorio base (nrd-system)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECTS_DIR="$(dirname "$COMMON_DIR")"

# Verificar si el primer argumento es "stop"
if [ "$1" = "stop" ]; then
    # Modo stop: detener servidor en puerto especificado o buscar en todos los puertos comunes
    STOP_PORT=${2:-""}
    if [ -z "$STOP_PORT" ]; then
        # Buscar en puertos comunes
        for port in 80 8006 8007 8008 8009 8010 8011 8012 8013; do
            if lsof -ti:$port > /dev/null 2>&1; then
                PID=$(lsof -ti:$port 2>/dev/null)
                if [ ! -z "$PID" ]; then
                    echo "🛑 Deteniendo servidor en puerto $port (PID: $PID)..."
                    kill $PID 2>/dev/null
                    sleep 0.5
                    if lsof -ti:$port > /dev/null 2>&1; then
                        kill -9 $PID 2>/dev/null
                        sleep 0.5
                    fi
                    if ! lsof -ti:$port > /dev/null 2>&1; then
                        echo "✅ Servidor detenido en puerto $port"
                    fi
                fi
            fi
        done
        exit 0
    else
        PORT=$STOP_PORT
        # Continuar con la lógica de stop_server más abajo
    fi
else
    # Obtener puerto (por defecto 80)
    PORT=${1:-80}
fi

# Función para verificar si el puerto está en uso
check_port() {
    lsof -ti:$PORT > /dev/null 2>&1
}

# Función para detener el servidor
stop_server() {
    if ! check_port; then
        echo "ℹ️  El servidor no está corriendo en el puerto $PORT"
        return 0  # No es un error si no está corriendo
    fi
    
    # Buscar proceso por puerto
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "🛑 Deteniendo servidor (PID: $PID)..."
        kill $PID 2>/dev/null
        # Esperar a que el proceso termine
        sleep 1
        # Verificar si aún está corriendo y forzar kill si es necesario
        if check_port; then
            echo "   Forzando detención del proceso..."
            kill -9 $PID 2>/dev/null
            sleep 1
        fi
        if check_port; then
            echo "⚠️  No se pudo detener el servidor completamente"
            return 1
        else
            echo "✅ Servidor detenido"
            return 0
        fi
    else
        echo "ℹ️  No se encontró el proceso del servidor en el puerto $PORT"
        return 1
    fi
}

# Función para iniciar el servidor
start_server() {
    # Si el puerto está en uso, detener el servidor anterior primero
    if check_port; then
        echo "⚠️  El puerto $PORT ya está en uso, deteniendo servidor anterior..."
        # Usar la función stop_server que ya existe
        if ! stop_server; then
            echo "❌ Error: No se pudo detener el servidor anterior"
            return 1
        fi
        # Esperar un momento adicional para asegurar que el puerto se libere
        sleep 2
        # Verificar nuevamente
        if check_port; then
            echo "❌ Error: El puerto $PORT aún está en uso después de detener el servidor"
            echo "   Intenta detener manualmente: ./server.sh stop $PORT"
            return 1
        fi
        echo "✅ Puerto $PORT liberado, continuando con el inicio..."
    fi
    
    echo "🚀 Iniciando servidor HTTP para todos los proyectos NRD en el puerto $PORT..."
    echo "   Directorio base: $PROJECTS_DIR"
    
    # Actualizar versión de todos los proyectos antes de iniciar (si existe)
    echo "📝 Actualizando versiones de proyectos..."
    for project_dir in "$PROJECTS_DIR"/nrd-*; do
        if [ -d "$project_dir" ] && [ -f "$project_dir/index.html" ]; then
            project_name=$(basename "$project_dir")
            UPDATE_VERSION_SCRIPT="$project_dir/tools/update-version/update-version.py"
            if [ -f "$UPDATE_VERSION_SCRIPT" ]; then
                python3 "$UPDATE_VERSION_SCRIPT" "$project_name" 2>/dev/null || python3 "$UPDATE_VERSION_SCRIPT" 2>/dev/null || true
            fi
        fi
    done
    
    # Ejecutar el servidor Python
    SERVER_SCRIPT="$SCRIPT_DIR/server.py"
    cd "$PROJECTS_DIR"
    
    # Intentar iniciar el servidor y capturar errores
    python3 "$SERVER_SCRIPT" "$PORT" > /tmp/nrd-server.log 2>&1 &
    SERVER_PID=$!
    
    # Esperar un momento para verificar que el servidor se inició correctamente
    sleep 2
    
    # Verificar si el proceso sigue corriendo
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        if check_port; then
        echo "✅ Servidor iniciado (PID: $SERVER_PID)"
        echo "   Accede a: http://localhost:$PORT/"
        echo "   Proyectos disponibles:"
        
        # Listar proyectos disponibles
        for project_dir in "$PROJECTS_DIR"/nrd-*; do
            if [ -d "$project_dir" ] && [ -f "$project_dir/index.html" ]; then
                project_name=$(basename "$project_dir")
                echo "      - http://localhost:$PORT/$project_name/"
            fi
        done
        
            echo "   Para detener: ejecuta este script nuevamente"
        else
            echo "❌ Error: El servidor se inició pero el puerto $PORT no está en uso"
            echo "   Revisa los logs: /tmp/nrd-server.log"
            kill $SERVER_PID 2>/dev/null
            return 1
        fi
    else
        echo "❌ Error: No se pudo iniciar el servidor"
        echo "   Revisa los logs: /tmp/nrd-server.log"
        if [ -f /tmp/nrd-server.log ]; then
            echo "   Últimas líneas del log:"
            tail -5 /tmp/nrd-server.log | sed 's/^/      /'
        fi
        return 1
    fi
}

# Lógica principal: toggle (solo si no se pasó "stop" como argumento)
if [ "$1" = "stop" ]; then
    # Si ya se manejó "stop" sin puerto, ya se salió arriba
    # Si llegamos aquí, es porque hay un puerto específico
    if [ -n "$2" ]; then
        # Modo stop con puerto específico
        PORT=$2
        stop_server
    fi
    # Si no hay segundo argumento, ya se manejó arriba y se salió
elif [ -z "$1" ] || [[ "$1" =~ ^[0-9]+$ ]]; then
    # Modo toggle normal (sin argumentos o con número de puerto)
    # Verificar si el puerto está en uso
    if check_port; then
        # Servidor está corriendo, detenerlo
        echo "🛑 Servidor detectado en puerto $PORT, deteniendo..."
        stop_server
        if [ $? -eq 0 ]; then
            echo "✅ Servidor detenido exitosamente"
        fi
    else
        # Servidor no está corriendo, iniciarlo (siempre con actualización de versiones)
        start_server
    fi
else
    echo "❌ Error: Argumento inválido '$1'"
    echo "   Uso: ./server.sh [puerto]"
    echo "   Ejemplo: ./server.sh 80"
    echo "   Para detener: ./server.sh stop [puerto]"
    exit 1
fi
