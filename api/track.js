export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Only POST request is allowed"
        });
    }

    try {
        const { url } = req.body || {};

        if (!url) {
            return res.status(400).json({
                success: false,
                message: "Product URL is required"
            });
        }

        const isAmazon = /amazon\.(in|com)/i.test(url);
        const isFlipkart = /flipkart\.com/i.test(url);

        if (!isAmazon && !isFlipkart) {
            return res.status(400).json({
                success: false,
                message: "Only Amazon or Flipkart URL is supported"
            });
        }

        const store = isAmazon ? "Amazon" : "Flipkart";

        return res.status(200).json({
            success: true,
            store: store,
            url: url,
            message: "Product URL received successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}
