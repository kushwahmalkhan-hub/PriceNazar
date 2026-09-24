export default async function handler(req, res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );


    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }


    try {

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
                    "Authentication required"

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
           GET ALERTS
           ========================= */

        if (req.method === "GET") {

            const response =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/price_alerts?user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc`,
                    {
                        headers: {

                            apikey:
                                SUPABASE_KEY,

                            Authorization:
                                `Bearer ${token}`

                        }
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
                        "Unable to fetch alerts",

                    error:
                        data

                });

            }


            return res.status(200).json({

                success: true,

                alerts:
                    data

            });

        }


        /* =========================
           CREATE ALERT
           ========================= */

        if (req.method === "POST") {

            const body =
                req.body || {};


            /*
             * Accept both formats:
             *
             * targetPrice / productUrl
             *
             * and
             *
             * target_price / product_url
             */

            const productUrl =
                body.product_url ||
                body.productUrl ||
                "";


            const targetPrice =
                body.target_price ??
                body.targetPrice;


            const productName =
                body.product_name ||
                body.productName ||
                null;


            let store =
                body.store ||
                "";


            /* =========================
               DETECT STORE FROM URL
               ========================= */

            if (!store && productUrl) {

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


                    if (
                        hostname === "amazon.in" ||
                        hostname.endsWith(".amazon.in") ||
                        hostname === "amazon.com" ||
                        hostname.endsWith(".amazon.com") ||
                        hostname === "link.amazon"
                    ) {

                        store = "Amazon";

                    } else if (
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

            }


            if (
                !productUrl ||
                targetPrice === undefined ||
                targetPrice === null
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Product URL and target price are required"

                });

            }


            if (
                store !== "Amazon" &&
                store !== "Flipkart"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Only Amazon or Flipkart is supported"

                });

            }


            const numericTarget =
                Number(targetPrice);


            if (
                !Number.isFinite(
                    numericTarget
                ) ||
                numericTarget <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid target price"

                });

            }


            /* =========================
               SAVE ALERT
               ========================= */

            const response =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/price_alerts`,
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
                                    productName,

                                product_url:
                                    productUrl,

                                store:
                                    store,

                                target_price:
                                    numericTarget,

                                is_active:
                                    true

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
                        "Unable to create price alert",

                    error:
                        data

                });

            }


            return res.status(201).json({

                success: true,

                alert:
                    data

            });

        }


        /* =========================
           UPDATE ALERT
           ========================= */

        if (req.method === "PATCH") {

            const body =
                req.body || {};


            const id =
                body.id;


            if (!id) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Alert id is required"

                });

            }


            const updates = {};


            if (
                body.target_price !== undefined ||
                body.targetPrice !== undefined
            ) {

                const numericTarget =
                    Number(
                        body.target_price ??
                        body.targetPrice
                    );


                if (
                    !Number.isFinite(
                        numericTarget
                    ) ||
                    numericTarget <= 0
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid target price"

                    });

                }


                updates.target_price =
                    numericTarget;

            }


            if (
                body.is_active !== undefined
            ) {

                updates.is_active =
                    Boolean(
                        body.is_active
                    );

            }


            updates.updated_at =
                new Date().toISOString();


            const response =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/price_alerts?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`,
                    {

                        method: "PATCH",

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
                            JSON.stringify(
                                updates
                            )

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
                        "Unable to update alert",

                    error:
                        data

                });

            }


            return res.status(200).json({

                success: true,

                alert:
                    data

            });

        }


        /* =========================
           DELETE ALERT
           ========================= */

        if (req.method === "DELETE") {

            const requestUrl =
                new URL(
                    req.url,
                    "https://price-nazar.vercel.app"
                );


            const id =
                requestUrl.searchParams.get(
                    "id"
                );


            if (!id) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Alert id is required"

                });

            }


            const response =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/price_alerts?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`,
                    {

                        method: "DELETE",

                        headers: {

                            apikey:
                                SUPABASE_KEY,

                            Authorization:
                                `Bearer ${token}`,

                            Prefer:
                                "return=representation"

                        }

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
                        "Unable to delete alert",

                    error:
                        data

                });

            }


            return res.status(200).json({

                success: true,

                deleted:
                    data

            });

        }


        /* =========================
           METHOD NOT ALLOWED
           ========================= */

        return res.status(405).json({

            success: false,

            message:
                "Method not allowed"

        });


    } catch (error) {

        console.error(
            "Alerts API error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to process price alert"

        });

    }

}
