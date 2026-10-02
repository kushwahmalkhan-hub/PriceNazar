// PriceNazar admin API (Vercel serverless function)
// Needs these Environment Variables in Vercel:
//   SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD
import crypto from "crypto";

const MAX_BULK = 1000;
const COLS = "id,name,category,description,price,image,amazon_link,flipkart_link,search_terms";

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function authHeaders(key, extra) {
  const h = { apikey: key, "Content-Type": "application/json", ...(extra || {}) };
  if (key.startsWith("eyJ")) h.Authorization = "Bearer " + key;
  return h;
}

function clean(p) {
  const name = String(p.name == null ? "" : p.name).trim().slice(0, 300);
  if (!name) return null;
  const link = (v) => {
    v = String(v == null ? "" : v).trim().slice(0, 2000);
    return v === "" || /^https?:\/\//i.test(v) ? v : "";
  };
  const priceNum = p.price === "" || p.price == null ? null : Number(p.price);
  const category = String(p.category == null ? "" : p.category).trim().slice(0, 100) || "Other";
  const row = {
    name,
    category,
    description: String(p.description == null ? "" : p.description).trim().slice(0, 1000) || category + " product",
    price: Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : null,
    image: String(p.image == null ? "" : p.image).trim().slice(0, 20) || "📱",
    amazon_link: link(p.amazonLink != null ? p.amazonLink : p.amazon_link),
    flipkart_link: link(p.flipkartLink != null ? p.flipkartLink : p.flipkart_link),
    search_terms:
      String(p.searchTerms != null ? p.searchTerms : p.search_terms != null ? p.search_terms : "")
        .trim()
        .slice(0, 1000) || name.toLowerCase(),
  };
  const id = Number(p.id);
  if (Number.isInteger(id) && id > 0) row.id = id;
  return row;
}

function mapOut(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description || "",
    price: r.price == null ? null : Number(r.price),
    image: r.image || "📦",
    amazonLink: r.amazon_link || "",
    flipkartLink: r.flipkart_link || "",
    searchTerms: r.search_terms || "",
  };
}

function searchFilters(q) {
  const words = String(q || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 6);
  return words.map((w) => "search_text=" + encodeURIComponent("ilike.*" + w + "*"));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ADMIN_PASSWORD) {
    return res.status(500).json({ error: "Vercel Environment Variables missing" });
  }

  const supplied = String(req.headers["x-admin-password"] || "");
  if (!safeEqual(supplied, ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 600));
    return res.status(401).json({ error: "Wrong password" });
  }

  const root = SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1";
  const base = root + "/products";
  const key = SUPABASE_SERVICE_KEY;

  async function sb(method, url, body, prefer) {
    const r = await fetch(url, {
      method,
      headers: authHeaders(key, prefer ? { Prefer: prefer } : {}),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await r.text();
    if (!r.ok) {
      throw new Error("Database error " + r.status + ": " + text.slice(0, 300));
    }
    return { r, text };
  }

  async function count(filterQS) {
    const { r } = await sb("GET", base + "?select=id&limit=1" + (filterQS ? "&" + filterQS : ""), undefined, "count=exact");
    const range = r.headers.get("content-range") || "";
    const n = parseInt(range.split("/")[1], 10);
    return Number.isNaN(n) ? 0 : n;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  try {
    switch (body.action) {
      case "login":
        return res.status(200).json({ ok: true });

      case "stats": {
        const [total, withPrice, withFlipkart, withAmazon] = await Promise.all([
          count(""),
          count("price=not.is.null"),
          count("flipkart_link=neq."),
          count("amazon_link=neq."),
        ]);
        return res.status(200).json({ total, withPrice, withFlipkart, withAmazon });
      }

      case "list": {
        const limit = Math.min(Math.max(parseInt(body.limit, 10) || 50, 1), 1000);
        const offset = Math.max(parseInt(body.offset, 10) || 0, 0);
        const qs = ["select=" + COLS, ...searchFilters(body.q), "order=id.asc", "limit=" + limit, "offset=" + offset];
        const { r, text } = await sb("GET", base + "?" + qs.join("&"), undefined, "count=exact");
        const range = r.headers.get("content-range") || "";
        const total = parseInt(range.split("/")[1], 10);
        const rows = JSON.parse(text || "[]").map(mapOut);
        return res.status(200).json({ rows, total: Number.isNaN(total) ? rows.length : total });
      }

      case "add": {
        const row = clean(body.product || {});
        if (!row) return res.status(400).json({ error: "Product name required" });
        delete row.id;
        await sb("POST", base, row, "return=minimal");
        return res.status(200).json({ ok: true });
      }

      case "update": {
        const id = Number(body.id);
        const row = clean(body.product || {});
        if (!Number.isInteger(id) || !row) return res.status(400).json({ error: "Invalid data" });
        delete row.id;
        row.updated_at = new Date().toISOString();
        await sb("PATCH", base + "?id=eq." + id, row, "return=minimal");
        return res.status(200).json({ ok: true });
      }

      case "delete": {
        const id = Number(body.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
        await sb("DELETE", base + "?id=eq." + id, undefined, "return=minimal");
        return res.status(200).json({ ok: true });
      }

      case "bulk": {
        const input = Array.isArray(body.products) ? body.products : [];
        if (!input.length) return res.status(400).json({ error: "No products" });
        if (input.length > MAX_BULK) {
          return res.status(400).json({ error: "Max " + MAX_BULK + " products per request" });
        }
        const rows = input.map(clean).filter(Boolean);
        const skipped = input.length - rows.length;

        const byId = new Map();
        const noId = [];
        rows.forEach((r) => {
          if (r.id) byId.set(r.id, r);
          else noId.push(r);
        });

        if (byId.size) {
          await sb("POST", base + "?on_conflict=id", Array.from(byId.values()), "resolution=merge-duplicates,return=minimal");
          await sb("POST", root + "/rpc/sync_products_seq", {});
        }
        if (noId.length) {
          await sb("POST", base, noId, "return=minimal");
        }
        return res.status(200).json({ ok: true, saved: byId.size + noId.length, skipped });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    return res.status(502).json({ error: err.message || "Server error" });
  }
}
