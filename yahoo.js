export default {
  async fetch(req) {
    // 统一 CORS 处理（含预检）
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'GET,HEAD,OPTIONS',
        },
      });
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

    // --------- /sina?list=sh000001 或 list=sh000001,sz399001,rt_hkHSI ----------
    if (pathname === '/sina') {
      const list = url.searchParams.get('list'); // 支持逗号分隔多个
      if (!list) return bad(400, 'missing list');
      const target = `https://hq.sinajs.cn/list=${list}&_=${Date.now()}`;

      const headers = new Headers();
      headers.set('User-Agent', UA());
      headers.set('Referer', 'https://finance.sina.com.cn/');
      headers.set('Accept', '*/*');
      headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8');

      const r = await fetch(target, { headers });
      return cors(r.body, r.headers.get('content-type') || 'text/plain; charset=gb18030', 15);
    }

    // --------- /yahoo/chart?symbol=000001.SS&range=1d&interval=1d ----------
    if (pathname === '/yahoo/chart') {
      const symbol   = url.searchParams.get('symbol');
      const range    = url.searchParams.get('range')    || '1d';
      const interval = url.searchParams.get('interval') || '1d';
      if (!symbol) return bad(400, 'missing symbol');

      // 服务端拼 URL，避免浏览器端 CORS
      const target = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

      const headers = new Headers();
      headers.set('User-Agent', UA());
      headers.set('Accept', 'application/json, text/plain, */*');

      const r = await fetch(target, { headers });
      return cors(r.body, 'application/json; charset=utf-8', 15);
    }

    return bad(404, 'not found');
  }
};

function UA() {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
}

function cors(body, contentType, maxAge = 60) {
  return new Response(body, {
    headers: {
      'content-type': contentType,
      'cache-control': `public, max-age=${maxAge}`,
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,HEAD,OPTIONS',
    }
  });
}

function bad(code, msg) {
  return new Response(msg, {
    status: code,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'access-control-allow-origin': '*',
    }
  });
}
