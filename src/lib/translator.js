// Simple translation cache and engine using MyMemory free API
const cache = {};

export async function translateText(text, targetLang) {
  if (!text || !text.trim() || targetLang === 'en') return text;
  const key = `${targetLang}:${text}`;
  if (cache[key]) return cache[key];

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
  const res = await fetch(url);
  const data = await res.json();
  const translated = data?.responseData?.translatedText || text;
  cache[key] = translated;
  return translated;
}

export async function translateNodes(targetLang) {
  if (targetLang === 'en') return;

  // Walk all visible text nodes in the document body
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        // Skip scripts, styles, hidden elements, already-translated nodes
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (parent.dataset.translated === targetLang) return NodeFilter.FILTER_REJECT;
        const txt = node.textContent.trim();
        if (!txt) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }

  // Batch translate in chunks to avoid rate limits
  const CHUNK = 10;
  for (let i = 0; i < nodes.length; i += CHUNK) {
    const chunk = nodes.slice(i, i + CHUNK);
    await Promise.all(chunk.map(async (n) => {
      const original = n.textContent;
      const trimmed = original.trim();
      if (!trimmed) return;
      const translated = await translateText(trimmed, targetLang);
      if (translated && translated !== trimmed) {
        n.textContent = original.replace(trimmed, translated);
        if (n.parentElement) n.parentElement.dataset.translated = targetLang;
      }
    }));
  }
}