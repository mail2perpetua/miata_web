// The original website's stylesheets and jQuery plugins, served from public/assets.
//
// The stylesheets are linked in index.html with `data-website-css` (render-blocking, exactly like the original
// HTML pages). They are switched off while a dashboard is shown, so Bootstrap and the Eduact theme never style
// the portal, and switched back on for website pages without downloading them again.

const PLUGIN_SCRIPTS = [
  '/assets/vendors/jquery/jquery-3.5.1.min.js',
  '/assets/vendors/owl-carousel/owl.carousel.min.js',
  '/assets/vendors/jquery-magnific-popup/jquery.magnific-popup.min.js',
  '/assets/vendors/tilt/tilt.jquery.js',
  '/assets/vendors/jarallax/jarallax.min.js',
];

// Toggled through `media` rather than `disabled`: a disabled <link> drops its parsed sheet and has to reload it
// (a flash of unstyled page), while `media="not all"` keeps it ready to apply instantly.
export function setWebsiteStyles(enabled) {
  for (const link of document.querySelectorAll('link[data-website-css]')) link.media = enabled ? 'all' : 'not all';
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false; // execute in order: the plugins need jQuery first
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.body.appendChild(script);
  });
}

let pluginsPromise = null;

/** Loads jQuery and the theme plugins once; later calls share the same promise. */
export function loadThemePlugins() {
  if (!pluginsPromise) {
    pluginsPromise = Promise.all(PLUGIN_SCRIPTS.map(loadScript)).catch((err) => {
      pluginsPromise = null; // allow a retry on the next page
      throw err;
    });
  }
  return pluginsPromise;
}

/** The chat launcher that every original page loaded (third-party script, loaded once). */
export function loadChatLauncher() {
  if (window.CollectId) return;
  window.CollectId = '6ab6bdc7b9dd7aeb424b7192';
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://collectcdn.com/launcher.js';
  document.head.appendChild(script);
}
