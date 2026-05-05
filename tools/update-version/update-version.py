#!/usr/bin/env python3
"""
Actualiza los parámetros de versión en index.html para cache busting
Uso: python3 update-version.py [proyecto]
"""

import re
import sys
from pathlib import Path
from datetime import datetime

def update_version(project_name=None):
    # Generate timestamp version
    version = int(datetime.now().timestamp() * 1000)
    
    script_dir = Path(__file__).parent.resolve()
    common_dir = script_dir.parent.parent.resolve()
    projects_dir = common_dir.parent
    
    # Si se especifica proyecto, usar ese; si no, detectar desde el directorio actual
    if project_name:
        project_root = projects_dir / project_name
    else:
        # Intentar detectar desde el directorio actual
        current_dir = Path.cwd()
        if 'nrd-' in str(current_dir):
            # Estamos en un proyecto, usar ese
            project_root = current_dir
        else:
            print("❌ Error: No se especificó el proyecto y no se puede detectar automáticamente")
            print("   Uso: python3 update-version.py [proyecto]")
            print("   Ejemplo: python3 update-version.py nrd-rrhh")
            return
    
    html_path = project_root / 'index.html'
    
    if not html_path.exists():
        print(f"❌ Error: {html_path} no encontrado")
        return
    
    # Read index.html
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Remove existing version parameters from local files
    # Keep version parameters for external CDN URLs
    html = re.sub(r'(\?v=\d+)(?=["\']|$)', '', html)
    
    # Add version parameter to CSS files (local only)
    # Match both styles.css and assets/styles/styles.css
    html = re.sub(
        r'(<link[^>]*href=["\'])([^"\']*styles\.css)(["\'][^>]*>)',
        lambda m: f'{m.group(1)}{m.group(2)}?v={version}{m.group(3)}' if '?v=' not in m.group(2) else m.group(0),
        html
    )
    
    # Add version parameter to local JS files
    # Match script tags with src pointing to local files (not http:// or https://)
    html = re.sub(
        r'(<script[^>]*src=["\'])((?!https?://)[^"\']+\.js)(["\'][^>]*>)',
        lambda m: f'{m.group(1)}{m.group(2)}?v={version}{m.group(3)}' if '?v=' not in m.group(2) else m.group(0),
        html
    )
    
    # Add version parameter to service worker
    html = re.sub(
        r'(serviceWorker\.register\(["\'])([^"\']*service-worker\.js)(["\'])',
        rf'\1\2?v={version}\3',
        html
    )
    
    # Write back
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    # Write version.json so the client can validate against server (avoid stale cache)
    import json
    version_path = project_root / 'version.json'
    with open(version_path, 'w', encoding='utf-8') as f:
        json.dump({'v': version}, f)
    
    print(f"✅ Version updated to: {version}")
    print(f"📝 Updated {html_path} with cache busting parameters")

if __name__ == "__main__":
    project_name = sys.argv[1] if len(sys.argv) > 1 else None
    update_version(project_name)
