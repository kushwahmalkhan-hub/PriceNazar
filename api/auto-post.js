import deals from "../deals.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const slot = Number(req.query.slot || 0);
  const day = Math.floor(Date.now() / 86400000);
  const d = deals[(day * 5 + slot) % deals.length];

  const off = d.mrp > d.price
    ? ` (${Math.round(((d.mrp - d.price) / d.mrp) * 100)}% OFF)` : "";

  const caption =
`🔥 ${d.title}

💰 Price: ₹${d.price}${d.mrp ? `  MRP: ₹${d.mrp}` : ""}${off}

🔗 Buy Now: ${d.link}

📢 More deals: https://t.me/PriceNazarDeals

As an Amazon Associate I earn from qualifying purchases.`;

  const method = d.image ? "sendPhoto" : "sendMessage";
  const payload = d.image
    ? { chat_id: "@PriceNazarDeals", photo: d.image, caption }
    : { chat_id: "@PriceNazarDeals", text: caption };

  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.status(200).json(await r.json());
}
