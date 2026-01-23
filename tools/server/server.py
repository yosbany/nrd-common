#!/usr/bin/env python3
"""
Servidor HTTP genérico para proyectos NRD
Sirve desde el directorio padre con el nombre del proyecto en el path
Uso: python3 server.py [proyecto] [puerto]
Ejemplo: python3 server.py nrd-rrhh 8006
Accede a: http://localhost:8006/nrd-rrhh/
"""

import sys
import os
import http.server
import socketserver
import webbrowser
import subprocess
import platform
from pathlib import Path
from urllib.parse import unquote

# Directorio base
script_dir = Path(__file__).parent.resolve()
common_dir = script_dir.parent.parent
projects_dir = common_dir.parent

# Obtener parámetros
project_name = sys.argv[1] if len(sys.argv) > 1 else None
port = int(sys.argv[2]) if len(sys.argv) > 2 else 8006

# Si no se especifica proyecto, mostrar menú
if not project_name:
    current_dir = Path.cwd()
    if 'nrd-' in str(current_dir):
        project_name = current_dir.name
    else:
        # Mostrar menú de selección
        print("📦 Selecciona un proyecto NRD:")
        print()
        
        # Detectar todos los proyectos disponibles
        projects = []
        project_map = {}
        index = 1
        
        for project_dir in sorted(projects_dir.glob("nrd-*")):
            if project_dir.is_dir():
                projects.append(project_dir.name)
                project_map[str(index)] = project_dir.name
                print(f"   {index}) {project_dir.name}")
                index += 1
        
        print(f"   {index}) Abrir todos los proyectos")
        print("   0) Cancelar")
        print()
        
        try:
            selection = input(f"Selecciona una opción [1-{index}, 0 para cancelar]: ").strip()
            
            if selection == "0" or not selection:
                print("❌ Operación cancelada")
                sys.exit(0)
            elif selection == str(index):
                # Abrir todos los proyectos
                print()
                print("🚀 Abriendo todos los proyectos...")
                start_all_script = script_dir / "start-all.py"
                if start_all_script.exists():
                    subprocess.run([sys.executable, str(start_all_script)])
                else:
                    print("❌ Script start-all.py no encontrado")
                sys.exit(0)
            elif selection in project_map:
                project_name = project_map[selection]
                print()
                print(f"✅ Proyecto seleccionado: {project_name}")
            else:
                print("❌ Opción inválida")
                sys.exit(1)
        except (KeyboardInterrupt, EOFError):
            print()
            print("❌ Operación cancelada")
            sys.exit(0)

project_root = projects_dir / project_name

# Verificar que el proyecto existe
if not project_root.exists():
    print(f"❌ Error: Proyecto '{project_name}' no encontrado en {projects_dir}")
    sys.exit(1)

# Actualizar versión antes de iniciar (si existe)
update_version_script = project_root / "tools" / "update-version" / "update-version.py"
if update_version_script.exists():
    print("📝 Actualizando versión...")
    try:
        subprocess.run([sys.executable, str(update_version_script), project_name], 
                      cwd=project_root, check=False, capture_output=True)
    except Exception:
        try:
            subprocess.run([sys.executable, str(update_version_script)], 
                          cwd=project_root, check=False, capture_output=True)
        except Exception:
            pass

# Handler personalizado que sirve desde un subdirectorio
class ProjectHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, project_path=None, **kwargs):
        self.project_path = project_path
        super().__init__(*args, **kwargs)
    
    def translate_path(self, path):
        # Remover query string y fragment
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        path = unquote(path)
        
        # Si el path comienza con /{project_name}/, servir desde el proyecto
        if path.startswith(f'/{self.project_path.name}/'):
            # Remover el prefijo del proyecto
            relative_path = path[len(f'/{self.project_path.name}/'):]
            if not relative_path:
                relative_path = 'index.html'
            full_path = self.project_path / relative_path
            return str(full_path.resolve())
        
        # Si el path es solo /{project_name} o /{project_name}/, redirigir a index.html
        if path == f'/{self.project_path.name}' or path == f'/{self.project_path.name}/':
            return str((self.project_path / 'index.html').resolve())
        
        # Si el path es solo /, redirigir a /{project_name}/
        if path == '/':
            self.send_response(301)
            self.send_header('Location', f'/{self.project_path.name}/')
            self.end_headers()
            return None
        
        # Para cualquier otro path, servir desde el proyecto
        if not path.startswith('/'):
            path = '/' + path
        full_path = self.project_path / path.lstrip('/')
        return str(full_path.resolve())
    
    def end_headers(self):
        # Headers para evitar cache en desarrollo
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

# Cambiar al directorio padre (projects_dir) para servir desde ahí
os.chdir(projects_dir)

# Crear handler con el path del proyecto
def handler_factory(project_path):
    def create_handler(*args, **kwargs):
        return ProjectHTTPRequestHandler(*args, project_path=project_path, **kwargs)
    return create_handler

def open_or_refresh_browser(url):
    """Abre el navegador o refresca la pestaña si ya existe una con esa URL - Prioriza Chrome"""
    system = platform.system()
    
    if system == "Darwin":  # macOS
        # Intentar usar AppleScript para verificar y refrescar pestañas en Chrome (navegador principal)
        try:
            # Primero intentar con Chrome (preferido)
            script = f'''
            tell application "Google Chrome"
                activate
                set found to false
                repeat with w in windows
                    repeat with t in tabs of w
                        if URL of t contains "{url}" then
                            set found to true
                            set active tab index of w to index of t
                            tell t to reload
                            exit repeat
                        end if
                    end repeat
                    if found then exit repeat
                end repeat
                if not found then
                    open location "{url}"
                end if
            end tell
            '''
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            pass
        
        # Si AppleScript falla, intentar abrir Chrome directamente
        try:
            subprocess.run(['open', '-a', 'Google Chrome', url], 
                         check=False, timeout=3)
            return
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            pass
        
        # Si Chrome no está disponible, intentar con Safari como fallback
        try:
            script = f'''
            tell application "Safari"
                activate
                set found to false
                repeat with w in windows
                    repeat with t in tabs of w
                        if URL of t contains "{url}" then
                            set found to true
                            set current tab of w to t
                            tell t to do JavaScript "location.reload()"
                            exit repeat
                        end if
                    end repeat
                    if found then exit repeat
                end repeat
                if not found then
                    open location "{url}"
                end if
            end tell
            '''
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            pass
        
        # Si ambos fallan, usar webbrowser estándar (pero intentar forzar Chrome primero)
        try:
            subprocess.run(['open', '-a', 'Google Chrome', url], 
                         check=False, timeout=3)
        except:
            webbrowser.open(url)
    
    elif system == "Linux":
        # En Linux, intentar con xdg-open (puede abrir en navegador predeterminado)
        # No hay forma fácil de verificar pestañas existentes, así que solo abrimos
        try:
            subprocess.Popen(['xdg-open', url], 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
        except FileNotFoundError:
            webbrowser.open(url)
    
    elif system == "Windows":
        # En Windows, usar webbrowser estándar
        webbrowser.open(url)
    
    else:
        # Sistema desconocido, usar webbrowser estándar
        webbrowser.open(url)

Handler = handler_factory(project_root)

try:
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"🚀 Servidor HTTP iniciado para {project_name}")
        print(f"   Directorio base: {projects_dir}")
        print(f"   Proyecto: {project_root}")
        print(f"   Puerto: {port}")
        print(f"   Accede a: http://localhost:{port}/{project_name}/")
        print(f"   Presiona Ctrl+C para detener")
        
        # Abrir navegador o refrescar pestaña existente
        try:
            open_or_refresh_browser(f"http://localhost:{port}/{project_name}/")
        except Exception as e:
            print(f"   (Abre manualmente: http://localhost:{port}/{project_name}/)")
            print(f"   Error: {e}")
        
        # Iniciar servidor
        httpd.serve_forever()
except OSError as e:
    if "Address already in use" in str(e):
        print(f"⚠️  El puerto {port} ya está en uso")
        print(f"   Accede a: http://localhost:{port}/{project_name}/")
    else:
        print(f"❌ Error: {e}")
    sys.exit(1)
except KeyboardInterrupt:
    print("\n🛑 Servidor detenido")
    sys.exit(0)
