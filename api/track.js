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


    /* =========================
       OPTIONS
       ========================= */

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }


    /* =========================
       ONLY POST
       ========================= */

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message:
                "Only POST request is allowed"

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


        /* =========================
           CHECK ENVIRONMENT
           ========================= */

        if (
            !SUPABASE_URL ||
            !SUPABASE_KEY
        ) {

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


        if (
            !authHeader.startsWith("Bearer ")
        ) {

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
           CLEAN URL
           ========================= */

        const productUrl =
            String(url).trim();


        /* =========================
           DETECT STORE
           ========================= */

        let store = null;


        try {

            const parsedUrl =
                new URL(productUrl);


            const hostname =
                parsedUrl.hostname
                    .toLowerCase()
                    .replace(
                        /^www\./,
                        ""
                    );


            /* AMAZON */

            if (
                hostname === "amazon.in" ||
                hostname.endsWith(".amazon.in") ||
                hostname === "amazon.com" ||
                hostname.endsWith(".amazon.com") ||
                hostname === "link.amazon"
            ) {

                store = "Amazon";

            }


            /* FLIPKART */

            if (
                hostname === "flipkart.com" ||
                hostname.endsWith(".flipkart.com")
            ) {

                store = "Flipkart";

            }


        } catch (error) {

            console.error(
                "URL parsing error:",
                error
            );

            return res.status(400).json({

                success: false,

                message:
                    "Invalid product URL"

            });

        }


        /* =========================
           STORE VALIDATION
           ========================= */

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
           FLIPKART - RAPIDAPI / REEFAPI
           ===================================================== */

        if (store === "Flipkart") {


            console.log(
                "Fetching Flipkart product:",
                productUrl
            );


            /* =========================
               RAPIDAPI REQUEST
               ========================= */

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
                            JSON.stringify({

                                url:
                                    productUrl

                            })

                    }
                );


            /* =========================
               READ RESPONSE
               ========================= */

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

                    error:
                        rapidText

                });

            }


            /* =========================
               HTTP ERROR
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


            /* =================================================
               IMPORTANT:
               REEFAPI CAN RETURN HTTP 200 BUT ok:false
               ================================================= */

            if (
                rapidData?.ok === false
            ) {

                console.error(
                    "ReefAPI returned error:",
                    rapidData?.error ||
                    rapidData
                );


                return res.status(502).json({

                    success: false,

                    message:
                        rapidData?.error?.message ||
                        "Flipkart product data could not be fetched",

                    error:
                        rapidData?.error ||
                        rapidData

                });

            }


            /* =========================
               EXTRACT PRODUCT
               ========================= */

            let product = null;


            /*
             * Format:
             * data.product
             */

            if (
                rapidData?.data?.product
            ) {

                product =
                    rapidData.data.product;

            }


            /*
             * Format:
             * data.result
             */

            else if (
                rapidData?.data?.result
            ) {

                product =
                    rapidData.data.result;

            }


            /*
             * Format:
             * data.results[0]
             */

            else if (
                Array.isArray(
                    rapidData?.data?.results
                ) &&
                rapidData.data.results.length > 0
            ) {

                product =
                    rapidData.data.results[0];

            }


            /*
             * Format:
             * data[0]
             */

            else if (
                Array.isArray(
                    rapidData?.data
                ) &&
                rapidData.data.length > 0
            ) {

                product =
                    rapidData.data[0];

            }


            /*
             * Format:
             * data
             */

            else if (
                rapidData?.data &&
                typeof rapidData.data === "object"
            ) {

                product =
                    rapidData.data;

            }


            /*
             * Fallback
             */

            else if (
                rapidData?.product
            ) {

                product =
                    rapidData.product;

            }


            /* =========================
               LOG PRODUCT
               ========================= */

            console.log(
                "RapidAPI extracted product:",
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
                fetchedProductName ||
                null;


            /* =========================
               PRODUCT PRICE
               ========================= */

            const possiblePrice =
                product?.price ??
                product?.current_price ??
                product?.selling_price ??
                product?.sellingPrice ??
                product?.sale_price;


            const parsedPrice =
                Number(
                    String(
                        possiblePrice ?? ""
                    )
                    .replace(
                        /[^0-9.]/g,
                        ""
                    )
                );


            if (
                Number.isFinite(
                    parsedPrice
                ) &&
                parsedPrice > 0
            ) {

                currentPrice =
                    parsedPrice;

            }


            /* =========================
               PRODUCT IMAGE
               ========================= */

            if (
                typeof product?.image ===
                "string"
            ) {

                imageUrl =
                    product.image;

            }

            else if (
                typeof product?.image_url ===
                "string"
            ) {

                imageUrl =
                    product.image_url;

            }

            else if (
                typeof product?.thumbnail ===
                "string"
            ) {

                imageUrl =
                    product.thumbnail;

            }

            else if (
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

                }

                else if (
                    firstImage?.url
                ) {

                    imageUrl =
                        firstImage.url;

                }

            }


            /* =========================
               VALIDATE PRODUCT DATA
               ========================= */

            if (
                !fetchedProductName &&
                !currentPrice &&
                !imageUrl
            ) {

                console.error(
                    "No usable Flipkart product data:",
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


            /*
             * IMPORTANT:
             * Do not save a fake/empty price.
             */

            if (
                currentPrice === null
            ) {

                console.error(
                    "Flipkart price missing:",
                    rapidData
                );


                return res.status(502).json({

                    success: false,

                    message:
                        "Flipkart product price could not be fetched",

                    error:
                        rapidData

                });

            }


            /* =========================
               INITIAL LOWEST PRICE
               ========================= */

            lowestPrice =
                currentPrice;

        }


        /* =====================================================
           AMAZON
           ===================================================== */

        /*
         * Amazon API integration is not connected yet.
         * We do NOT generate fake prices.
         */

        if (store === "Amazon") {

            if (!fetchedProductName) {

                fetchedProductName =
                    "Amazon Product";

            }

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
                                productUrl,

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


        /* =========================
           SUPABASE ERROR
           ========================= */

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

        let historySaved = false;


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
                                    productUrl,

                                store:
                                    store,

                                price:
                                    currentPrice

                            })

                    }
                );


            const historyText =
                await historyResponse.text();


            let historyData = null;


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

            }

            else {

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
                productUrl,

            product:
                data?.[0] ||
                null,

            historySaved:
                historySaved,

            message:
                "Product tracked successfully"

        });


    } catch (error) {

        /* =========================
           GLOBAL ERROR
           ========================= */

        console.error(
            "Track API error:",
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
