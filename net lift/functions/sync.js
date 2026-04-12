import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const store = getStore("creatoros");
  const url = new URL(req.url);
  const method = req.method;

  // CORS headers for all responses
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    // GET /sync?key=xxx  → get one key
    // GET /sync?list=cos_  → list keys with prefix
    if (method === "GET") {
      const key = url.searchParams.get("key");
      const prefix = url.searchParams.get("list");

      if (prefix !== null) {
        const result = await store.list({ prefix });
        const keys = result.blobs.map((b) => b.key);
        return new Response(JSON.stringify({ keys }), { headers: cors });
      }

      if (key) {
        const value = await store.get(key);
        if (value === null) {
          return new Response(JSON.stringify({ value: null }), { headers: cors });
        }
        return new Response(JSON.stringify({ key, value }), { headers: cors });
      }
    }

    // POST /sync  body: { key, value }  → set key
    if (method === "POST") {
      const body = await req.json();
      const { key, value } = body;
      if (!key) return new Response(JSON.stringify({ error: "no key" }), { status: 400, headers: cors });
      await store.set(key, value);
      return new Response(JSON.stringify({ ok: true, key }), { headers: cors });
    }

    // DELETE /sync?key=xxx  → delete key
    if (method === "DELETE") {
      const key = url.searchParams.get("key");
      if (!key) return new Response(JSON.stringify({ error: "no key" }), { status: 400, headers: cors });
      await store.delete(key);
      return new Response(JSON.stringify({ ok: true, key }), { headers: cors });
    }

    return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: cors });

  } catch (e) {
    console.error("Sync error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
};

export const config = { path: "/sync" };
