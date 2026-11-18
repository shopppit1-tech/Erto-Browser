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

  hideAds();
  new MutationObserver(hideAds).observe(document.documentElement, { childList: true, subtree: true });
})();
