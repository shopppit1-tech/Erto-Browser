const blockedHosts = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "adservice.google.com",
  "taboola.com",
  "outbrain.com",
  "popads.net",
  "adnxs.com",
  "criteo.com",
  "amazon-adsystem.com",
  "pubmatic.com",
  "rubiconproject.com",
  "scorecardresearch.com",
  "quantserve.com"
];

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const host = new URL(details.url).hostname.toLowerCase();
      return blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))
        ? { cancel: true }
        : {};
    } catch (_) {
      return {};
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);
