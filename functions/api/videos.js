const CHANNEL_ID = "UCPCCz9BK5MQDnhO8OnXptFA";

export async function onRequest(context) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
  try {
    const resp = await fetch(rssUrl, {
      cf: { cacheTtl: 3600, cacheEverything: true },
      headers: { "User-Agent": "Mozilla/5.0 (PioneiroTerras Pages Function)" },
    });
    if (!resp.ok) {
      return json({ error: "Falha ao buscar o feed", status: resp.status }, 502);
    }
    const xml = await resp.text();
    const videos = parseFeed(xml).slice(0, 6);
    return json({ videos }, 200);
  } catch (err) {
    return json({ error: "Erro interno", detail: String(err) }, 500);
  }
}

function parseFeed(xml) {
  const entries = [];
  const blocks = xml.split("<entry>").slice(1);
  for (const block of blocks) {
    const id = pick(block, "<yt:videoId>", "</yt:videoId>");
    const title = decode(pick(block, "<title>", "</title>"));
    const published = pick(block, "<published>", "</published>");
    if (!id) continue;
    entries.push({
      id,
      title,
      published,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
  }
  return entries;
}

function pick(text, open, close) {
  const start = text.indexOf(open);
  if (start === -1) return "";
  const from = start + open.length;
  const end = text.indexOf(close, from);
  if (end === -1) return "";
  return text.slice(from, end).trim();
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=600",
    },
  });
}