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
    const params = event.queryStringParameters || {};
    const key = params.key;
    const list = params.list;

    if (event.httpMethod === "GET") {
      if (list !== undefined) {
        const result = await store.list({ prefix: list });
        const keys = result.blobs.map(b => b.key);
        return { statusCode: 200, headers: cors, body: JSON.stringify({ keys }) };
      }
      if (key) {
        const value = await store.get(key);
        return { statusCode: 200, headers: cors, body: JSON.stringify({ key, value: value ?? null }) };
      }
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      if (!body.key) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "no key" }) };
      await store.set(body.key, body.value);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === "DELETE") {
      if (!key) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "no key" }) };
      await store.delete(key);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "method not allowed" }) };

  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(e) }) };
  }
};
