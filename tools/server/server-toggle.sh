#!/bin/bash

# Script para reiniciar el servidor HTTP local de todos los proyectos NRD.
# Si el puerto está en uso, lo libera y luego inicia el servidor.
# Uso: ./server-toggle.sh [puerto]
# Ejemplo: ./server-toggle.sh
# Ejemplo: ./server-toggle.sh 8006

# Directorio base (nrd-system)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECTS_DIR="$(dirname "$COMMON_DIR")"

# Puerto: único argumento opcional, debe ser número
PORT=80
if [ -n "$1" ]; then
    if [[ ! "$1" =~ ^[0-9]+$ ]]; then
        echo "❌ Error: El puerto debe ser un número"
        echo "   Uso: ./server-toggle.sh [puerto]"
        echo "   Ejemplo: ./server-toggle.sh 8006"
        exit 1
    fi
    PORT=$1
fi

# Función para verificar si el puerto está en uso
check_port() {
    lsof -ti:$PORT > /dev/null 2>&1
}

# Liberar el puerto: matar todos los procesos que lo usen
free_port() {
    if ! check_port; then
        return 0
    fi
    echo "🛑 Liberando puerto $PORT..."
    PIDS=$(lsof -ti:$PORT 2>/dev/null)
    for pid in $PIDS; do
        kill $pid 2>/dev/null
    done
    sleep 1
    if check_port; then
        for pid in $(lsof -ti:$PORT 2>/dev/null); do
            kill -9 $pid 2>/dev/null
        done
        sleep 1
    fi
    # Esperar a que el puerto esté libre (máximo ~10 s)
    for i in 1 2 3 4 5 6 7 8 9 10; do
        if ! check_port; then
            echo "✅ Puerto $PORT libre"
            return 0
        fi
        sleep 1
    done
    echo "❌ Error: No se pudo liberar el puerto $PORT"
    return 1
}

# 1) Liberar puerto primero
if ! free_port; then
    exit 1
fi

echo "🚀 Iniciando servidor HTTP para todos los proyectos NRD en el puerto $PORT..."
echo "   Directorio base: $PROJECTS_DIR"

# 2) Actualizar versiones de proyectos
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

# 3) Comprobar de nuevo que el puerto siga libre (por si algo lo tomó durante update-version)
if check_port; then
    echo "⚠️  El puerto $PORT se ocupó durante la actualización, liberando de nuevo..."
    if ! free_port; then
        exit 1
    fi
fi

# 4) Iniciar el servidor Python
SERVER_SCRIPT="$SCRIPT_DIR/nrd-system-server.py"
cd "$PROJECTS_DIR"
python3 "$SERVER_SCRIPT" "$PORT" > /tmp/nrd-server.log 2>&1 &
SERVER_PID=$!
sleep 2

if ! ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "❌ Error: No se pudo iniciar el servidor"
    echo "   Revisa los logs: /tmp/nrd-server.log"
    if [ -f /tmp/nrd-server.log ]; then
        echo "   Últimas líneas del log:"
        tail -10 /tmp/nrd-server.log | sed 's/^/      /'
    fi
    exit 1
fi

if ! check_port; then
    echo "❌ Error: El servidor se inició pero el puerto $PORT no está en uso"
    echo "   Revisa los logs: /tmp/nrd-server.log"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ Servidor iniciado (PID: $SERVER_PID)"
echo "   Accede a: http://localhost:$PORT/"
echo "   Proyectos disponibles:"
for project_dir in "$PROJECTS_DIR"/nrd-*; do
    if [ -d "$project_dir" ] && [ -f "$project_dir/index.html" ]; then
        project_name=$(basename "$project_dir")
        echo "      - http://localhost:$PORT/$project_name/"
    fi
done
