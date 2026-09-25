export default async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

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

        /* =========================
           SUPABASE CONFIG
           ========================= */

        const SUPABASE_URL =
            process.env.SUPABASE_URL;

        const SUPABASE_KEY =
            process.env.SUPABASE_PUBLISHABLE_KEY;

        const RAPIDAPI_KEY =
            process.env.RAPIDAPI_KEY;


        if (!SUPABASE_URL || !SUPABASE_KEY) {
            return res.status(500).json({
                success: false,
                message: "Supabase environment variables are missing"
            });
        }

        if (!RAPIDAPI_KEY) {
            return res.status(500).json({
                success: false,
                message: "RapidAPI key is missing"
            });
        }


        /* =========================
           AUTHENTICATION
           ========================= */

        const authHeader =
            req.headers.authorization || "";

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Please login to track products"
            });
        }

        const token =
            authHeader.replace("Bearer ", "");


        /* =========================
           VERIFY USER
           ========================= */

        const userResponse = await fetch(
            `${SUPABASE_URL}/auth/v1/user`,
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!userResponse.ok) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired session"
            });
        }

        const user =
            await userResponse.json();

        if (!user?.id) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }


        /* =========================
           REQUEST DATA
           ========================= */

        const {
            url,
            product_name,
            productName
        } = req.body || {};

        if (!url) {
            return res.status(400).json({
                success: false,
                message: "Product URL is required"
            });
        }


        /* =========================
           DETECT STORE
           ========================= */

        let store = null;

        try {

            const parsedUrl =
                new URL(url);

            const hostname =
                parsedUrl.hostname
                    .toLowerCase()
                    .replace(/^www\./, "");

            if (
                hostname === "amazon.in" ||
                hostname.endsWith(".amazon.in") ||
                hostname === "amazon.com" ||
                hostname.endsWith(".amazon.com") ||
                hostname === "link.amazon"
            ) {
                store = "Amazon";
            }

            if (
                hostname === "flipkart.com" ||
                hostname.endsWith(".flipkart.com")
            ) {
                store = "Flipkart";
            }

        } catch (error) {

            return res.status(400).json({
                success: false,
                message: "Invalid product URL"
            });
        }


        if (!store) {
            return res.status(400).json({
                success: false,
                message: "Only Amazon or Flipkart URL is supported"
            });
        }


        /* =========================
           PRODUCT DATA
           ========================= */

        let fetchedProductName =
            product_name ||
            productName ||
            null;

        let currentPrice = null;
        let lowestPrice = null;
        let imageUrl = null;


        /* =========================
           FLIPKART RAPIDAPI
           ========================= */

        if (store === "Flipkart") {

            const rapidResponse = await fetch(
                "https://flipkart-product-data-api.p.rapidapi.com/flipkart/v1/product",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "X-RapidAPI-Key": RAPIDAPI_KEY,
                        "X-RapidAPI-Host":
                            "flipkart-product-data-api.p.rapidapi.com"
                    },

                    body: JSON.stringify({
                        url: url
                    })
                }
            );


            const rapidText =
                await rapidResponse.text();

            let rapidData = null;

            try {
                rapidData =
                    JSON.parse(rapidText);
            } catch (error) {

                console.error(
                    "RapidAPI invalid JSON:",
                    rapidText
                );

                return res.status(502).json({
                    success: false,
                    message:
                        "Invalid response from Flipkart API"
                });
            }


            if (!rapidResponse.ok) {

                console.error(
                    "RapidAPI error:",
                    rapidData
                );

                return res.status(502).json({
                    success: false,
                    message:
                        "Unable to fetch Flipkart product data",
                    error:
                        rapidData
                });
            }


            /* =========================
               REEFAPI RESPONSE FORMAT
               { ok, data, meta, error }
               ========================= */

            let product =
                rapidData?.data?.product ||
                rapidData?.data?.result ||
                rapidData?.data;


            /* Handle results[] if returned */

            if (
                !product &&
                Array.isArray(rapidData?.data?.results)
            ) {
                product =
                    rapidData.data.results[0];
            }


            /* Handle direct array */

            if (
                !product &&
                Array.isArray(rapidData?.data)
            ) {
                product =
                    rapidData.data[0];
            }


            /* Fallback */

            if (!product) {
                product =
                    rapidData?.product ||
                    rapidData;
            }


            console.log(
                "RapidAPI product:",
                product
            );


            /* =========================
               PRODUCT NAME
               ========================= */

            fetchedProductName =
                product?.title ||
                product?.name ||
                product?.product_name ||
                fetchedProductName ||
                "Flipkart Product";


            /* =========================
               CURRENT PRICE
               ========================= */

            const parsedPrice =
                Number(
                    product?.price
                );

            if (
                Number.isFinite(parsedPrice) &&
                parsedPrice > 0
            ) {
                currentPrice =
                    parsedPrice;
            }


            /* =========================
               LOWEST PRICE
               ========================= */

            lowestPrice =
                currentPrice;


            /* =========================
               PRODUCT IMAGE
               ========================= */

            imageUrl =
                product?.image ||
                product?.image_url ||
                product?.thumbnail ||
                product?.images?.[0] ||
                product?.images?.[0]?.url ||
                null;


            /* =========================
               SAFETY CHECK
               ========================= */

            if (
                !fetchedProductName &&
                !currentPrice &&
                !imageUrl
            ) {

                console.error(
                    "Could not extract Flipkart product data:",
                    rapidData
                );

                return res.status(502).json({
                    success: false,
                    message:
                        "Flipkart product data could not be extracted",
                    error:
                        rapidData
                });
            }
        }


        /* =========================
           SAVE TRACKED PRODUCT
           ========================= */

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/tracked_products`,
            {
                method: "POST",

                headers: {
                    apikey: SUPABASE_KEY,

                    Authorization:
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json",

                    Prefer:
                        "return=representation"
                },

                body: JSON.stringify({

                    user_id:
                        user.id,

                    product_url:
                        url,

                    product_name:
                        fetchedProductName,

                    store:
                        store,

                    current_price:
                        currentPrice,

                    lowest_price:
                        lowestPrice,

                    image_url:
                        imageUrl

                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Supabase error:",
                data
            );

            return res.status(
                response.status
            ).json({

                success: false,

                message:
                    "Unable to save tracked product",

                error:
                    data

            });
        }


        /* =========================
           SUCCESS
           ========================= */

        return res.status(201).json({

            success: true,

            mode: "live",

            store:
                store,

            url:
                url,

            product:
                data?.[0] || null,

            message:
                "Product tracked successfully"

        });


    } catch (error) {

        console.error(
            "Track API error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to track product"

        });

    }

}
