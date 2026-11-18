(() => {
  const selector = [
    '[id*="ad-"]', '[id^="ad_"]', '[class*="ad-banner"]', '[class*="advert"]',
    '[class*="sponsor"]', '[data-ad]', 'iframe[src*="doubleclick"]'
  ].join(',');

  const hideAds = () => {
    document.querySelectorAll(selector).forEach((node) => {
      node.style.setProperty('display', 'none', 'important');
    });
  };

  const applyDarkMode = (enabled) => {
    let style = document.getElementById('erto-dark-reader');
    if (!enabled) {
      if (style) style.remove();
      return;
    }
    if (!style) {
      style = document.createElement('style');
      style.id = 'erto-dark-reader';
      style.textContent = 'html{filter:invert(.92) hue-rotate(180deg)!important;background:#0b1220!important}img,video,picture,canvas{filter:invert(1) hue-rotate(180deg)!important}';
      (document.head || document.documentElement).appendChild(style);
    }
  };

  hideAds();
  new MutationObserver(hideAds).observe(document.documentElement, { childList: true, subtree: true });

  try {
    const nativePort = browser.runtime.connectNative('erto');
    nativePort.onMessage.addListener((message) => {
      if (message && message.type === 'darkMode') applyDarkMode(Boolean(message.enabled));
    });
    nativePort.postMessage({ type: 'pageReady' });
  } catch (_) {
    // Native messaging is available only in the built-in GeckoView extension.
  }
})();
