const pickHeaders = (headers: Headers, keys: (string | RegExp)[]): Headers => {
  const picked = new Headers();
  for (const key of headers.keys()) {
    if (keys.some((k) => (typeof k === "string" ? k === key : k.test(key)))) {
      const value = headers.get(key);
      if (typeof value === "string") {
        picked.set(key, value);
      }
    }
  }
  return picked;
};

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

export default async function handleRequest(req: Request & { nextUrl?: URL }) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const { pathname, search } = req.nextUrl ? req.nextUrl : new URL(req.url);
  // Use the environment variable for the proxy URL
  const proxyBaseUrl = process.env.PROXY_URL || "https://api.openai.com"; // Fallback to a default URL if the environment variable is not set
  const url = new URL(pathname + search, proxyBaseUrl).href;
  // Simulate browser request by modifying the headers
  const newHeaders = new Headers(req.headers);
  newHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');
  newHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');

  // Use pickHeaders function to include relevant headers
  const headers = pickHeaders(newHeaders, ["content-type", "authorization"]);

  const res = await fetch(url, {
    body: req.body,
    method: req.method,
    headers,
  });

  const resHeaders = {
    ...CORS_HEADERS,
    ...Object.fromEntries(
      pickHeaders(res.headers, ["content-type", /^x-ratelimit-/, /^openai-/])
    ),
  };

  return new Response(res.body, {
    headers: resHeaders,
    status: res.status
  });
}
