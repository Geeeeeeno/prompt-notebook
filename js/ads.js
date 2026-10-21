/**
 * AdSense 自動広告ローダ。
 * ID は js/ads-config.js から読む。空、または GitHub Pages では何も挿さない。
 * 手動の広告枠は置かない。
 */
(function () {
  const cfg = window.PROMPT_NOTEBOOK_ADS;
  const id = cfg && typeof cfg.publisherId === 'string' ? cfg.publisherId.trim() : '';
  if (!id) return;

  const host = location.hostname;
  if (host === 'github.io' || host.endsWith('.github.io')) return;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
    encodeURIComponent(id);
  document.head.appendChild(script);
})();
