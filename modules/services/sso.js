// SSO client for NRD apps (*.nrdonline.site). Server side: nrd-backend-api /api/sso/*.
// Architecture: nrd-backend-api/docs/temas/seguridad/SSO.md
import { isLocalDev } from '../utils/app-urls.js';

export const SSO_MARKER_COOKIE = 'nrd_sso_uid';
export const SSO_LOGGED_OUT = '0';

const API_REMOTE = 'https://api.nrdonline.site/api';
const API_LOCAL = 'http://localhost:8000/api';
const REQUEST_TIMEOUT_MS = 8000;

function getLogger() {
  return (typeof window !== 'undefined' && window.logger) || console;
}

/** SSO only works on the shared parent domain (cookies cannot cross localhost ports reliably). */
export function isSsoEnabled() {
  if (typeof window === 'undefined') return false;
  if (window.NRD_SSO_DISABLED === true) return false;
  return !isLocalDev() || window.NRD_SSO_LOCAL === true;
}

function apiBase() {
  return window.NRD_SSO_API_URL || (isLocalDev() ? API_LOCAL : API_REMOTE);
}

/**
 * Reads the marker cookie (no network).
 * @returns {string|null} uid | "0" (logged out elsewhere) | null (no SSO info)
 */
export function readSsoMarker() {
  try {
    const entry = document.cookie.split('; ').find((c) => c.startsWith(SSO_MARKER_COOKIE + '='));
    if (!entry) return null;
    const value = decodeURIComponent(entry.slice(SSO_MARKER_COOKIE.length + 1));
    return value || null;
  } catch (error) {
    return null;
  }
}

async function post(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(apiBase() + path, {
      method: 'POST',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

/** After a fresh Firebase login: publish the session to the other apps. Never throws. */
export async function publishSsoSession(user) {
  if (!isSsoEnabled() || !user || user.isAnonymous) return false;
  try {
    const idToken = await user.getIdToken(true);
    const res = await post('/sso/session', { id_token: idToken });
    return res.ok;
  } catch (error) {
    getLogger().warn('SSO: no se pudo publicar la sesión', error);
    return false;
  }
}

/**
 * Exchanges the shared session cookie for a Firebase custom token.
 * @returns {Promise<string|null>} custom token or null when there is no valid SSO session
 */
export async function fetchSsoCustomToken() {
  if (!isSsoEnabled()) return null;
  try {
    const res = await post('/sso/token');
    if (!res.ok) return null;
    const data = await res.json();
    return data.custom_token || null;
  } catch (error) {
    getLogger().warn('SSO: intercambio de token falló', error);
    return null;
  }
}

/** Global logout: clears the shared cookie and flags the other apps. Never throws. */
export async function endSsoSession() {
  if (!isSsoEnabled()) return;
  try {
    await post('/sso/logout');
  } catch (error) {
    getLogger().warn('SSO: logout remoto falló', error);
  }
}
