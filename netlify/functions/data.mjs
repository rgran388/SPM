// Simple key-value storage endpoint backed by Netlify Blobs.
// GET  /.netlify/functions/data?key=KEY        -> { key, value }
// POST /.netlify/functions/data?key=KEY  body: { value: "..." } -> { ok: true }
//
// No accounts, API keys, or sign-in of any kind are needed to call this —
// it's just part of this site, like any other page on it.

import { getStore } from "@netlify/blobs";

const STORE_NAME = "spm-data";
const JSON_HEADERS = { "Content-Type": "application/json" };

export default async (req) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response(JSON.stringify({ error: "Missing 'key' query parameter" }), {
      status: 400,
      headers: JSON_HEADERS
    });
  }

  const store = getStore(STORE_NAME);

  try {
    if (req.method === "GET") {
      const value = await store.get(key);
      return new Response(
        JSON.stringify({ key, value: value === null || value === undefined ? null : value }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    if (req.method === "POST") {
      let parsed;
      try {
        parsed = await req.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: "Body must be valid JSON" }), {
          status: 400,
          headers: JSON_HEADERS
        });
      }
      await store.set(key, parsed.value);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Storage error", details: String(err) }), {
      status: 500,
      headers: JSON_HEADERS
    });
  }
};
