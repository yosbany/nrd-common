#!/bin/bash

# Wrapper que llama a server-toggle.sh para reiniciar el servidor NRD.
# Uso: ./restart.sh [puerto]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/server-toggle.sh" "$@"
