# NRD Common - Componentes Comunes del Sistema

Este directorio contiene todos los componentes comunes y reutilizables del sistema NRD que se replican en cada proyecto.

## Estructura

```
nrd-common/
├── service-worker.js  # Service Worker genérico (se copia a raíz de cada proyecto)
├── modules/
│   ├── core/          # Módulos core (logger, config, app-init)
│   ├── ui/            # Componentes UI (modal, spinner)
│   ├── utils/         # Utilidades (format, dom, date)
│   └── services/      # Servicios comunes (auth, navigation, data-loader)
├── tools/             # Herramientas comunes
│   ├── server/        # Servidores HTTP
│   └── update-version/ # Actualizador de versión
├── sync-common.sh     # Script para sincronizar a proyectos
└── README.md
```

## Importante: Replicación en Proyectos

**Cada proyecto NRD se despliega por separado en GitHub Pages**, por lo que los componentes comunes deben replicarse en cada proyecto dentro de la carpeta `common/`.

### Estructura en cada proyecto:

```
nrd-[proyecto]/
├── common/            # Componentes comunes (replicados desde nrd-common)
│   └── modules/
│       ├── core/
│       ├── ui/
│       ├── utils/
│       └── services/
├── modules/           # Módulos específicos del proyecto
├── views/             # Vistas específicas del proyecto
└── ...
```

## Sincronización

### Sincronizar a todos los proyectos

```bash
cd nrd-common
./sync-common.sh
```

### Sincronizar a un proyecto específico

```bash
cd nrd-common
./sync-common.sh nrd-rrhh
```

El script:
1. Copia todos los componentes comunes a `[proyecto]/common/modules/`
2. Copia el service worker genérico a `[proyecto]/service-worker.js` (raíz del proyecto)
3. Copia las herramientas comunes a `[proyecto]/tools/`
4. Personaliza el logger con el nombre del proyecto
5. Mantiene la estructura idéntica en todos los proyectos

## Componentes Disponibles

### Common Files
- **service-worker.js**: Service Worker genérico para PWA
  - Detecta automáticamente el nombre del proyecto
  - Maneja caché con estrategia "network first"
  - Soporta cache busting con parámetros de versión

### Core
- **logger.js**: Sistema de logging estandarizado
  - Exporta `Logger` class, `createLogger()` factory, y `LOG_LEVELS`
  - Cada proyecto debe crear su propia instancia de logger
- **config.js**: Configuración común (timeouts, constantes)
- **app-init.js**: Inicialización de aplicación y verificación de dependencias

### UI
- **modal.js**: Sistema de modales y alertas (`showAlert`, `showConfirm`, `showError`, etc.)
- **spinner.js**: Indicador de carga (`showSpinner`, `hideSpinner`)

### Utils
- **format.js**: Formato de números, moneda, decimales
- **dom.js**: Utilidades DOM (`escapeHtml`, `querySelectorSafe`, `createElement`)
- **date.js**: Utilidades de fecha (`getMonthName`, `formatDate`, `isEmployeeActiveInYear`)

### Services
- **auth.js**: Servicio de autenticación (`AuthService` class)
- **navigation.js**: Servicio de navegación (`NavigationService` class)
- **data-loader.js**: Utilidades para cargar datos (`waitForNRD`, `waitForServices`)

## Uso en Proyectos

### Opción 1: Usar desde CDN (Recomendado)

Incluir la librería en el HTML:

```html
<!-- jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/gh/yosbany/nrd-common@main/dist/nrd-common.js"></script>
```

Usar en JavaScript:

```javascript
// Acceder a través del objeto global NRDCommon
const logger = new NRDCommon.Logger('MiApp');
NRDCommon.showAlert('Título', 'Mensaje');
NRDCommon.showSpinner('Cargando...');

// O usar ES modules (si el proyecto soporta)
import { Logger, showAlert, showSpinner } from 'https://cdn.jsdelivr.net/gh/yosbany/nrd-common@main/dist/nrd-common.js';
```

### Opción 2: Importar desde common (local)

```javascript
// Desde cualquier módulo de la aplicación
import { logger } from '../common/modules/core/logger.js';
import { showAlert, showSpinner } from '../common/modules/ui/index.js';
import { formatCurrency, escapeHtml } from '../common/modules/utils/index.js';
import { AuthService, NavigationService } from '../common/modules/services/index.js';
```

### Crear logger específico del proyecto

El script `sync-common.sh` personaliza automáticamente el logger, pero si necesitas hacerlo manualmente:

```javascript
import { createLogger, LOG_LEVELS } from '../common/modules/core/logger.js';

// Crear logger específico para tu aplicación
export const logger = createLogger('NRD MiApp', {
  logLevel: LOG_LEVELS.DEBUG,
  enableColors: true
});

// Exponer globalmente para compatibilidad
if (typeof window !== 'undefined') {
  window.logger = logger;
}
```

## Build y Publicación

### Construir la librería

```bash
cd nrd-common
npm install
npm run build
```

Esto generará `dist/nrd-common.js` que puede ser usado desde CDN.

### Publicar a GitHub Pages

1. Hacer commit y push a la rama `main`
2. GitHub Pages servirá automáticamente el archivo desde `dist/nrd-common.js`
3. jsDelivr puede servir el archivo desde: `https://cdn.jsdelivr.net/gh/yosbany/nrd-common@main/dist/nrd-common.js`

## Mantenimiento

1. **Hacer cambios en nrd-common**: Edita los archivos en `nrd-common/modules/`
2. **Rebuild**: Ejecuta `npm run build` para generar el bundle
3. **Commit y Push**: Sube los cambios a GitHub
4. **Sincronizar cambios locales (opcional)**: Ejecuta `./sync-common.sh` para replicar a proyectos locales
5. **Verificar**: Revisa que los cambios se aplicaron correctamente en cada proyecto

## Notas

- Todos los módulos son ES Modules nativos
- Los componentes están diseñados para ser genéricos y reutilizables
- Cada proyecto puede tener módulos específicos adicionales en `modules/`
- Se mantiene compatibilidad con `window.*` para código legacy
- El logger se personaliza automáticamente con el nombre del proyecto
