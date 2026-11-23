// Tema de marca Nueva Río D'or (identidad v6) para todas las apps NRD con interfaz.
// Fuente de verdad: nrd-brand-kit/tokens.css y tokens.json. Si cambian allí, actualizar aquí.
//
// Las apps usan Tailwind (CDN) con rojo/gris/verde/azul genéricos. En vez de editar miles de clases,
// este módulo remapea esas utilidades a los tokens de marca con CSS. Se aplica solo al cargar nrd-common.

export const BRAND = {
  fuchsia: '#C4006B',
  fuchsiaHover: '#A9005C',
  fuchsiaTint: '#FDEFF6',
  fuchsiaTintStrong: '#F7D3E6',
  cocoa: '#4A2818',
  cocoaMuted: '#725B4E',
  gold: '#F5B700',
  cream: '#FFF8ED',
  border: '#E6D9C9',
  borderStrong: '#CDBBA6',
  success: '#276749',
  successHover: '#1E5039',
  info: '#315C7D',
  infoHover: '#264A65',
  warning: '#87520F',
  // El kit no define un color de error: se usa un rojo oscuro propio, distinguible del fucsia de marca.
  danger: '#B42318',
  dangerHover: '#912018'
};

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap';

// Acciones destructivas: conservan rojo (no se confunden con la acción principal fucsia).
const DANGER_SEL = [
  '[id*="delete"]', '[id*="remove"]', '[id*="eliminar"]', '[id*="borrar"]', '[id*="anular"]',
  '[data-action*="delete"]', '[data-action*="remove"]', '[data-action*="eliminar"]'
];

function buildCss() {
  const b = BRAND;
  const danger = (suffix) => DANGER_SEL.map((s) => `${s}${suffix}`).join(',\n');
  return `
:root {
  --nrd-fuchsia: ${b.fuchsia}; --nrd-cocoa: ${b.cocoa}; --nrd-gold: ${b.gold}; --nrd-cream: ${b.cream};
  --nrd-primary: ${b.fuchsia}; --nrd-primary-hover: ${b.fuchsiaHover};
  --nrd-text: ${b.cocoa}; --nrd-text-muted: ${b.cocoaMuted}; --nrd-border: ${b.border};
  --nrd-surface: #ffffff; --nrd-surface-warm: ${b.cream};
  --nrd-success: ${b.success}; --nrd-info: ${b.info}; --nrd-warning: ${b.warning}; --nrd-danger: ${b.danger};
  --nrd-font: "Montserrat", Arial, sans-serif;
}
html, body, button, input, select, textarea { font-family: var(--nrd-font) !important; }
body { color: var(--nrd-text); background-color: var(--nrd-cream); }
::selection { background: ${b.fuchsiaTintStrong}; color: ${b.cocoa}; }
:focus-visible { outline: 2px solid ${b.fuchsia}; outline-offset: 2px; }

/* ---- Acción principal: rojo -> fucsia ---- */
.bg-red-600, .bg-red-500 { background-color: ${b.fuchsia} !important; }
.hover\\:bg-red-700:hover, .hover\\:bg-red-600:hover, .bg-red-700 { background-color: ${b.fuchsiaHover} !important; }
.bg-red-50, .hover\\:bg-red-50:hover { background-color: ${b.fuchsiaTint} !important; }
.bg-red-100 { background-color: ${b.fuchsiaTintStrong} !important; }
.text-red-500, .text-red-600, .hover\\:text-red-600:hover, .text-red-700, .hover\\:text-red-700:hover { color: ${b.fuchsia} !important; }
.border-red-600, .border-red-500, .border-red-700, .hover\\:border-red-600:hover,
.focus\\:border-red-600:focus, .focus\\:border-red-500:focus { border-color: ${b.fuchsia} !important; }
.border-red-200, .border-red-300 { border-color: ${b.fuchsiaTintStrong} !important; }
.focus\\:ring-red-600:focus, .focus\\:ring-red-500:focus { --tw-ring-color: ${b.fuchsia} !important; }
.ring-red-600 { --tw-ring-color: ${b.fuchsia} !important; }

/* ---- Acciones destructivas: rojo propio, no fucsia ---- */
${danger('.bg-red-600')}, ${danger('.bg-red-500')} { background-color: ${b.danger} !important; }
${danger('.hover\\:bg-red-700:hover')} { background-color: ${b.dangerHover} !important; }
${danger('.border-red-600')} { border-color: ${b.danger} !important; }
${danger('.text-red-600')}, ${danger('.hover\\:text-red-600:hover')} { color: ${b.danger} !important; }

/* ---- Estados: verde/azul/ámbar -> tokens de marca ---- */
.bg-green-600, .bg-green-500 { background-color: ${b.success} !important; }
.hover\\:bg-green-700:hover { background-color: ${b.successHover} !important; }
.text-green-600, .text-green-700 { color: ${b.success} !important; }
.border-green-600 { border-color: ${b.success} !important; }
.bg-blue-600, .bg-blue-500 { background-color: ${b.info} !important; }
.hover\\:bg-blue-700:hover { background-color: ${b.infoHover} !important; }
.text-blue-600, .text-blue-700 { color: ${b.info} !important; }
.border-blue-600 { border-color: ${b.info} !important; }
.text-yellow-600, .text-yellow-700, .text-amber-600, .text-orange-600 { color: ${b.warning} !important; }

/* ---- Neutros: gris frío -> cacao / crema cálidos ---- */
.text-gray-900, .text-gray-800, .text-gray-700 { color: ${b.cocoa} !important; }
.text-gray-600, .text-gray-500 { color: ${b.cocoaMuted} !important; }
.text-gray-400 { color: #9A8576 !important; }
.border-gray-100, .border-gray-200, .divide-gray-200 > :not([hidden]) ~ :not([hidden]) { border-color: ${b.border} !important; }
.border-gray-300 { border-color: ${b.borderStrong} !important; }
.bg-gray-50, .hover\\:bg-gray-50:hover { background-color: ${b.cream} !important; }
.bg-gray-100 { background-color: #F6EBDC !important; }
.bg-gray-600 { background-color: ${b.cocoaMuted} !important; }
.hover\\:bg-gray-700:hover { background-color: ${b.cocoa} !important; }

/* ---- Cabecera y detalles ---- */
header.sticky { background-color: ${b.fuchsia} !important; border-bottom: 3px solid ${b.gold} !important; }
input:focus, select:focus, textarea:focus { border-color: ${b.fuchsia} !important; }
`;
}

/** Inyecta Montserrat y el tema. Idempotente. */
export function applyBrandTheme() {
  if (typeof document === 'undefined' || document.getElementById('nrd-brand-theme')) return;

  if (!document.getElementById('nrd-brand-font')) {
    const pre1 = document.createElement('link');
    pre1.rel = 'preconnect';
    pre1.href = 'https://fonts.googleapis.com';
    const pre2 = document.createElement('link');
    pre2.rel = 'preconnect';
    pre2.href = 'https://fonts.gstatic.com';
    pre2.crossOrigin = '';
    const font = document.createElement('link');
    font.id = 'nrd-brand-font';
    font.rel = 'stylesheet';
    font.href = FONT_URL;
    document.head.append(pre1, pre2, font);
  }

  const style = document.createElement('style');
  style.id = 'nrd-brand-theme';
  style.textContent = buildCss();
  document.head.appendChild(style);

  const meta = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = BRAND.fuchsia;
  if (!meta.parentNode) document.head.appendChild(meta);
}
