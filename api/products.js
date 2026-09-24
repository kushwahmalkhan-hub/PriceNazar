export default async function handler(req, res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );


    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }


    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Only GET request is allowed"
        });
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


        if (!authHeader.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message:
                    "Please login to view your products"
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
        // GET USER PRODUCTS
        // =========================

        const query =
            new URLSearchParams({
                user_id:
                    `eq.${user.id}`
            });


        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/tracked_products?${query}`,
                {
                    headers: {
                        apikey:
                            SUPABASE_KEY,

                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
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
                    "Unable to load products",
                error:
                    data
            });

        }


        // =========================
        // NORMALIZE PRODUCTS
        // =========================

        const products =
            data.map(product => {

                const price =
                    Number(
                        product.current_price ??
                        product.price ??
                        0
                    );


                const lowestPrice =
                    Number(
                        product.lowest_price ??
                        product.lowestPrice ??
                        price
                    );


                return {

                    id:
                        product.id,

                    store:
                        product.store ??
                        product.platform ??
                        "Unknown",

                    name:
                        product.product_name ??
                        product.name ??
                        "Tracked Product",

                    url:
                        product.product_url ??
                        product.url ??
                        "",

                    price:
                        price,

                    lowestPrice:
                        lowestPrice,

                    category:
                        product.category ??
                        "Other",

                    currency:
                        product.currency ??
                        "INR",

                    mode:
                        "live"

                };

            });


        return res.status(200).json({

            success: true,

            count:
                products.length,

            mode:
                "live",

            products:
                products

        });


    } catch (error) {

        console.error(
            "Products API error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load products"

        });

    }

}
