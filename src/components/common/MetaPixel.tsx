
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const MetaPixel: React.FC = () => {
  const { hasConsent } = useCookieConsent();
  const location = useLocation();

  // Initialize the pixel only once when consent is granted
  useEffect(() => {
    // Only proceed if we have consent
    if (hasConsent !== true) {
      return;
    }

    // If fbq already exists, don't reinitialize
    if (window.fbq) {
      return;
    }

    console.log('[META PIXEL] Initializing Facebook Pixel');

    // Facebook's standard pixel code
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

    // Initialize the pixel with advanced SPA tracking enabled
    window.fbq('init', '1260903102365595', {
      autoConfig: true,
      debug: false
    });

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = 'https://www.facebook.com/tr?id=1260903102365595&ev=PageView&noscript=1';
    noscript.appendChild(img);
    document.head.appendChild(noscript);

    console.log('[META PIXEL] Facebook Pixel initialized with SPA tracking enabled');
  }, [hasConsent]);

  // Track page views on route changes (manual fallback for SPA navigation)
  useEffect(() => {
    // Only track if we have consent and fbq is loaded
    if (hasConsent !== true || !window.fbq) {
      return;
    }

    console.log('[META PIXEL] Route changed to:', location.pathname);
    window.fbq('track', 'PageView');
  }, [location.pathname, hasConsent]);

  return null;
};

export default MetaPixel;
