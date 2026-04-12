const { getStore } = require("@netlify/blobs");

exports.handler = async function(event, context) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  try {
    const store = getStore("creator-os");
    const params = new URLSearchParams(event.queryStringParameters || {});
    const key = params.get("key");
    const list = params.get("list");

    if (event.httpMethod === "GET") {
      if (list !== null) {
        const result = await store.list({ prefix: list });
        const keys = result.blobs.map(b => b.key);
        return { statusCode: 200, headers: cors, body: JSON.stringify({ keys }) };
      }
      if (key) {
        const value = await store.get(key);
        if (value === null) {
          return { statusCode: 200, headers: cors, body: JSON.stringify({ value: null }) };
        }
        return { statusCode: 200, headers: cors, body: JSON.stringify({ key, value }) };
      }
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      const { key, value } = body;
      if (!key) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "no key" }) };
      await store.set(key, value);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, key }) };
    }

    if (event.httpMethod === "DELETE") {
      if (!key) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "no key" }) };
      await store.delete(key);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, key }) };
    }

    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "method not allowed" }) };

  } catch (e) {
    console.error("Sync error:", e);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(e) }) };
  }
};
