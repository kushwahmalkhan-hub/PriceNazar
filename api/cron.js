
export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY || !RAPIDAPI_KEY) {
    return res.status(500).json({
      success: false,
      message: "Missing environment variables",
    });
  }

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/tracked_products?store=eq.Flipkart&select=id,user_id,product_url,product_name,store,lowest_price`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Could not load tracked products");
    }

    const products = await response.json();
    const results = [];

    for (const item of products) {
      try {
        const url = new URL(item.product_url);
        const match = url.pathname.match(/\/p\/([^/?#]+)/i);
        const itmId = match?.[1]
          ? decodeURIComponent(match[1])
          : null;

        const rapidResponse = await fetch(
          "https://flipkart-product-data-api.p.rapidapi.com/flipkart/v1/product",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host":
                "flipkart-product-data-api.p.rapidapi.com",
            },
            body: JSON.stringify(
              itmId
                ? { itm_id: itmId }
                : { url: item.product_url }
            ),
          }
        );

        if (!rapidResponse.ok) {
          throw new Error(`RapidAPI error: ${rapidResponse.status}`);
        }

        const data = await rapidResponse.json();

        const product =
          data?.data?.product ||
          data?.data?.result ||
          data?.data?.results?.[0] ||
          (Array.isArray(data?.data) ? data.data[0] : data?.data) ||
          data?.product ||
          data;

        const candidates = [
          product?.price,
          product?.current_price,
          product?.selling_price,
          product?.sellingPrice,
          product?.offer_price,
          product?.offerPrice,
          product?.final_price,
          product?.finalPrice,
          product?.pricing?.price,
          product?.pricing?.selling_price,
        ];

        let price = null;

        for (const value of candidates) {
          if (value === undefined || value === null || value === "") {
            continue;
          }

          const parsed = Number(
            String(value).replace(/[^0-9.]/g, "")
          );

          if (Number.isFinite(parsed) && parsed > 0) {
            price = parsed;
            break;
          }
        }

        if (price === null) {
          throw new Error("Real price not found");
        }

        // Save price history
        const historyResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/price_history`,
          {
            method: "POST",
            headers: {
              ...headers,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              user_id: item.user_id,
              product_name: item.product_name,
              product_url: item.product_url,
              store: "Flipkart",
              price,
            }),
          }
        );

        if (!historyResponse.ok) {
          throw new Error("Could not save price history");
        }

        // Calculate lowest price
        const oldLowest = Number(item.lowest_price);

        const lowestPrice =
          item.lowest_price == null ||
          !Number.isFinite(oldLowest) ||
          oldLowest <= 0
            ? price
            : Math.min(oldLowest, price);

        // Update current and lowest prices
        const updateResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/tracked_products?id=eq.${encodeURIComponent(item.id)}`,
          {
            method: "PATCH",
            headers: {
              ...headers,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              current_price: price,
              lowest_price: lowestPrice,
            }),
          }
        );

        if (!updateResponse.ok) {
          throw new Error("Could not update product price");
        }

        // Find active, untriggered price alerts
        const alertParams = new URLSearchParams({
          user_id: `eq.${item.user_id}`,
          product_url: `eq.${item.product_url}`,
          is_active: "eq.true",
          triggered_at: "is.null",
          select: "id,target_price",
        });

        const alertResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/price_alerts?${alertParams}`,
          { headers }
        );

        if (!alertResponse.ok) {
          throw new Error("Could not load price alerts");
        }

        const alerts = await alertResponse.json();
        const triggeredAlerts = [];

        for (const alert of alerts) {
          const targetPrice = Number(alert.target_price);

          if (
            Number.isFinite(targetPrice) &&
            targetPrice > 0 &&
            price <= targetPrice
          ) {
            const triggerResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/price_alerts?id=eq.${encodeURIComponent(alert.id)}`,
              {
                method: "PATCH",
                headers: {
                  ...headers,
                  Prefer: "return=minimal",
                },
                body: JSON.stringify({
                  triggered_at: new Date().toISOString(),
                  is_active: false,
                }),
              }
            );

            if (!triggerResponse.ok) {
              throw new Error("Could not trigger price alert");
            }

            triggeredAlerts.push({
              target_price: targetPrice,
              triggered: true,
            });
          }
        }

        results.push({
          product: item.product_name,
          price,
          lowest_price: lowestPrice,
          saved: true,
          alerts_triggered: triggeredAlerts,
        });
      } catch (error) {
        results.push({
          product: item.product_name,
          saved: false,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      checked: products.length,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
