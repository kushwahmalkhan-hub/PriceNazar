export default async function handler(req, res) {

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

            message:
                "Only POST request is allowed"

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
           VERIFY USER
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
           DETECT STORE
           ========================= */

        let store = null;


        try {

            const parsedUrl =
                new URL(url);


            const hostname =
                parsedUrl.hostname
                    .toLowerCase()
                    .replace(
                        /^www\./,
                        ""
                    );


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

                message:
                    "Invalid product URL"

            });

        }


        if (!store) {

            return res.status(400).json({

                success: false,

                message:
                    "Only Amazon or Flipkart URL is supported"

            });

        }


        /* =========================
           SAVE TRACKED PRODUCT
           ========================= */

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
                                product_name ||
                                productName ||
                                null,

                            store:
                                store

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

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
