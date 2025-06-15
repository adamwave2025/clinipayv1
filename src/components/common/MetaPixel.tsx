
import { useEffect } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    _metaPixelInitialized?: boolean;
  }
}

const MetaPixel: React.FC = () => {
  const { hasConsent } = useCookieConsent();

  useEffect(() => {
    // Only proceed if we have consent
    if (hasConsent !== true) {
      console.log('[META PIXEL] Waiting for consent...');
      return;
    }

    // Check if already initialized globally
    if (window._metaPixelInitialized) {
      console.log('[META PIXEL] Already initialized globally, skipping...');
      return;
    }

    console.log('[META PIXEL] Starting initialization process...');

    // If fbq already exists, just mark as initialized and skip firing
    if (window.fbq && typeof window.fbq === 'function') {
      console.log('[META PIXEL] Facebook pixel already exists, marking as initialized');
      window._metaPixelInitialized = true;
      return;
    }

    // Mark as initializing to prevent race conditions
    window._metaPixelInitialized = true;

    console.log('[META PIXEL] Injecting Facebook pixel script...');

    // Meta Pixel Code - Facebook's official initialization
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
      
      t.onload = () => {
        console.log('[META PIXEL] Script loaded successfully, firing events');
        // Only fire events after script loads
        window.fbq('init', '1260903102365595');
        window.fbq('track', 'PageView');
        console.log('[META PIXEL] Events fired successfully');
      };
      
      t.onerror = () => {
        console.error('[META PIXEL] Script failed to load');
        window._metaPixelInitialized = false;
      };
      
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = 'https://www.facebook.com/tr?id=1260903102365595&ev=PageView&noscript=1';
    noscript.appendChild(img);
    document.head.appendChild(noscript);

    console.log('[META PIXEL] Script injection completed');
  }, [hasConsent]);

  return null;
};

export default MetaPixel;
