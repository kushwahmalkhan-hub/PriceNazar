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
        "Content-Type"
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

        const {
            productId,
            targetPrice,
            email
        } = req.body || {};


        if (!productId) {

            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });

        }


        if (
            targetPrice === undefined ||
            targetPrice === null ||
            Number(targetPrice) <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Valid target price is required"
            });

        }


        /*
         * Email is optional for now.
         *
         * Real email notification service
         * will be connected later.
         */

        return res.status(200).json({

            success: true,

            mode: "demo",

            message:
                "Price alert saved successfully",

            alert: {

                productId:
                    productId,

                targetPrice:
                    Number(targetPrice),

                email:
                    email || null,

                status:
                    "active"

            }

        });


    } catch (error) {

        console.error(
            "Alerts API error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to save price alert"

        });

    }

}
