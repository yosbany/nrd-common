/**
 * Snippet para index.html — reemplaza el bloque largo de init de AuthService.
 * Uso (después de cargar nrd-data-access y nrd-common):
 *
 * <script>
 *   NRDAppAuthInit({ appName: 'NRD RRHH' });
 * </script>
 *
 * Apps legacy con logger.js propio y tabs que usan `nrd` global:
 *   NRDAppAuthInit({ appName: 'NRD Compras', legacyNrdAlias: true });
 */
function NRDAppAuthInit(cfg) {
  cfg = cfg || {};
  var start = Date.now();
  var maxWait = cfg.maxWait || 10000;
  var t = setInterval(function() {
    if (window.NRDCommon && window.NRDCommon.initializeAppAuth) {
      clearInterval(t);
      window.NRDCommon.initializeAppAuth(cfg);
    } else if (Date.now() - start >= maxWait) {
      clearInterval(t);
      if (window.NRDCommon && window.NRDCommon.showLoginFallback) {
        window.NRDCommon.showLoginFallback();
      } else {
        var ls = document.getElementById('login-screen');
        var rs = document.getElementById('redirecting-screen');
        if (rs) rs.classList.add('hidden');
        if (ls) ls.classList.remove('hidden');
      }
    }
  }, 100);
}
