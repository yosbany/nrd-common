# Setup Guide para nrd-common

## Pasos para completar la configuración

### 1. Instalar dependencias

```bash
cd nrd-common
npm install
```

### 2. Construir la librería

```bash
npm run build
```

Esto generará `dist/nrd-common.js` que será servido desde GitHub Pages.

### 3. Configurar el repositorio remoto

```bash
git remote add origin https://github.com/yosbany/nrd-common.git
```

### 4. Hacer commit inicial

```bash
git commit -m "Initial commit: NRD Common library"
```

### 5. Crear el repositorio en GitHub

1. Ir a https://github.com/yosbany
2. Crear un nuevo repositorio llamado `nrd-common`
3. No inicializar con README, .gitignore o licencia (ya están creados)

### 6. Push inicial

```bash
git branch -M main
git push -u origin main
```

### 7. Configurar GitHub Pages (opcional)

Si quieres servir el archivo desde GitHub Pages:
1. Ir a Settings > Pages en el repositorio
2. Seleccionar la rama `main` y carpeta `/dist`
3. El archivo estará disponible en: `https://yosbany.github.io/nrd-common/nrd-common.js`

### 8. Usar desde CDN

Una vez publicado, puedes usar la librería desde jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/gh/yosbany/nrd-common@main/dist/nrd-common.js"></script>
```

Y acceder a través del objeto global:

```javascript
// Usar funciones globales
NRDCommon.showAlert('Título', 'Mensaje');
NRDCommon.showSpinner('Cargando...');

// O usar clases
const logger = new NRDCommon.Logger('MiApp');
const authService = new NRDCommon.AuthService();
```

## Notas

- El archivo `dist/nrd-common.js` debe ser commiteado al repositorio para que jsDelivr pueda servirlo
- Después de cada cambio, ejecuta `npm run build` y haz commit del nuevo `dist/nrd-common.js`
- jsDelivr cachea los archivos, así que puede tomar unos minutos para ver los cambios
