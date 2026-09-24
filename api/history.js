export default async function handler(req, res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
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


        // =========================
        // AUTHENTICATION
        // =========================

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


        // =========================
        // VERIFY USER
        // =========================

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


        // =========================
        // GET PRICE HISTORY
        // =========================

        if (req.method === "GET") {

            const requestUrl =
                new URL(
                    req.url,
                    "https://price-nazar.vercel.app"
                );


            const productUrl =
    requestUrl.searchParams.get(
        "product_url"
    ) ||
    requestUrl.searchParams.get(
        "url"
    );


            if (!productUrl) {

                return res.status(400).json({

                    success: false,

                    message:
                        "product_url is required"

                });

            }


            const query =
                new URLSearchParams({

                    user_id:
                        `eq.${user.id}`,

                    product_url:
                        `eq.${productUrl}`,

                    order:
                        "recorded_at.asc"

                });


            const response =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/price_history?${query}`,
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
                        "Unable to fetch price history",

                    error:
                        data

                });

            }


            // Convert database format
            // to PriceNazar chart format

            const history =
                data.map(item => ({

                    date:
                        new Date(
                            item.recorded_at
                        ).toLocaleDateString(
                            "en-IN",
                            {
                                day: "2-digit",
                                month: "short"
                            }
                        ),

                    price:
                        Number(item.price)

                }));


            const prices =
                history.map(
                    item => item.price
                );


            const lowestPrice =
                prices.length
                    ? Math.min(...prices)
                    : null;


            const highestPrice =
                prices.length
                    ? Math.max(...prices)
                    : null;


            return res.status(200).json({

                success: true,

                mode: "live",

                currency: "INR",

                lowestPrice:
                    lowestPrice,

                highestPrice:
                    highestPrice,

                history:
                    history

            });

        }


        // =========================
        // SAVE PRICE HISTORY
        // =========================

        if (req.method === "POST") {

            const {

                product_name,

                product_url,

                store,

                price

            } = req.body || {};


            if (
                !product_url ||
                !store ||
                price === undefined
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "product_url, store and price are required"

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


            const numericPrice =
                Number(price);


            if (
                !Number.isFinite(
                    numericPrice
                ) ||
                numericPrice < 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid price"

                });

            }


            const response =
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
                                    product_name ||
                                    null,

                                product_url:
                                    product_url,

                                store:
                                    store,

                                price:
                                    numericPrice

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
                        "Unable to save price history",

                    error:
                        data

                });

            }


            return res.status(201).json({

                success: true,

                mode: "live",

                history:
                    data

            });

        }


        // =========================
        // METHOD NOT ALLOWED
        // =========================

        return res.status(405).json({

            success: false,

            message:
                "Method not allowed"

        });


    } catch (error) {

        console.error(
            "History API error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to process price history"

        });

    }

}
