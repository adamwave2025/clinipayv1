
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

    // Mark as initializing immediately to prevent race conditions
    window._metaPixelInitialized = true;

    console.log('[META PIXEL] Starting initialization process...');

    const initializePixel = () => {
      // Double-check we haven't been initialized by another component
      if (window.fbq && typeof window.fbq === 'function') {
        console.log('[META PIXEL] Facebook pixel already exists, skipping script injection');
        
        // Just fire our events if the pixel exists
        window.fbq('init', '1260903102365595');
        window.fbq('track', 'PageView');
        console.log('[META PIXEL] Re-used existing pixel');
        return;
      }

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
        
        // Add load event listener to verify script loaded
        t.onload = () => {
          console.log('[META PIXEL] Script loaded successfully');
        };
        
        t.onerror = () => {
          console.error('[META PIXEL] Script failed to load');
          // Reset initialization flag on error
          window._metaPixelInitialized = false;
        };
        
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      // Initialize with our pixel ID
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

      console.log('[META PIXEL] Initialized successfully');
    };

    // Use a small debounce delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      // Check document ready state
      if (document.readyState === 'loading') {
        // If still loading, wait for DOM content loaded
        document.addEventListener('DOMContentLoaded', initializePixel, { once: true });
      } else {
        // Document is already ready, initialize immediately
        initializePixel();
      }
    }, 100); // 100ms debounce

    // Cleanup timeout on component unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // Remove hasConsent dependency to prevent re-runs on consent changes

  // Separate effect to handle consent changes after initial mount
  useEffect(() => {
    if (hasConsent === true && !window._metaPixelInitialized) {
      // This will trigger the main effect above since the dependency array is empty
      // We handle this case in the main effect
    }
  }, [hasConsent]);

  return null;
};

export default MetaPixel;
