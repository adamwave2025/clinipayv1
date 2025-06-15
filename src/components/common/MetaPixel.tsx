
import { useEffect } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

// Session storage key for tracking pixel initialization
const PIXEL_SESSION_KEY = 'meta_pixel_initialized';

// Module-level flag to prevent duplicate initialization within same component lifecycle
let isMetaPixelInitialized = false;

const MetaPixel: React.FC = () => {
  const { hasConsent } = useCookieConsent();

  useEffect(() => {
    const initializeMetaPixel = () => {
      console.log('[META PIXEL] Checking initialization conditions...', {
        hasConsent,
        isMetaPixelInitialized,
        windowFbq: !!window.fbq,
        sessionInitialized: sessionStorage.getItem(PIXEL_SESSION_KEY),
        scriptExists: !!document.querySelector('script[src*="fbevents.js"]')
      });

      // Only initialize if consent is given
      if (hasConsent !== true) {
        console.log('[META PIXEL] Initialization skipped - no consent');
        return;
      }

      // Check session storage first - most important check
      if (sessionStorage.getItem(PIXEL_SESSION_KEY) === 'true') {
        console.log('[META PIXEL] Already initialized in this session, skipping...');
        return;
      }

      // Comprehensive check to prevent duplicate initialization
      if (isMetaPixelInitialized || 
          window.fbq || 
          document.querySelector('script[src*="fbevents.js"]')) {
        console.log('[META PIXEL] Already initialized (module/window/script check), skipping...');
        // Mark as initialized in session storage even if we detect existing initialization
        sessionStorage.setItem(PIXEL_SESSION_KEY, 'true');
        return;
      }

      console.log('[META PIXEL] Initializing Meta pixel...');
      
      // Set our flags immediately to prevent race conditions
      isMetaPixelInitialized = true;
      sessionStorage.setItem(PIXEL_SESSION_KEY, 'true');

      // Meta Pixel Code
      (function(f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('init', '1260903102365595');
      window.fbq('track', 'PageView');

      // Add noscript fallback
      const noscript = document.createElement('noscript');
      const img = document.createElement('img');
      img.height = 1;
      img.width = 1;
      img.style.display = 'none';
      img.src = 'https://www.facebook.com/tr?id=1260903102365595&ev=PageView&noscript=1';
      noscript.appendChild(img);
      document.head.appendChild(noscript);

      console.log('[META PIXEL] Meta pixel initialized successfully');
    };

    // Initialize when consent is given
    initializeMetaPixel();
  }, [hasConsent]);

  return null;
};

export default MetaPixel;
