# Instrucciones Rápidas - nrd-common

## ✅ Lo que ya está hecho:

1. ✅ Estructura de build configurada (webpack, package.json)
2. ✅ Archivo de entrada principal creado (src/index.js)
3. ✅ Git inicializado con commit inicial
4. ✅ nrd-rrhh actualizado para usar nrd-common desde CDN
5. ✅ README y documentación creados

## 📋 Pasos pendientes para completar:

### 1. Construir la librería (REQUERIDO)

```bash
cd nrd-common
npm install
npm run build
```

Esto generará `dist/nrd-common.js` que es necesario para el CDN.

### 2. Agregar el archivo construido a git

```bash
git add dist/nrd-common.js
git commit -m "Add built nrd-common.js"
```

### 3. Crear repositorio en GitHub

1. Ve a https://github.com/yosbany
2. Crea un nuevo repositorio llamado `nrd-common`
3. **NO** inicialices con README, .gitignore o licencia

### 4. Configurar remoto y hacer push

```bash
git remote add origin https://github.com/yosbany/nrd-common.git
git branch -M main
git push -u origin main
```

### 5. Verificar que funciona

Una vez publicado, el archivo estará disponible en:
- `https://cdn.jsdelivr.net/gh/yosbany/nrd-common@main/dist/nrd-common.js`

## 🔄 Actualizar después de cambios

Cada vez que modifiques los módulos:

```bash
npm run build
git add dist/nrd-common.js
git commit -m "Update nrd-common.js"
git push
```

## 📝 Uso en proyectos

Ya está configurado en `nrd-rrhh/index.html`:

```html
<script src="https://cdn.jsdelivr.net/gh/yosbany/nrd-common@main/dist/nrd-common.js"></script>
```

Las funciones se exponen globalmente:
- `showAlert()`, `showConfirm()`, `showError()`, etc.
- `showSpinner()`, `hideSpinner()`
- `NRDCommon.Logger`, `NRDCommon.AuthService`, etc.
