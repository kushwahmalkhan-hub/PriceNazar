export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = "@PriceNazarDeals";

  if (!token) {
    return res.status(500).json({ error: "Bot token missing" });
  }

  const { title, price, mrp, link, image } = req.body || {};

  if (!title || !link) {
    return res.status(400).json({ error: "title and link required" });
  }

  let off = "";
  if (price && mrp && Number(mrp) > Number(price)) {
    off = ` (${Math.round(((mrp - price) / mrp) * 100)}% OFF)`;
  }

  const caption =
`🔥 ${title}

💰 Price: ₹${price || "-"}${mrp ? `  MRP: ₹${mrp}` : ""}${off}

🔗 Buy Now: ${link}

📢 More deals: https://t.me/PriceNazarDeals

As an Amazon Associate I earn from qualifying purchases.`;

  const method = image ? "sendPhoto" : "sendMessage";
  const payload = image
    ? { chat_id: channel, photo: image, caption }
    : { chat_id: channel, text: caption };

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    return res.status(data.ok ? 200 : 500).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Message failed" });
  }
}
