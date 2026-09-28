export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = "@PriceNazarDeals";

  if (!token) {
    return res.status(500).json({ error: "Bot token missing" });
  }

  const message = `🔥 Amazon Deal

🛒 Product: Amazon Deal

🔗 Buy Now:
https://link.amazon/B04TsPJqv

📢 More deals: https://t.me/PriceNazarDeals`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channel,
          text: message,
        }),
      }
    );

    const data = await response.json();
    return res.status(data.ok ? 200 : 500).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Message failed" });
  }
}
