# Instrucciones para Publicar nrd-common en GitHub

## Estado Actual ✅

- ✅ Build completado: `dist/nrd-common.js` (19KB)
- ✅ Git inicializado con 6 commits
- ✅ Todos los archivos commiteados
- ✅ nrd-rrhh configurado para usar desde CDN

## Pasos para Publicar

### Paso 1: Crear Repositorio en GitHub

1. Ve a https://github.com/yosbany
2. Haz clic en el botón verde **"New"** o **"New repository"**
3. Configuración:
   - **Repository name**: `nrd-common`
   - **Description**: `Common modules library for NRD applications`
   - **Visibility**: Public (para que jsDelivr funcione)
   - ⚠️ **IMPORTANTE**: **NO** marques ninguna opción de:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   (Ya tenemos estos archivos)
4. Haz clic en **"Create repository"**

### Paso 2: Configurar Remoto y Hacer Push

Ejecuta estos comandos en la terminal:

```bash
cd /Users/yosbanytejas/Documents/nrd-system/nrd-common

# Configurar el remoto
git remote add origin https://github.com/yosbany/nrd-common.git

# Asegurar que estamos en la rama main
git branch -M main

# Hacer push
git push -u origin main
```

### Paso 3: Verificar

Una vez publicado, verifica que el archivo esté disponible:

- **GitHub**: https://github.com/yosbany/nrd-common/blob/main/dist/nrd-common.js
- **jsDelivr CDN**: https://cdn.jsdelivr.net/gh/yosbany/nrd-common@main/dist/nrd-common.js

Deberías poder abrir el enlace de jsDelivr y ver el código JavaScript.

## Uso en Proyectos

Una vez publicado, `nrd-rrhh` ya está configurado para usar la librería. El archivo `nrd-rrhh/index.html` incluye:

```html
<script src="https://cdn.jsdelivr.net/gh/yosbany/nrd-common@main/dist/nrd-common.js"></script>
```

Las funciones estarán disponibles globalmente:
- `showAlert()`, `showConfirm()`, `showError()`, `showSuccess()`, etc.
- `showSpinner()`, `hideSpinner()`
- `NRDCommon.Logger`, `NRDCommon.AuthService`, etc.

## Actualizar Después de Cambios

Cada vez que modifiques los módulos:

```bash
# 1. Rebuild
npm run build

# 2. Commit y push
git add dist/nrd-common.js
git commit -m "Update nrd-common.js"
git push
```

**Nota**: jsDelivr cachea los archivos, puede tomar 5-10 minutos para ver los cambios.
