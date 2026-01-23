#!/usr/bin/env python3
"""
Script para iniciar todos los proyectos NRD en puertos diferentes
Uso: python3 start-all.py [stop]
"""

import sys
import subprocess
import time
import signal
from pathlib import Path

# Directorio base
script_dir = Path(__file__).parent.resolve()
common_dir = script_dir.parent.parent
projects_dir = common_dir.parent
server_script = script_dir / "server.py"

# Lista de proyectos y sus puertos
PROJECTS = {
    "nrd-rrhh": 8006,
    "nrd-compras": 8007,
    "nrd-control-cajas": 8008,
    "nrd-costos": 8009,
    "nrd-flujo-caja": 8010,
    "nrd-pedidos": 8011,
    "nrd-portal": 8012,
    "nrd-productos": 8013,
}

# Procesos iniciados
processes = []

def start_project(project, port):
    """Iniciar un proyecto en un puerto específico"""
    project_path = projects_dir / project
    
    if not project_path.exists():
        print(f"⚠️  Proyecto {project} no encontrado, saltando...")
        return None
    
    print(f"🚀 Iniciando {project} en puerto {port}...")
    try:
        process = subprocess.Popen(
            [sys.executable, str(server_script), project, str(port)],
            cwd=project_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(1)
        if process.poll() is None:  # Proceso aún corriendo
            print(f"✅ {project} iniciado en http://localhost:{port}/{project}/")
            return process
        else:
            print(f"⚠️  {project} no pudo iniciarse")
            return None
    except Exception as e:
        print(f"❌ Error iniciando {project}: {e}")
        return None

def stop_all():
    """Detener todos los servidores"""
    print("🛑 Deteniendo todos los servidores...")
    for project, port in PROJECTS.items():
        try:
            # Buscar proceso por puerto usando lsof
            result = subprocess.run(
                ["lsof", "-ti", f":{port}"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    if pid:
                        try:
                            subprocess.run(["kill", pid], check=False)
                            print(f"   ✅ {project} (puerto {port}) detenido")
                        except Exception:
                            pass
        except Exception:
            # En Windows o si lsof no está disponible, intentar otra forma
            pass
    print("✨ Todos los servidores detenidos")

def signal_handler(sig, frame):
    """Manejar señal de interrupción"""
    print("\n🛑 Deteniendo todos los servidores...")
    stop_all()
    sys.exit(0)

def main():
    """Función principal"""
    # Registrar manejador de señales
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    if len(sys.argv) > 1 and sys.argv[1] == "stop":
        stop_all()
        return
    
    # Iniciar todos los proyectos
    print("🚀 Iniciando todos los proyectos NRD...")
    print("")
    
    for project, port in PROJECTS.items():
        process = start_project(project, port)
        if process:
            processes.append((project, port, process))
        time.sleep(0.5)
    
    print("")
    print("✨ Todos los proyectos iniciados:")
    print("")
    for project, port, _ in processes:
        print(f"   📦 {project}: http://localhost:{port}/{project}/")
    print("")
    print("Presiona Ctrl+C para detener todos los servidores")
    
    # Mantener el script corriendo
    try:
        while True:
            time.sleep(1)
            # Verificar que los procesos aún están corriendo
            for project, port, process in processes[:]:
                if process.poll() is not None:
                    print(f"⚠️  {project} se detuvo inesperadamente")
                    processes.remove((project, port, process))
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
