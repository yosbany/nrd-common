// URLs de apps NRD: localhost (servidor unificado) vs producción (nrdonline.site)

export const NRD_LIB_LOCAL = {
  dataAccess: '/nrd-data-access/dist/nrd-data-access.js',
  common: '/nrd-common/dist/nrd-common.js'
};

export const NRD_LIB_REMOTE = {
  dataAccess: 'https://datos.nrdonline.site/dist/nrd-data-access.js',
  common: 'https://common.nrdonline.site/dist/nrd-common.js'
};

export function getLibraryUrl(libKey) {
  if (isLocalDev()) {
    return NRD_LIB_LOCAL[libKey] || '/';
  }
  return NRD_LIB_REMOTE[libKey] || '/';
}

export function getDataAccessUrl() {
  return getLibraryUrl('dataAccess');
}

export function getCommonLibUrl() {
  return getLibraryUrl('common');
}

export const NRD_LOCAL_PATHS = {
  portal: '/nrd-portal/',
  pdv: '/nrd-pdv/',
  pedidos: '/nrd-pedidos/',
  operativa: '/nrd-gestion-operativa/',
  flujo: '/nrd-flujo-caja/',
  cajas: '/nrd-control-cajas/',
  stock: '/nrd-control-stock/',
  costos: '/nrd-costos/',
  rrhh: '/nrd-rrhh/',
  productos: '/nrd-productos/',
  compras: '/nrd-compras/',
  catalogo: '/nrd-catalogo/',
  web: '/nrd-web/',
  datos: '/nrd-data-access/'
};

export const NRD_REMOTE_URLS = {
  portal: 'https://portal.nrdonline.site/',
  pdv: 'https://pdv.nrdonline.site/',
  pedidos: 'https://pedidos.nrdonline.site/',
  operativa: 'https://operativa.nrdonline.site/',
  flujo: 'https://flujo.nrdonline.site/',
  cajas: 'https://cajas.nrdonline.site/',
  stock: 'https://stock.nrdonline.site/',
  costos: 'https://costos.nrdonline.site/',
  rrhh: 'https://rrhh.nrdonline.site/',
  productos: 'https://productos.nrdonline.site/',
  compras: 'https://compras.nrdonline.site/',
  catalogo: 'https://catalogo.nrdonline.site/',
  web: 'https://web.nrdonline.site/',
  datos: 'https://datos.nrdonline.site/'
};

export function isLocalDev(hostname) {
  const host = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

export function getAppUrl(appKey) {
  if (isLocalDev()) {
    return NRD_LOCAL_PATHS[appKey] || '/';
  }
  return NRD_REMOTE_URLS[appKey] || '/';
}

export function getPortalUrl() {
  return getAppUrl('portal');
}

/** Config para la grilla del portal (nombre visible → clave interna). */
export const PORTAL_APPS = [
  { name: 'PDV', key: 'pdv', icon: '🛒' },
  { name: 'Pedidos', key: 'pedidos', icon: '📦' },
  { name: 'Gestión Operativa', key: 'operativa', icon: '⚙️' },
  { name: 'Flujo de Caja', key: 'flujo', icon: '💰' },
  { name: 'Control de Cajas', key: 'cajas', icon: '📊' },
  { name: 'Control de Stock', key: 'stock', icon: '🗃️' },
  { name: 'Costos', key: 'costos', icon: '💵' },
  { name: 'RRHH', key: 'rrhh', icon: '👥' },
  { name: 'Productos', key: 'productos', icon: '📋' },
  { name: 'Compras', key: 'compras', icon: '🛒' },
  { name: 'Catálogo', key: 'catalogo', icon: '📚' },
  { name: 'Web', key: 'web', icon: '🌐' },
  { name: 'Administración de Datos', key: 'datos', icon: '🗄️' }
];
