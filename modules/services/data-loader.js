// Data loader service
// Helper function to wait for services to be available

/**
 * Wait for NRD instance to be available
 * @param {number} maxWait - Maximum time to wait in milliseconds
 * @returns {Promise<object>} - Resolves with nrd instance
 */
export function waitForNRD(maxWait = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkNRD = () => {
      const nrdInstance = window.nrd;
      if (nrdInstance) {
        resolve(nrdInstance);
      } else if (Date.now() - startTime >= maxWait) {
        reject(new Error('NRD instance not found'));
      } else {
        setTimeout(checkNRD, 100);
      }
    };
    checkNRD();
  });
}

/**
 * Wait for specific services to be available
 * @param {Array<string>} serviceNames - Array of service names to wait for (e.g., ['employees', 'salaries'])
 * @param {object} nrd - NRD instance (optional, will use window.nrd if not provided)
 * @param {number} maxWait - Maximum time to wait in milliseconds
 * @returns {Promise<object>} - Resolves with nrd instance when all services are available
 */
export function waitForServices(serviceNames, nrd = null, maxWait = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkServices = () => {
      const nrdInstance = nrd || window.nrd;
      if (!nrdInstance) {
        if (Date.now() - startTime >= maxWait) {
          reject(new Error('NRD instance not found'));
          return;
        }
        setTimeout(checkServices, 100);
        return;
      }
      
      // Check if all required services are available
      const servicesAvailable = serviceNames.every(serviceName => {
        return nrdInstance[serviceName] !== undefined;
      });
      
      if (servicesAvailable) {
        resolve(nrdInstance);
      } else if (Date.now() - startTime >= maxWait) {
        reject(new Error(`Services not available after timeout: ${serviceNames.join(', ')}`));
      } else {
        setTimeout(checkServices, 100);
      }
    };
    checkServices();
  });
}
