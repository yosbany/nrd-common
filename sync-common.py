#!/usr/bin/env python3
"""
Script para sincronizar componentes comunes desde nrd-common a todos los proyectos NRD
Uso: python3 sync-common.py [proyecto]
Si no se especifica proyecto, sincroniza a todos los proyectos
"""

import os
import sys
import shutil
import re
from pathlib import Path

# Directorio base
BASE_DIR = Path(__file__).parent.resolve()
COMMON_DIR = BASE_DIR
PROJECTS_DIR = BASE_DIR.parent

# Lista de proyectos NRD
PROJECTS = [
    "nrd-rrhh",
    "nrd-compras",
    "nrd-control-cajas",
    "nrd-costos",
    "nrd-flujo-caja",
    "nrd-pedidos",
    "nrd-portal",
    "nrd-productos",
]

# Mapeo de nombres de proyectos a nombres de display
PROJECT_NAMES = {
    "nrd-rrhh": "NRD RRHH",
    "nrd-compras": "NRD Compras",
    "nrd-control-cajas": "NRD Control Cajas",
    "nrd-costos": "NRD Costos",
    "nrd-flujo-caja": "NRD Flujo Caja",
    "nrd-pedidos": "NRD Pedidos",
    "nrd-portal": "NRD Portal",
    "nrd-productos": "NRD Productos",
}

def sync_to_project(project):
    """Sincronizar componentes comunes a un proyecto"""
    project_path = PROJECTS_DIR / project
    
    if not project_path.exists():
        print(f"⚠️  Proyecto {project} no encontrado, saltando...")
        return False
    
    print(f"📦 Sincronizando componentes comunes a {project}...")
    
    # Crear estructura de directorios
    (project_path / "common" / "modules" / "core").mkdir(parents=True, exist_ok=True)
    (project_path / "common" / "modules" / "ui").mkdir(parents=True, exist_ok=True)
    (project_path / "common" / "modules" / "utils").mkdir(parents=True, exist_ok=True)
    (project_path / "common" / "modules" / "services").mkdir(parents=True, exist_ok=True)
    
    # Copiar módulos core
    print("  → Copiando módulos core...")
    core_files = ["logger.js", "config.js", "app-init.js", "index.js"]
    for file in core_files:
        src = COMMON_DIR / "modules" / "core" / file
        dst = project_path / "common" / "modules" / "core" / file
        if src.exists():
            shutil.copy2(src, dst)
    
    # Copiar módulos UI
    print("  → Copiando módulos UI...")
    ui_files = ["modal.js", "spinner.js", "index.js"]
    for file in ui_files:
        src = COMMON_DIR / "modules" / "ui" / file
        dst = project_path / "common" / "modules" / "ui" / file
        if src.exists():
            shutil.copy2(src, dst)
    
    # Copiar módulos utils
    print("  → Copiando módulos utils...")
    utils_files = ["format.js", "dom.js", "date.js", "index.js"]
    for file in utils_files:
        src = COMMON_DIR / "modules" / "utils" / file
        dst = project_path / "common" / "modules" / "utils" / file
        if src.exists():
            shutil.copy2(src, dst)
    
    # Copiar módulos services
    print("  → Copiando módulos services...")
    services_files = ["auth.js", "navigation.js", "data-loader.js", "index.js"]
    for file in services_files:
        src = COMMON_DIR / "modules" / "services" / file
        dst = project_path / "common" / "modules" / "services" / file
        if src.exists():
            shutil.copy2(src, dst)
    
    # Copiar README si existe
    readme_src = COMMON_DIR / "README.md"
    readme_dst = project_path / "common" / "README.md"
    if readme_src.exists():
        shutil.copy2(readme_src, readme_dst)
    
    # Copiar herramientas comunes
    print("  → Copiando herramientas comunes...")
    tools_src = COMMON_DIR / "tools"
    tools_dst = project_path / "tools"
    if tools_src.exists():
        if tools_dst.exists():
            shutil.rmtree(tools_dst)
        shutil.copytree(tools_src, tools_dst)
    
    # Copiar service worker genérico
    print("  → Copiando service worker...")
    sw_src = COMMON_DIR / "service-worker.js"
    sw_dst = project_path / "service-worker.js"
    if sw_src.exists():
        shutil.copy2(sw_src, sw_dst)
    
    # Personalizar logger
    customize_logger(project, project_path)
    
    print(f"✅ {project} sincronizado correctamente")
    return True

def customize_logger(project, project_path):
    """Personalizar logger según el proyecto"""
    logger_file = project_path / "common" / "modules" / "core" / "logger.js"
    
    if not logger_file.exists():
        return
    
    # Obtener nombre del proyecto
    project_name = PROJECT_NAMES.get(project, f"NRD {project.replace('nrd-', '').replace('-', ' ').title()}")
    
    # Leer contenido
    content = logger_file.read_text(encoding='utf-8')
    
    # Buscar y reemplazar instancia de logger existente
    pattern = r"export const logger = new Logger\('[^']*'"
    replacement = f"export const logger = new Logger('{project_name}'"
    
    if re.search(pattern, content):
        # Reemplazar instancia existente
        content = re.sub(pattern, replacement, content)
    else:
        # Agregar instancia si no existe
        if "export const logger" not in content:
            logger_export = f"""
// Create and export default logger instance for {project_name}
export const logger = new Logger('{project_name}', {{
  logLevel: LOG_LEVELS.DEBUG, // Change to INFO in production
  enableColors: true,
  enableTimestamp: true,
  enableStack: false
}});

// Maintain compatibility with window.logger for existing code
if (typeof window !== 'undefined') {{
  window.logger = logger;
}}
"""
            # Insertar antes del último export o al final
            if "export { LOG_LEVELS, LOG_COLORS };" in content:
                content = content.replace(
                    "export { LOG_LEVELS, LOG_COLORS };",
                    f"export {{ LOG_LEVELS, LOG_COLORS }};{logger_export}"
                )
            else:
                content += logger_export
    
    # Escribir contenido actualizado
    logger_file.write_text(content, encoding='utf-8')
    print(f"  → Logger personalizado para {project_name}")

def main():
    """Función principal"""
    if len(sys.argv) > 1:
        # Sincronizar solo al proyecto especificado
        project = sys.argv[1]
        if project in PROJECTS:
            sync_to_project(project)
            print(f"\n✨ Sincronización completada para {project}")
        else:
            print(f"❌ Proyecto '{project}' no encontrado en la lista de proyectos")
            print(f"Proyectos disponibles: {', '.join(PROJECTS)}")
            sys.exit(1)
    else:
        # Sincronizar a todos los proyectos
        print("🔄 Sincronizando componentes comunes a todos los proyectos...")
        print()
        
        success_count = 0
        for project in PROJECTS:
            if sync_to_project(project):
                success_count += 1
            print()
        
        print(f"✨ Sincronización completada ({success_count}/{len(PROJECTS)} proyectos)")

if __name__ == "__main__":
    main()
