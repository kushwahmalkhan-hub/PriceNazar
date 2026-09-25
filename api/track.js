export default async function handler(req, res) {

    /* =========================
       CORS
       ========================= */

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

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
           ENVIRONMENT VARIABLES
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
                message:
                    "Supabase environment variables are missing"
            });
        }


        if (!RAPIDAPI_KEY) {

            return res.status(500).json({
                success: false,
                message:
                    "RapidAPI key is missing"
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
                message:
                    "Please login to track products"
            });
        }


        const token =
            authHeader.replace(
                "Bearer ",
                ""
            );


        /* =========================
           VERIFY SUPABASE USER
           ========================= */

        const userResponse =
            await fetch(
                `${SUPABASE_URL}/auth/v1/user`,
                {
                    method: "GET",

                    headers: {
                        apikey:
                            SUPABASE_KEY,

                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!userResponse.ok) {

            const authError =
                await userResponse.text();

            console.error(
                "Supabase auth error:",
                authError
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid or expired session"
            });
        }


        const user =
            await userResponse.json();


        if (!user?.id) {

            return res.status(401).json({
                success: false,
                message:
                    "User not found"
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
                message:
                    "Product URL is required"
            });
        }


        /* =========================
           VALIDATE URL
           ========================= */

        let parsedUrl;

        try {

            parsedUrl =
                new URL(url);

        } catch (error) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid product URL"
            });
        }


        const hostname =
            parsedUrl.hostname
                .toLowerCase()
                .replace(/^www\./, "");


        /* =========================
           DETECT STORE
           ========================= */

        let store = null;


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


        if (
            hostname === "dl.flipkart.com"
        ) {

            store = "Flipkart";
        }


        if (!store) {

            return res.status(400).json({
                success: false,
                message:
                    "Only Amazon or Flipkart URL is supported"
            });
        }


        /* =========================
           PRODUCT VARIABLES
           ========================= */

        let fetchedProductName =
            product_name ||
            productName ||
            null;

        let currentPrice = null;

        let lowestPrice = null;

        let imageUrl = null;


        /* =====================================================
           FLIPKART
           ===================================================== */

        if (store === "Flipkart") {

            /* =========================
               EXTRACT FLIPKART ITEM ID
               ========================= */

            let itmId = null;


            const pathMatch =
                parsedUrl.pathname.match(
                    /\/p\/([^/?#]+)/i
                );


            if (pathMatch?.[1]) {

                itmId =
                    decodeURIComponent(
                        pathMatch[1]
                    );
            }


            /*
             * Some Flipkart links may contain
             * pid in query parameters.
             */

            const pid =
                parsedUrl.searchParams.get(
                    "pid"
                );


            console.log(
                "Flipkart URL:",
                url
            );

            console.log(
                "Flipkart itm_id:",
                itmId
            );

            console.log(
                "Flipkart pid:",
                pid
            );


            /* =========================
               RAPIDAPI REQUEST
               ========================= */

            const rapidBody =
                itmId
                    ? {
                        itm_id:
                            itmId
                    }
                    : {
                        url:
                            url
                    };


            console.log(
                "RapidAPI request body:",
                rapidBody
            );


            const rapidResponse =
                await fetch(
                    "https://flipkart-product-data-api.p.rapidapi.com/flipkart/v1/product",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "X-RapidAPI-Key":
                                RAPIDAPI_KEY,

                            "X-RapidAPI-Host":
                                "flipkart-product-data-api.p.rapidapi.com"
                        },

                        body:
                            JSON.stringify(
                                rapidBody
                            )
                    }
                );


            const rapidText =
                await rapidResponse.text();


            let rapidData = null;


            try {

                rapidData =
                    JSON.parse(
                        rapidText
                    );

            } catch (error) {

                console.error(
                    "RapidAPI invalid JSON:",
                    rapidText
                );

                return res.status(502).json({

                    success: false,

                    message:
                        "Invalid response from Flipkart API",

                    raw:
                        rapidText.substring(
                            0,
                            500
                        )
                });
            }


            console.log(
                "RapidAPI response:",
                rapidData
            );


            /* =========================
               RAPIDAPI ERROR
               ========================= */

            if (!rapidResponse.ok) {

                console.error(
                    "RapidAPI HTTP error:",
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


            /*
             * ReefAPI can return:
             *
             * data
             * data.product
             * data.result
             * data.results[]
             * product
             */

            let product = null;


            if (
                rapidData?.data?.product
            ) {

                product =
                    rapidData.data.product;

            } else if (
                rapidData?.data?.result
            ) {

                product =
                    rapidData.data.result;

            } else if (
                Array.isArray(
                    rapidData?.data?.results
                )
            ) {

                product =
                    rapidData.data.results[0];

            } else if (
                Array.isArray(
                    rapidData?.data
                )
            ) {

                product =
                    rapidData.data[0];

            } else if (
                rapidData?.data
            ) {

                product =
                    rapidData.data;

            } else if (
                rapidData?.product
            ) {

                product =
                    rapidData.product;

            } else {

                product =
                    rapidData;
            }


            console.log(
                "Extracted Flipkart product:",
                product
            );


            /* =========================
               PRODUCT NAME
               ========================= */

            fetchedProductName =
                product?.title ||
                product?.name ||
                product?.product_name ||
                product?.productTitle ||
                product?.product_name_text ||
                fetchedProductName ||
                "Flipkart Product";


            /* =========================
               PRICE EXTRACTION
               ========================= */

            const possiblePrices = [

                product?.price,

                product?.current_price,

                product?.selling_price,

                product?.sellingPrice,

                product?.offer_price,

                product?.offerPrice,

                product?.final_price,

                product?.finalPrice,

                product?.data?.price,

                product?.pricing?.price,

                product?.pricing?.selling_price,

                product?.pricing?.sellingPrice,

                product?.price_info?.price,

                product?.price_info?.selling_price

            ];


            for (
                const value of possiblePrices
            ) {

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {

                    const numeric =
                        Number(
                            String(value)
                                .replace(
                                    /[^0-9.]/g,
                                    ""
                                )
                        );


                    if (
                        Number.isFinite(numeric) &&
                        numeric > 0
                    ) {

                        currentPrice =
                            numeric;

                        break;
                    }
                }
            }


            /* =========================
               VARIANT PRICE FALLBACK
               ========================= */

            if (
                currentPrice === null &&
                Array.isArray(
                    product?.variants
                )
            ) {

                for (
                    const variant
                    of product.variants
                ) {

                    const variantPrice =
                        Number(
                            String(
                                variant?.price ??
                                variant?.selling_price ??
                                ""
                            ).replace(
                                /[^0-9.]/g,
                                ""
                            )
                        );


                    if (
                        Number.isFinite(
                            variantPrice
                        ) &&
                        variantPrice > 0
                    ) {

                        currentPrice =
                            variantPrice;

                        break;
                    }
                }
            }


            /* =========================
               LOWEST PRICE
               ========================= */

            lowestPrice =
                currentPrice;


            /* =========================
               IMAGE
               ========================= */

            if (
                typeof product?.image ===
                "string"
            ) {

                imageUrl =
                    product.image;

            } else if (
                typeof product?.image_url ===
                "string"
            ) {

                imageUrl =
                    product.image_url;

            } else if (
                typeof product?.thumbnail ===
                "string"
            ) {

                imageUrl =
                    product.thumbnail;

            } else if (
                Array.isArray(
                    product?.images
                )
            ) {

                const firstImage =
                    product.images[0];


                if (
                    typeof firstImage ===
                    "string"
                ) {

                    imageUrl =
                        firstImage;

                } else if (
                    firstImage?.url
                ) {

                    imageUrl =
                        firstImage.url;
                }
            }


            /* =========================
               PRICE REQUIRED
               ========================= */

            if (
                currentPrice === null
            ) {

                console.error(
                    "Flipkart price missing:",
                    {
                        rapidData,
                        product
                    }
                );

                return res.status(502).json({

                    success: false,

                    message:
                        "Flipkart product found, but price could not be extracted",

                    error:
                        rapidData
                });
            }


            console.log(
                "Flipkart final data:",
                {
                    name:
                        fetchedProductName,

                    price:
                        currentPrice,

                    image:
                        imageUrl
                }
            );
        }


        /* =====================================================
           AMAZON
           ===================================================== */

        if (store === "Amazon") {

            /*
             * Amazon integration will use the
             * authorized Amazon API later.
             *
             * Do not create fake Amazon prices.
             */

            return res.status(501).json({

                success: false,

                message:
                    "Amazon live price API is not connected yet"
            });
        }


        /* =====================================================
           SAVE TRACKED PRODUCT
           ===================================================== */

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/tracked_products`,
                {
                    method: "POST",

                    headers: {

                        apikey:
                            SUPABASE_KEY,

                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        Prefer:
                            "return=representation"
                    },

                    body:
                        JSON.stringify({

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
                                imageUrl,

                            alert_enabled:
                                false

                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Supabase tracked_products error:",
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


        /* =====================================================
           SAVE REAL PRICE HISTORY
           ===================================================== */

        let historySaved =
            false;


        if (
            currentPrice !== null &&
            Number.isFinite(
                currentPrice
            ) &&
            currentPrice > 0
        ) {

            const historyResponse =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/price_history`,
                    {
                        method: "POST",

                        headers: {

                            apikey:
                                SUPABASE_KEY,

                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",

                            Prefer:
                                "return=representation"
                        },

                        body:
                            JSON.stringify({

                                user_id:
                                    user.id,

                                product_name:
                                    fetchedProductName,

                                product_url:
                                    url,

                                store:
                                    store,

                                price:
                                    currentPrice
                            })
                    }
                );


            const historyText =
                await historyResponse.text();


            let historyData =
                null;


            try {

                historyData =
                    JSON.parse(
                        historyText
                    );

            } catch (error) {

                historyData =
                    historyText;
            }


            if (
                !historyResponse.ok
            ) {

                console.error(
                    "Price history save error:",
                    historyData
                );

            } else {

                historySaved =
                    true;
            }
        }


        /* =====================================================
           SUCCESS
           ===================================================== */

        return res.status(201).json({

            success:
                true,

            mode:
                "live",

            store:
                store,

            url:
                url,

            product:
                data?.[0] ||
                null,

            historySaved:
                historySaved,

            message:
                "Product tracked successfully"
        });


    } catch (error) {

        console.error(
            "Track API fatal error:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Unable to track product",

            error:
                error?.message ||
                "Unknown server error"
        });
    }
}
