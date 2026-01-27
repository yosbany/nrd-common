#!/usr/bin/env python3
"""
Servidor HTTP genérico para proyectos NRD
Sirve todos los proyectos en el mismo puerto con context paths diferentes
Uso: python3 server.py [puerto]
Ejemplo: python3 server.py 80
Accede a: http://localhost/nrd-rrhh/, http://localhost/nrd-compras/, etc.
"""

import sys
import os
import http.server
import socketserver
import subprocess
from pathlib import Path
from urllib.parse import unquote

# Directorio base
script_dir = Path(__file__).parent.resolve()
common_dir = script_dir.parent.parent
projects_dir = common_dir.parent

# Obtener puerto
port = int(sys.argv[1]) if len(sys.argv) > 1 else 80

# Detectar todos los proyectos disponibles
projects = []
for project_dir in sorted(projects_dir.glob("nrd-*")):
    if project_dir.is_dir() and (project_dir / "index.html").exists():
        projects.append(project_dir.name)

if not projects:
    print("❌ No se encontraron proyectos NRD con index.html")
    sys.exit(1)

# Actualizar versión de todos los proyectos antes de iniciar
print("📝 Actualizando versiones de proyectos...")
for project_name in projects:
    project_root = projects_dir / project_name
    update_version_script = project_root / "tools" / "update-version" / "update-version.py"
    if update_version_script.exists():
        try:
            subprocess.run([sys.executable, str(update_version_script), project_name], 
                          cwd=project_root, check=False, capture_output=True)
        except Exception:
            try:
                subprocess.run([sys.executable, str(update_version_script)], 
                              cwd=project_root, check=False, capture_output=True)
            except Exception:
                pass

# Handler personalizado que sirve múltiples proyectos
class MultiProjectHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, projects_dir=None, projects=None, **kwargs):
        self.projects_dir = projects_dir
        self.projects = projects
        super().__init__(*args, **kwargs)
    
    def translate_path(self, path):
        # Remover query string y fragment
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        path = unquote(path)
        
        # Buscar si el path comienza con algún nombre de proyecto (incluyendo nrd-common y nrd-data-access)
        for project_name in self.projects:
            if path.startswith(f'/{project_name}/'):
                # Remover el prefijo del proyecto
                relative_path = path[len(f'/{project_name}/'):]
                if not relative_path:
                    relative_path = 'index.html'
                project_root = self.projects_dir / project_name
                full_path = project_root / relative_path
                return str(full_path.resolve())
            elif path == f'/{project_name}' or path == f'/{project_name}/':
                project_root = self.projects_dir / project_name
                return str((project_root / 'index.html').resolve())
        
        # Si el path comienza con /nrd-common/dist/ o /nrd-data-access/dist/, servir desde la raíz del servidor
        # (para los archivos compilados de las librerías)
        if path.startswith('/nrd-common/dist/') or path.startswith('/nrd-data-access/dist/'):
            full_path = Path.cwd() / path.lstrip('/')
            return str(full_path.resolve())
        
        # Si el path es solo /, mostrar lista de proyectos
        if path == '/' or path == '':
            return None  # Se manejará en do_GET
        
        # Para cualquier otro path, intentar servirlo desde el primer proyecto (fallback)
        if not path.startswith('/'):
            path = '/' + path
        project_root = self.projects_dir / self.projects[0]
        full_path = project_root / path.lstrip('/')
        return str(full_path.resolve())
    
    def do_GET(self):
        # Si el path es /, mostrar lista de proyectos
        if self.path == '/' or self.path == '':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NRD System - Proyectos</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #dc2626;
            font-weight: 300;
            margin-bottom: 30px;
        }
        .projects {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        .project {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-decoration: none;
            color: #333;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .project:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .project-name {
            font-weight: 500;
            margin-bottom: 5px;
        }
        .project-path {
            font-size: 0.85em;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>NRD System - Proyectos Disponibles</h1>
    <div class="projects">
'''
            for project in self.projects:
                html += f'''        <a href="/{project}/" class="project">
            <div class="project-name">{project}</div>
            <div class="project-path">/{project}/</div>
        </a>
'''
            html += '''    </div>
</body>
</html>'''
            self.wfile.write(html.encode('utf-8'))
            return
        
        # Llamar al método padre para manejar otros paths
        super().do_GET()
    
    def end_headers(self):
        # Headers para evitar cache en desarrollo
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

# Cambiar al directorio padre (projects_dir) para servir desde ahí
os.chdir(projects_dir)

# Crear handler con todos los proyectos
def handler_factory(projects_dir, projects):
    def create_handler(*args, **kwargs):
        return MultiProjectHTTPRequestHandler(*args, projects_dir=projects_dir, projects=projects, **kwargs)
    return create_handler

Handler = handler_factory(projects_dir, projects)

try:
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"🚀 Servidor HTTP iniciado para todos los proyectos NRD")
        print(f"   Directorio base: {projects_dir}")
        print(f"   Puerto: {port}")
        print(f"   Proyectos disponibles:")
        for project in projects:
            print(f"      - http://localhost:{port}/{project}/")
        print(f"   Página principal: http://localhost:{port}/")
        print(f"   Presiona Ctrl+C para detener")
        
        # Iniciar servidor
        httpd.serve_forever()
except PermissionError as e:
    if port < 1024:
        print(f"❌ Error: Se requieren permisos de administrador para usar el puerto {port}")
        print(f"   Ejecuta con sudo: sudo ./server.sh {port}")
        print(f"   O usa un puerto mayor a 1024: ./server.sh 8006")
    else:
        print(f"❌ Error de permisos: {e}")
    sys.exit(1)
except OSError as e:
    if "Address already in use" in str(e):
        print(f"⚠️  El puerto {port} ya está en uso")
        print(f"   Accede a: http://localhost:{port}/")
    elif "Permission denied" in str(e) or "Operation not permitted" in str(e):
        print(f"❌ Error: Se requieren permisos de administrador para usar el puerto {port}")
        print(f"   Ejecuta con sudo: sudo ./server.sh {port}")
        print(f"   O usa un puerto mayor a 1024: ./server.sh 8006")
    else:
        print(f"❌ Error: {e}")
    sys.exit(1)
except KeyboardInterrupt:
    print("\n🛑 Servidor detenido")
    sys.exit(0)
except Exception as e:
    print(f"❌ Error inesperado: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
