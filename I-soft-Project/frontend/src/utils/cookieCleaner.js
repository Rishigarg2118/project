/**
 * Automated Cookie Cleaner Utility
 * Periodically purges all browser cookies every 10 seconds automatically.
 */
export function clearAllCookies() {
  try {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const hostname = window.location.hostname;
    const pathnames = ['/', window.location.pathname];
    
    // Domain variations to ensure host & subdomain cookies are cleared
    const domains = [
      '',
      hostname,
      `.${hostname}`
    ];

    cookies.forEach((c) => {
      const eqPos = c.indexOf('=');
      const name = (eqPos > -1 ? c.substring(0, eqPos) : c).trim();
      if (!name) return;

      domains.forEach((domain) => {
        pathnames.forEach((path) => {
          const domainStr = domain ? `; domain=${domain}` : '';
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainStr}`;
          document.cookie = `${name}=; max-age=0; path=${path}${domainStr}`;
        });
      });
    });
  } catch (err) {
    // Graceful error trap
  }
}

/**
 * Initializes automated 10-second cookie cleaner interval
 * @param {number} intervalMs - Default: 10000 (10 seconds)
 * @returns {Function} cleanup function to stop interval
 */
export function initAutoCookieCleaner(intervalMs = 10000) {
  // Run immediately on initialization
  clearAllCookies();
  
  // Schedule recurring purge every 10s
  const timer = setInterval(() => {
    clearAllCookies();
  }, intervalMs);

  return () => clearInterval(timer);
}

export default { clearAllCookies, initAutoCookieCleaner };
