// ==========================
//  金融数据 + Gossip 聚合 Worker
// ==========================
export default {
  async fetch(req) {
    const full = req.url;
    const idx = full.indexOf('?url=');
    const targetRaw = idx >= 0 ? full.substring(idx + 5) : null;
    const targetDecoded = targetRaw ? decodeURIComponent(targetRaw) : null;
    if (!targetDecoded) return new Response('missing url', { status: 400 });

    // ✅ 关键：不要 new URL()，直接透传原始字符串
    const allow = [
      'hq.sinajs.cn',
      'stooq.pl',
      'stooq.com',
      'cdn.cboe.com',
      'api.binance.com',
      'api.exchangerate.host',
      'api.frankfurter.app',
      'open.er-api.com',
      'query1.finance.yahoo.com',
      'query2.finance.yahoo.com'
    ];

    // 简单解析 host
    const host = targetDecoded.match(/https?:\/\/([^/]+)/i)?.[1] || '';
    if (!allow.includes(host)) {
      return new Response('forbidden host: ' + host, { status: 403 });
    }

    const headers = new Headers();
    headers.set(
      'User-Agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
    );
    if (host === 'hq.sinajs.cn') {
      headers.set('Referer', 'https://finance.sina.com.cn/');
      headers.set('Accept', '*/*');
      headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8');
    }
    if (host === 'cdn.cboe.com') {
      headers.set('Referer', 'https://www.cboe.com/');
      headers.set('Origin', 'https://www.cboe.com');
    }

    // ✅ 这里我们手动 new Request，禁止 Cloudflare 自动重组 URL
    const upstreamReq = new Request(targetDecoded, { method: 'GET', headers });
    const upstreamRes = await fetch(upstreamReq);

    const res = new Response(upstreamRes.body, upstreamRes);
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Headers', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.headers.set('Cache-Control', 'public, max-age=15');
    return res;
  }
};



// ========== Gossip 聚合模块 ==========
async function handleGossip(url) {
  const topic = (url.searchParams.get('topic') || 'btc').toLowerCase();
  const items = [];
  const tasks = [];

  // 源 1：CryptoPanic (仅 BTC)
  if (topic === 'btc') {
    const cp = `https://cryptopanic.com/api/v1/posts/?auth_token=${CRYPTO_PANIC_KEY}&currencies=BTC&filter=hot`;
    tasks.push(fetch(cp).then(r=>r.json()).then(j=>{
      (j?.results||[]).forEach(x=>{
        items.push({
          title: x.title,
          url: x.url,
          source: new URL(x.domain||x.source?.domain||x.url).host,
          ts: Date.parse(x.published_at||x.created_at||Date.now()),
          heat: (x.votes?.positive||0)-(x.votes?.negative||0),
          tag: 'cryptopanic'
        });
      });
    }).catch(()=>{}));
  }

  // 源 2：RSS
  const rssList = topic === 'btc'
    ? [
        'https://www.coindesk.com/arc/outboundfeeds/rss/',
        'https://decrypt.co/feed'
      ]
    : [
        'https://www.bensbites.co/feed.xml',
        'https://www.importai.com/feed/',
        'https://techcrunch.com/tag/artificial-intelligence/feed/'
      ];
  for (const feed of rssList) {
    tasks.push(fetch(feed, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      .then(r=>r.text())
      .then(txt=>simpleParseRSS(txt).slice(0,20).forEach(x=>{
        items.push({
          title: x.title,
          url: x.link,
          source: new URL(x.link).host,
          ts: Date.parse(x.pubDate||Date.now()),
          heat: 0,
          tag: 'rss'
        });
      })).catch(()=>{}));
  }

  // 源 3：Reddit
  const redditSub = topic === 'btc' ? 'Bitcoin' : 'MachineLearning';
  tasks.push(fetch(`https://www.reddit.com/r/${redditSub}/top.json?limit=20&t=day`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } })
    .then(r=>r.json()).then(j=>{
      (j?.data?.children||[]).forEach(p=>{
        const d = p.data;
        items.push({
          title: d.title,
          url: `https://www.reddit.com${d.permalink}`,
          source: 'reddit.com',
          ts: (d.created_utc||0)*1000,
          heat: d.ups||0,
          tag: 'reddit'
        });
      });
    }).catch(()=>{}));

  await Promise.allSettled(tasks);

  const spice = /leak|rumor|insider|alleged|传闻|爆料|流出|小道/i;
  const whitelist = /coindesk|decrypt|techcrunch|bensbites|importai|reddit/i;
  const scored = items.map(x=>{
    let score = Math.tanh((x.heat||0)/50)*0.6;
    if (spice.test(x.title)) score += 0.3;
    if (whitelist.test(x.source)) score += 0.2;
    return { ...x, score };
  });

  // 去重
  const seen = new Set();
  const dedup = [];
  for (const it of scored.sort((a,b)=>b.score-a.score)) {
    const key = it.title.replace(/[^\u4e00-\u9fa5a-z0-9]/gi,'').toLowerCase().slice(0,80);
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(it);
    if (dedup.length >= 20) break;
  }

  const top5 = dedup.sort((a,b)=>b.score-a.score).slice(0,5).map(x=>({
    title: x.title,
    url: x.url,
    source: x.source,
    time: new Date(x.ts||Date.now()).toISOString(),
    score: Number(x.score.toFixed(3))
  }));

  return json(top5, 300);
}

function simpleParseRSS(xml){
  const items = [];
  const reItem = /<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi;
  const re = (tag, s) => {
    const m = s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/g,'$1').trim() : '';
  };
  const links = s => {
    const m = s.match(/<link[^>]*?href="([^"]+)"/i) || s.match(/<link>([^<]+)<\/link>/i);
    return m ? m[1] : '';
  };
  (xml.match(reItem)||[]).forEach(it=>{
    items.push({
      title: re('title', it),
      link: links(it),
      pubDate: re('pubDate', it) || re('updated', it)
    });
  });
  return items;
}

function json(data, maxAge = 60) {
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${maxAge}`,
      // ✅ 加上 CORS 头，前端才能读到
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,HEAD,OPTIONS',
    }
  });
}



const CRYPTO_PANIC_KEY = 'YOUR_TOKEN_HERE'; // 你可不填，用RSS+Reddit也能跑
