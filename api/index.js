export const config = { runtime: "edge" };

// BOOT=http://xray.bigderag.ir:8008
const BACKEND = (process.env.BOOT || "http://xray.bigderag.ir:8008").replace(/\/$/, "");

const DROP = new Set([
  "host", "connection", "keep-alive",
  "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade",
  "forwarded", "x-forwarded-host", "x-forwarded-proto", "x-forwarded-port",
]);

function landing() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Boos – Quick Notes</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fafaf8;color:#1a1a1a;min-height:100vh;display:flex;flex-direction:column}
    header{padding:18px 32px;background:#fff;border-bottom:1px solid #ebebeb;display:flex;align-items:center;justify-content:space-between}
    .logo{font-size:1.1rem;font-weight:700;letter-spacing:-.3px}.logo span{color:#f59e0b}
    nav{display:flex;gap:20px;font-size:.85rem}
    nav a{color:#888;text-decoration:none}nav a:hover{color:#1a1a1a}
    main{flex:1;max-width:680px;margin:60px auto;padding:0 20px;width:100%}
    h1{font-size:1.9rem;font-weight:800;margin-bottom:8px;letter-spacing:-.5px}
    .desc{color:#666;font-size:.95rem;line-height:1.6;margin-bottom:32px}
    .card{background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
    .card h3{font-size:.95rem;font-weight:600;margin-bottom:6px}
    .card p{font-size:.85rem;color:#888;line-height:1.5}
    .card .date{font-size:.75rem;color:#bbb;margin-top:10px}
    .cta{display:inline-block;margin-top:28px;padding:10px 22px;background:#1a1a1a;color:#fff;border-radius:8px;font-size:.88rem;text-decoration:none}
    footer{padding:24px;text-align:center;font-size:.75rem;color:#ccc;border-top:1px solid #ebebeb}
  </style>
</head>
<body>
  <header>
    <div class="logo">📝 <span>Boos</span> Notes</div>
    <nav><a href="#">Home</a><a href="#">About</a><a href="#">Contact</a></nav>
  </header>
  <main>
    <h1>Your notes, always with you.</h1>
    <p class="desc">A simple and fast place to write down your thoughts, ideas, and reminders. No signup needed.</p>
    <div class="card"><h3>Welcome to Boos Notes 👋</h3><p>Start writing your first note. Everything stays private and loads instantly.</p><div class="date">Today</div></div>
    <div class="card"><h3>Tip: Keep it short</h3><p>The best notes are quick and to the point. Use this space however works for you.</p><div class="date">Yesterday</div></div>
    <a class="cta" href="#">New Note</a>
  </main>
  <footer>© 2025 Boos Notes. Simple by design.</footer>
</body>
</html>`, {
    headers: {
      "content-type": "text/html;charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

function buildHeaders(req) {
  const headers = new Headers();
  let ip = null;
  for (const [k, v] of req.headers) {
    if (DROP.has(k) || k.startsWith("x-vercel-")) continue;
    if (k === "x-real-ip") { ip = ip || v; continue; }
    if (k === "x-forwarded-for") { ip = ip || v; continue; }
    headers.set(k, v);
  }
  if (ip) headers.set("x-forwarded-for", ip);
  return headers;
}

export default async function handler(req) {
  const { pathname } = new URL(req.url);

  if (req.method === "GET" && (pathname === "/" || pathname === "")) {
    return landing();
  }

  try {
    const path = req.url.slice(req.url.indexOf("/", 8));
    const method = req.method;
    const hasBody = method !== "GET" && method !== "HEAD";

    const res = await fetch(BACKEND + path, {
      method,
      headers: buildHeaders(req),
      body: hasBody ? req.body : undefined,
      duplex: "half",
      redirect: "manual",
    });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
