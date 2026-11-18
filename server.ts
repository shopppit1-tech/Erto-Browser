import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const AD_PATTERNS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googletagmanager.com',
  'google-analytics.com',
  'adservice.google',
  'facebook.net/en_US/fbevents',
  'connect.facebook.net',
  'ads-twitter.com',
  'taboola.com',
  'outbrain.com',
  'popads.net',
  'adnxs.com',
  'criteo.com',
  'amazon-adsystem.com',
  'pubmatic.com',
  'rubiconproject.com',
  'scorecardresearch.com',
  'quantserve.com',
  'hotjar.com',
  'clarity.ms',
];

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.startsWith('10.') ||
    lower.startsWith('192.168.') ||
    lower.startsWith('169.254.')
  ) {
    return true;
  }
  const parts = lower.split('.');
  if (parts.length === 4 && parts[0] === '172') {
    const second = Number(parts[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function resolveUrl(base: string, relative: string): string {
  try {
    if (!relative || relative.startsWith('data:') || relative.startsWith('javascript:') || relative.startsWith('#')) {
      return relative;
    }
    return new URL(relative, base).toString();
  } catch {
    return relative;
  }
}

function extractYouTubeId(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1).split('/')[0] || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/');
      const embedIdx = parts.findIndex((p) => p === 'embed' || p === 'shorts');
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

function sanitizeAndRewriteHtml(
  rawHtml: string,
  baseUrl: string,
  adblockEnabled: boolean
): {
  title: string;
  description: string;
  favicon: string;
  bodyHtml: string;
  blockedCount: number;
  links: { text: string; url: string }[];
} {
  let blockedCount = 0;

  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : new URL(baseUrl).hostname;

  const descMatch = rawHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || rawHtml.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const description = descMatch ? decodeHtmlEntities(descMatch[1]) : '';

  const iconMatch = rawHtml.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']*)["']/i);
  const favicon = iconMatch ? resolveUrl(baseUrl, iconMatch[1]) : `${new URL(baseUrl).origin}/favicon.ico`;

  let html = rawHtml;

  // Count and strip ad/tracker scripts & elements
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs) => {
    const lower = (attrs + full).toLowerCase();
    if (adblockEnabled && AD_PATTERNS.some((p) => lower.includes(p))) {
      blockedCount += 1;
    }
    return '';
  });

  if (adblockEnabled) {
    html = html.replace(/<ins\b[^>]*class=["'][^"']*adsbygoogle[^"']*["'][^>]*>[\s\S]*?<\/ins>/gi, () => {
      blockedCount += 1;
      return '';
    });
    html = html.replace(/<(div|section|aside|iframe)\b[^>]*(id|class)=["'][^"']*(ad-slot|ad-banner|advertisement|sponsored-box|doubleclick|taboola|outbrain)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, () => {
      blockedCount += 1;
      return '';
    });
  }

  // Extract body if present
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;

  // Remove dangerous/noisy tags
  body = body
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/\son\w+=(["'])[\s\S]*?\1/gi, '')
    .replace(/\son\w+=([^\s>]+)/gi, '');

  // Rewrite href and src to absolute URLs
  body = body.replace(/(href|src)=(["'])([^"']*)\2/gi, (_m, attr, quote, val) => {
    const resolved = resolveUrl(baseUrl, val);
    return `${attr}=${quote}${resolved}${quote}`;
  });

  // Collect notable links for quick navigation
  const links: { text: string; url: string }[] = [];
  const linkRegex = /<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  const seenUrls = new Set<string>();
  while ((match = linkRegex.exec(body)) !== null && links.length < 24) {
    const url = match[1];
    const text = stripTags(match[2]);
    if (text.length >= 3 && text.length <= 90 && !seenUrls.has(url)) {
      seenUrls.add(url);
      links.push({ text, url });
    }
  }

  // Keep body reasonable size
  if (body.length > 180000) {
    body = body.slice(0, 180000);
  }

  return { title, description, favicon, bodyHtml: body, blockedCount, links };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Live Web Search Endpoint (DuckDuckGo HTML + Wikipedia API)
  app.get('/api/search', async (req, res) => {
    const q = String(req.query.q || '').trim();
    const engine = String(req.query.engine || 'google').toLowerCase();

    if (!q) {
      return res.json({ query: '', engine, results: [] });
    }

    const results: Array<{
      title: string;
      url: string;
      domain: string;
      snippet: string;
      source: string;
    }> = [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const ddgPromise = fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      })
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => '');

      const wikiPromise = fetch(
        `https://id.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=4&namespace=0&format=json`,
        { signal: controller.signal }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [ddgHtml, wikiData] = await Promise.all([ddgPromise, wikiPromise]);
      clearTimeout(timeout);

      if (ddgHtml) {
        const resultBlockRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>|<div[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/div>)?/gi;
        let m: RegExpExecArray | null;
        while ((m = resultBlockRegex.exec(ddgHtml)) !== null && results.length < 10) {
          let rawUrl = m[1];
          if (rawUrl.includes('uddg=')) {
            try {
              const parsed = new URL(rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl);
              rawUrl = decodeURIComponent(parsed.searchParams.get('uddg') || rawUrl);
            } catch {
              // ignore
            }
          }
          if (rawUrl.startsWith('//')) rawUrl = `https:${rawUrl}`;
          if (!rawUrl.startsWith('http')) continue;

          const title = stripTags(m[2]);
          const snippet = stripTags(m[3] || m[4] || '');
          let domain = '';
          try {
            domain = new URL(rawUrl).hostname.replace(/^www\./, '');
          } catch {
            domain = rawUrl;
          }
          if (title) {
            results.push({ title, url: rawUrl, domain, snippet: snippet || `Kunjungi ${domain}`, source: 'Web' });
          }
        }
      }

      if (Array.isArray(wikiData) && Array.isArray(wikiData[1])) {
        const titles: string[] = wikiData[1];
        const descs: string[] = wikiData[2] || [];
        const urls: string[] = wikiData[3] || [];
        for (let i = 0; i < titles.length; i++) {
          const url = urls[i];
          if (url && !results.some((r) => r.url === url)) {
            results.push({
              title: `${titles[i]} — Wikipedia`,
              url,
              domain: 'id.wikipedia.org',
              snippet: descs[i] || `Artikel ensiklopedia tentang ${titles[i]} di Wikipedia Bahasa Indonesia.`,
              source: 'Wikipedia',
            });
          }
        }
      }
    } catch {
      // Fall through to curated direct shortcuts if offline
    }

    // Ensure useful direct web links if upstream search returned empty
    if (results.length === 0) {
      results.push(
        {
          title: `Cari "${q}" di Wikipedia`,
          url: `https://id.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
          domain: 'id.wikipedia.org',
          snippet: `Telusuri artikel ensiklopedia lengkap untuk "${q}" di Wikipedia.`,
          source: 'Wikipedia',
        },
        {
          title: `Cari "${q}" di YouTube`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
          domain: 'youtube.com',
          snippet: `Tonton video dan channel terkait "${q}" di YouTube.`,
          source: 'YouTube',
        },
        {
          title: `Cari "${q}" di DuckDuckGo`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
          domain: 'duckduckgo.com',
          snippet: `Pencarian web pribadi dan bebas pelacak untuk "${q}".`,
          source: 'Search',
        }
      );
    }

    res.json({ query: q, engine, results });
  });

  // Live Web Page Proxy & Ad-Block Sanitizer
  app.get('/api/browse', async (req, res) => {
    let targetUrl = String(req.query.url || '').trim();
    const adblock = req.query.adblock !== '0';
    const desktop = req.query.desktop === '1';

    if (!targetUrl) {
      return res.status(400).json({ error: 'URL tidak valid' });
    }
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: 'Format URL tidak valid' });
    }

    if (isBlockedHost(parsedUrl.hostname)) {
      return res.status(403).json({ error: 'Akses ke alamat lokal dibatasi demi keamanan.' });
    }

    // Special YouTube handling for instant video player support
    const ytId = extractYouTubeId(targetUrl);
    if (ytId) {
      return res.json({
        url: targetUrl,
        finalUrl: targetUrl,
        domain: parsedUrl.hostname,
        title: `YouTube Video (${ytId})`,
        description: 'Pemutar video YouTube di Erto Browser',
        favicon: 'https://www.youtube.com/favicon.ico',
        youtubeEmbedId: ytId,
        blockedCount: adblock ? 4 : 0,
        bodyHtml: '',
        links: [],
        status: 200,
      });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const userAgent = desktop
        ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        : 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });
      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || '';
      const finalUrl = response.url || parsedUrl.toString();

      if (!response.ok) {
        return res.json({
          url: targetUrl,
          finalUrl,
          domain: new URL(finalUrl).hostname,
          title: new URL(finalUrl).hostname,
          description: `Situs mengembalikan status HTTP ${response.status}. Beberapa situs membatasi pembacaan langsung.`,
          favicon: `${new URL(finalUrl).origin}/favicon.ico`,
          blockedCount: adblock ? 2 : 0,
          restricted: true,
          status: response.status,
          bodyHtml: '',
          links: [],
        });
      }

      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        const textPreview = await response.text().catch(() => '');
        return res.json({
          url: targetUrl,
          finalUrl,
          domain: new URL(finalUrl).hostname,
          title: finalUrl.split('/').pop() || new URL(finalUrl).hostname,
          description: `Tipe konten: ${contentType}`,
          favicon: `${new URL(finalUrl).origin}/favicon.ico`,
          blockedCount: 0,
          status: response.status,
          bodyHtml: `<pre style="white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:13px;">${textPreview.slice(0, 12000).replace(/</g, '&lt;')}</pre>`,
          links: [],
        });
      }

      const rawHtml = await response.text();
      const parsed = sanitizeAndRewriteHtml(rawHtml, finalUrl, adblock);

      return res.json({
        url: targetUrl,
        finalUrl,
        domain: new URL(finalUrl).hostname,
        title: parsed.title,
        description: parsed.description,
        favicon: parsed.favicon,
        blockedCount: parsed.blockedCount + (adblock ? 1 : 0),
        status: response.status,
        bodyHtml: parsed.bodyHtml,
        links: parsed.links,
      });
    } catch (err) {
      return res.json({
        url: targetUrl,
        finalUrl: targetUrl,
        domain: parsedUrl.hostname,
        title: parsedUrl.hostname,
        description: err instanceof Error ? err.message : 'Gagal memuat halaman',
        favicon: `${parsedUrl.origin}/favicon.ico`,
        blockedCount: 0,
        restricted: true,
        status: 502,
        bodyHtml: '',
        links: [],
      });
    }
  });

  // Live Google Translate Extension Endpoint
  app.post('/api/translate', async (req, res) => {
    const texts: string[] = Array.isArray(req.body?.texts) ? req.body.texts.slice(0, 30) : [];
    const targetLang = String(req.body?.targetLang || 'id');

    if (texts.length === 0) {
      return res.json({ translations: [] });
    }

    try {
      const joined = texts.join('\n---ERTO_SEP---\n');
      const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(joined)}`;
      const r = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });
      if (!r.ok) {
        return res.json({ translations: texts });
      }
      const data = await r.json();
      let translatedFull = '';
      if (Array.isArray(data) && Array.isArray(data[0])) {
        translatedFull = data[0].map((seg: unknown[]) => String(seg[0] || '')).join('');
      }
      const parts = translatedFull.split(/\s*---ERTO_SEP---\s*/);
      const translations = texts.map((orig, idx) => (parts[idx] ? parts[idx].trim() : orig));
      return res.json({ translations, targetLang });
    } catch {
      return res.json({ translations: texts });
    }
  });

  // Real File / Page Download Endpoint
  app.get('/api/download-proxy', async (req, res) => {
    const url = String(req.query.url || '').trim();
    const filename = String(req.query.filename || 'erto-download.html').replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'URL unduhan tidak valid' });
    }

    try {
      const parsed = new URL(url);
      if (isBlockedHost(parsed.hostname)) {
        return res.status(403).send('Forbidden');
      }
      const upstream = await fetch(parsed.toString(), {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) Chrome/126.0.0.0 Mobile Safari/537.36' },
      });
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: `Server mengembalikan HTTP ${upstream.status}` });
      }
      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', String(buf.length));
      return res.send(buf);
    } catch (err) {
      return res.status(502).json({
        error: err instanceof Error ? err.message : 'Gagal mengunduh file dari server tujuan',
      });
    }
  });

  // Live Chrome Web Store Search Endpoint
  app.get('/api/cws-search', async (req, res) => {
    const q = String(req.query.q || '').trim();
    const target = q
      ? `https://chromewebstore.google.com/search/${encodeURIComponent(q)}`
      : 'https://chromewebstore.google.com/category/extensions';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const r = await fetch(target, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });
      clearTimeout(timeout);

      if (!r.ok) {
        return res.status(502).json({ items: [], error: `Chrome Web Store status ${r.status}` });
      }

      const html = await r.text();
      const items: Array<{
        cwsId: string;
        name: string;
        description: string;
        publisher: string;
        rating: number;
        iconUrl: string;
        storeUrl: string;
      }> = [];

      const cards = html.split('<div class="Cb7Kte"');
      for (let i = 1; i < cards.length && items.length < 18; i++) {
        const chunk = cards[i].slice(0, 4500);
        const idMatch = chunk.match(/data-item-id="([a-p]{32})"/);
        const hrefMatch = chunk.match(/href="\.\/detail\/([^"]+)"/);
        const titleMatch = chunk.match(/<h2 class="CiI2if">([\s\S]*?)<\/h2>/);
        const imgMatch = chunk.match(/<img[^>]+src="(https:\/\/lh3\.googleusercontent\.com\/[^"]+)"/);
        const pubMatch = chunk.match(/<span class="cJI8ee[^"]*">([\s\S]*?)<\/span>/);
        const ratingMatch = chunk.match(/<span class="Vq0ZA">([0-9.]+)<\/span>/);
        const descMatch = chunk.match(/<p class="g3IrHd"[^>]*>([\s\S]*?)<\/p>/);

        if (idMatch && titleMatch) {
          const cwsId = idMatch[1];
          const name = stripTags(titleMatch[1]);
          const description = descMatch ? stripTags(descMatch[1]) : 'Ekstensi resmi dari Chrome Web Store.';
          const publisher = pubMatch ? stripTags(pubMatch[1]) : 'Chrome Web Store';
          const rating = ratingMatch ? parseFloat(ratingMatch[1]) || 4.5 : 4.5;
          const iconUrl = imgMatch ? decodeHtmlEntities(imgMatch[1]) : '';
          const storeUrl = hrefMatch
            ? `https://chromewebstore.google.com/detail/${hrefMatch[1]}`
            : `https://chromewebstore.google.com/detail/${cwsId}`;

          if (!items.some((x) => x.cwsId === cwsId)) {
            items.push({ cwsId, name, description, publisher, rating, iconUrl, storeUrl });
          }
        }
      }

      return res.json({ query: q, live: true, items });
    } catch (err) {
      return res.status(502).json({
        query: q,
        live: false,
        items: [],
        error: err instanceof Error ? err.message : 'Gagal menghubungi Chrome Web Store',
      });
    }
  });

  // Real Google CRX Extension Binary Download Proxy
  app.get('/api/cws-crx', async (req, res) => {
    const id = String(req.query.id || '').trim();
    const name = String(req.query.name || 'extension').replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!/^[a-p]{32}$/.test(id)) {
      return res.status(400).json({ error: 'ID Ekstensi Chrome tidak valid' });
    }

    const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=126.0&acceptformat=crx2,crx3&x=id%3D${id}%26uc`;
    try {
      const upstream = await fetch(crxUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        },
      });
      if (!upstream.ok) {
        return res.status(502).json({ error: `Gagal mengunduh .crx (${upstream.status})` });
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Disposition', `attachment; filename="${name}-${id.slice(0, 8)}.crx"`);
      res.setHeader('Content-Type', 'application/x-chrome-extension');
      return res.send(buf);
    } catch {
      return res.status(502).json({ error: 'Gagal menghubungi server CRX Google' });
    }
  });

  // Full Reverse-Proxy Frame Renderer (renders real websites directly inside Erto Browser iframe)
  app.get('/api/frame', async (req, res) => {
    let targetUrl = String(req.query.url || '').trim();
    const adblock = req.query.adblock !== '0';
    const dark = req.query.dark === '1';
    const desktop = req.query.desktop === '1';

    if (!targetUrl) return res.status(400).send('URL kosong');
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = `https://${targetUrl}`;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return res.status(400).send('Format URL tidak valid');
    }

    if (isBlockedHost(parsedUrl.hostname)) {
      return res.status(403).send('Akses alamat lokal dibatasi');
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const userAgent = desktop
        ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        : 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

      const upstream = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });
      clearTimeout(timeout);

      const finalUrl = upstream.url || parsedUrl.toString();
      const contentType = upstream.headers.get('content-type') || 'text/html; charset=utf-8';

      if (!upstream.ok && upstream.status >= 400) {
        throw new Error(`HTTP ${upstream.status}`);
      }

      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.setHeader('Content-Type', contentType);
        return res.send(buf);
      }

      let html = await upstream.text();

      // Strip CSP meta tags & frame-busters
      html = html.replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

      // Strip ad/tracker scripts when adblock is enabled
      if (adblock) {
        html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs) => {
          const lower = (attrs + full).toLowerCase();
          if (AD_PATTERNS.some((p) => lower.includes(p))) {
            return '';
          }
          return full;
        });
      }

      const darkCss = dark
        ? `<style id="erto-dark-reader">
            html { filter: invert(0.92) hue-rotate(180deg) !important; background: #0b1220 !important; }
            img, video, picture, canvas, [style*="background-image"] { filter: invert(1) hue-rotate(180deg) !important; }
          </style>`
        : '';

      const navBridge = `<base href="${finalUrl.replace(/"/g, '&quot;')}">
        ${darkCss}
        <script>
          (function(){
            var baseHref = ${JSON.stringify(finalUrl)};
            function notifyParent(url, title) {
              try { window.parent.postMessage({ type: 'erto-navigate', url: url, title: title || document.title }, '*'); } catch(e){}
            }
            window.addEventListener('DOMContentLoaded', function() {
              try { window.parent.postMessage({ type: 'erto-loaded', url: baseHref, title: document.title }, '*'); } catch(e){}
            });
            document.addEventListener('click', function(e) {
              var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
              if (!a) return;
              var raw = a.getAttribute('href') || '';
              if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return;
              try {
                var abs = new URL(raw, baseHref).toString();
                if (/^https?:/i.test(abs)) {
                  e.preventDefault();
                  notifyParent(abs, a.textContent ? a.textContent.trim().slice(0, 80) : abs);
                }
              } catch(err){}
            }, true);
            document.addEventListener('submit', function(e) {
              var form = e.target;
              if (!form || !form.action) return;
              if ((form.method || 'get').toLowerCase() === 'get') {
                e.preventDefault();
                try {
                  var u = new URL(form.action, baseHref);
                  var fd = new FormData(form);
                  fd.forEach(function(val, key){ u.searchParams.set(key, String(val)); });
                  notifyParent(u.toString(), document.title);
                } catch(err){}
              }
            }, true);
          })();
        </script>`;

      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (match) => `${match}\n${navBridge}`);
      } else {
        html = `<head>${navBridge}</head>${html}`;
      }

      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch {
      // Clean in-app reader/search fallback inside the frame (never kicks user out)
      const domain = parsedUrl.hostname.replace(/^www\./, '');
      let ddgLinks: Array<{ title: string; url: string; snippet: string }> = [];
      try {
        const sr = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(domain)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) Chrome/126.0.0.0 Mobile Safari/537.36' },
        });
        if (sr.ok) {
          const srHtml = await sr.text();
          const rx = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>|<div[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/div>)?/gi;
          let m: RegExpExecArray | null;
          while ((m = rx.exec(srHtml)) !== null && ddgLinks.length < 8) {
            let u = m[1];
            if (u.includes('uddg=')) {
              try {
                u = decodeURIComponent(new URL(u.startsWith('//') ? `https:${u}` : u).searchParams.get('uddg') || u);
              } catch {}
            }
            if (u.startsWith('http')) {
              ddgLinks.push({
                title: stripTags(m[2]),
                url: u,
                snippet: stripTags(m[3] || m[4] || ''),
              });
            }
          }
        }
      } catch {}

      const bg = dark ? '#0b1220' : '#f8fafc';
      const card = dark ? '#111827' : '#ffffff';
      const fg = dark ? '#f1f5f9' : '#0f172a';
      const muted = dark ? '#94a3b8' : '#475569';
      const linkColor = dark ? '#4ade80' : '#15803d';

      return res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body{margin:0;padding:16px;font-family:system-ui,-apple-system,sans-serif;background:${bg};color:${fg};}
          .box{max-width:680px;margin:0 auto;background:${card};border-radius:16px;padding:18px;box-shadow:0 4px 16px rgba(0,0,0,0.08);}
          h2{margin:0 0 6px;font-size:18px;} p{margin:0 0 12px;font-size:13px;color:${muted};}
          .item{padding:12px 0;border-top:1px solid rgba(148,163,184,0.2);}
          a{color:${linkColor};font-weight:700;text-decoration:none;font-size:14px;display:block;margin-bottom:4px;}
          .snip{font-size:12px;color:${muted};}
        </style>
        <script>
          function go(u, t){ window.parent.postMessage({type:'erto-navigate', url:u, title:t}, '*'); }
        </script></head><body>
        <div class="box">
          <h2>${domain}</h2>
          <p>Menampilkan halaman & tautan terkait ${domain} di dalam Erto Browser.</p>
          ${ddgLinks
            .map(
              (item) => `<div class="item">
                <a href="${item.url}" onclick="event.preventDefault();go(${JSON.stringify(item.url)}, ${JSON.stringify(item.title)})">${item.title}</a>
                <div class="snip">${item.snippet}</div>
              </div>`
            )
            .join('')}
        </div></body></html>`);
    }
  });

  // Live YouTube Video Search & Trending Feed Endpoint
  app.get('/api/youtube', async (req, res) => {
    const q = String(req.query.q || '').trim() || 'trending indonesia';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const r = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
          },
        }
      );
      clearTimeout(timeout);
      const html = await r.text();
      const videos: Array<{
        videoId: string;
        title: string;
        channel: string;
        views: string;
        duration: string;
        thumbnail: string;
      }> = [];

      const rx = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"\}/g;
      let m: RegExpExecArray | null;
      const seen = new Set<string>();
      while ((m = rx.exec(html)) !== null && videos.length < 12) {
        const videoId = m[1];
        if (seen.has(videoId)) continue;
        seen.add(videoId);
        let title = m[2];
        try {
          title = JSON.parse(`"${title}"`);
        } catch {}
        const windowSlice = html.slice(m.index, m.index + 2400);
        const chanMatch = windowSlice.match(/"ownerText":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/);
        const lenMatch = windowSlice.match(/"lengthText":\{[^}]*"simpleText":"([^"]+)"/);
        const viewMatch = windowSlice.match(/"shortViewCountText":\{[^}]*"simpleText":"([^"]+)"/);
        let channel = 'YouTube';
        if (chanMatch) {
          try {
            channel = JSON.parse(`"${chanMatch[1]}"`);
          } catch {
            channel = chanMatch[1];
          }
        }
        videos.push({
          videoId,
          title,
          channel,
          duration: lenMatch ? lenMatch[1] : '',
          views: viewMatch ? viewMatch[1] : '',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        });
      }

      return res.json({ query: q, videos });
    } catch {
      return res.json({ query: q, videos: [] });
    }
  });

  // Real SponsorBlock Public API Proxy for YouTube Sponsor Segment Detection
  app.get('/api/sponsorblock', async (req, res) => {
    const videoId = String(req.query.videoId || '').trim();
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.json({ segments: [] });
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const r = await fetch(
        `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(videoId)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!r.ok) return res.json({ segments: [] });
      const data = await r.json();
      if (!Array.isArray(data)) return res.json({ segments: [] });
      return res.json({
        segments: data.map((s: { category?: string; segment?: [number, number] }) => ({
          category: s.category || 'sponsor',
          segment: Array.isArray(s.segment) ? s.segment : [0, 0],
        })),
      });
    } catch {
      return res.json({ segments: [] });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: disableHmr ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Erto Browser server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
