// Application initialization and dependency verification
// This module provides generic initialization functions that can be used by any NRD application
import { REQUIRED_GLOBALS, REQUIRED_MODULES, INIT_TIMEOUT, MODULE_CHECK_INTERVAL } from './config.js';

/**
 * Wait for a global variable to be available
 * @param {string} globalName - Name of the global variable to wait for
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} - Resolves to true when available, false on timeout
 */
export function waitForGlobal(globalName, timeout = INIT_TIMEOUT) {
  return new Promise((resolve) => {
    // Check immediately
    if (typeof window[globalName] !== 'undefined') {
      resolve(true);
      return;
    }
    
    const startTime = Date.now();
    
    const intervalId = setInterval(() => {
      if (typeof window[globalName] !== 'undefined') {
        clearInterval(intervalId);
        resolve(true);
      } else if (Date.now() - startTime >= timeout) {
        clearInterval(intervalId);
        resolve(false);
      }
    }, MODULE_CHECK_INTERVAL);
  });
}

/**
 * Wait for all deferred scripts to be loaded and executed
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} - Resolves to true when all scripts are loaded
 */
export function waitForAllScripts(timeout = INIT_TIMEOUT) {
  return new Promise((resolve) => {
    // Wait for window.load event which fires after all defer scripts are executed
    if (document.readyState === 'complete') {
      // All scripts already loaded
      setTimeout(() => resolve(true), 100); // Small delay to ensure execution
      return;
    }
    
    const startTime = Date.now();
    
    window.addEventListener('load', () => {
      setTimeout(() => resolve(true), 100); // Small delay to ensure execution
    });
    
    // Timeout fallback
    setTimeout(() => {
      if (Date.now() - startTime >= timeout) {
        resolve(false);
      }
    }, timeout);
  });
}

/**
 * Wait for a function or object to be available globally
 * @param {string|Array<string>} names - Name(s) of the global function/object to wait for
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} - Resolves to true when available, false on timeout
 */
export function waitForGlobals(names, timeout = INIT_TIMEOUT) {
  const nameArray = Array.isArray(names) ? names : [names];
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkGlobals = () => {
      const allAvailable = nameArray.every(name => {
        const parts = name.split('.');
        let obj = window;
        for (const part of parts) {
          if (obj && typeof obj[part] !== 'undefined') {
            obj = obj[part];
          } else {
            return false;
          }
        }
        return true;
      });
      
      if (allAvailable) {
        resolve(true);
      } else if (Date.now() - startTime >= timeout) {
        resolve(false);
      } else {
        setTimeout(checkGlobals, MODULE_CHECK_INTERVAL);
      }
    };
    
    checkGlobals();
  });
}

/**
 * Verify that all required modules are available
 * @returns {Promise<{success: boolean, missing: Array<string>}>}
 */
export async function verifyModules() {
  const missing = [];
  
  for (const module of REQUIRED_MODULES) {
    const available = await waitForGlobals(module, 5000);
    if (!available) {
      missing.push(module);
    }
  }
  
  return {
    success: missing.length === 0,
    missing: missing
  };
}

/**
 * Show error message to user (for initialization errors)
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {string} details - Additional details (optional)
 */
export function showInitError(title, message, details = '') {
  const errorHTML = `
    <div class="min-h-screen flex items-center justify-center bg-white">
      <div class="text-center max-w-md px-4">
        <h1 class="text-xl font-light mb-4 text-gray-800">${title}</h1>
        <p class="text-gray-600 mb-2">${message}</p>
        ${details ? `<p class="text-sm text-gray-500 mt-2">${details}</p>` : ''}
      </div>
    </div>
  `;
  document.body.innerHTML = errorHTML;
}

/**
 * Initialize NRD Data Access Library
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export async function initializeNRD() {
  try {
    // Wait for NRD Data Access Library to be available
    const libraryAvailable = await waitForGlobal('NRDDataAccess', 10000);
    
    if (!libraryAvailable) {
      console.error('NRD Data Access Library not loaded after timeout');
      showInitError(
        'Error de Carga',
        'No se pudo cargar la librería NRD Data Access',
        'Por favor, verifica tu conexión y recarga la página.'
      );
      return false;
    }
    
    // Create global NRD Data Access instance
    // NRD Data Access Library will initialize Firebase internally
    // All modules must use window.nrd, NOT firebase directly
    window.nrd = new NRDDataAccess();
    console.log('NRD Data Access initialized successfully');
    
    // Log available services for debugging
    if (window.nrd) {
      const availableServices = Object.keys(window.nrd).filter(key => 
        typeof window.nrd[key] === 'object' && 
        window.nrd[key] !== null && 
        typeof window.nrd[key].getAll === 'function'
      );
      console.log('Available NRD services:', availableServices);
      console.log('measurementUnits available:', !!window.nrd.measurementUnits);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing NRD Data Access:', error);
      showInitError(
        'Error de Inicialización',
        `Error al inicializar la aplicación: ${error.message || 'Error desconocido'}`,
        'Por favor, recarga la página.'
      );
    return false;
  }
}

/**
 * Initialize application after all scripts are loaded
 */
export async function initializeApplication() {
  try {
    console.log('Waiting for all scripts to load...');
    
    // Wait for all deferred scripts to be loaded
    const scriptsLoaded = await waitForAllScripts(INIT_TIMEOUT);
    
    if (!scriptsLoaded) {
      console.warn('Scripts may not have loaded completely, continuing anyway...');
    }
    
    // Verify all required modules are available
    console.log('Verifying required modules...');
    const verification = await verifyModules();
    
    if (!verification.success) {
      console.error('Missing required modules:', verification.missing);
            showInitError(
              'Error de Carga',
              'No se pudieron cargar todos los módulos necesarios',
              `Módulos faltantes: ${verification.missing.join(', ')}. Por favor, recarga la página.`
            );
      return;
    }
    
    console.log('All modules loaded successfully. Application ready.');
    
  } catch (error) {
    console.error('Error during application initialization:', error);
      showInitError(
        'Error de Inicialización',
        `Error al inicializar la aplicación: ${error.message || 'Error desconocido'}`,
        'Por favor, recarga la página.'
      );
  }
}
