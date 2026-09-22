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
        "Content-Type"
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

        /*
         * Demo price history.
         *
         * Real history will be connected
         * with authorized store APIs later.
         */

        const history = [

            {
                date: "Sep 16",
                price: 31999
            },

            {
                date: "Sep 17",
                price: 30999
            },

            {
                date: "Sep 18",
                price: 30499
            },

            {
                date: "Sep 19",
                price: 29999
            },

            {
                date: "Sep 20",
                price: 29499
            },

            {
                date: "Sep 21",
                price: 28999
            },

            {
                date: "Sep 22",
                price: 29999
            }

        ];


        const lowestPrice =
            Math.min(
                ...history.map(
                    item => item.price
                )
            );


        const highestPrice =
            Math.max(
                ...history.map(
                    item => item.price
                )
            );


        return res.status(200).json({

            success: true,

            mode: "demo",

            currency: "INR",

            lowestPrice:
                lowestPrice,

            highestPrice:
                highestPrice,

            history:
                history

        });


    } catch (error) {

        console.error(
            "History API error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load price history"

        });

    }

}
