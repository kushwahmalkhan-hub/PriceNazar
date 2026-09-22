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
         * Demo product catalog.
         *
         * Real Amazon/Flipkart product data
         * will be connected later through
         * authorized APIs.
         */

        const products = [

            {
                id: "pn-amazon-001",

                store: "Amazon",

                name: "Premium Smartphone",

                price: 29999,

                lowestPrice: 27999,

                category: "Smartphone",

                currency: "INR",

                mode: "demo"
            },


            {
                id: "pn-amazon-002",

                store: "Amazon",

                name: "Wireless Headphones",

                price: 3999,

                lowestPrice: 3499,

                category: "Audio",

                currency: "INR",

                mode: "demo"
            },


            {
                id: "pn-flipkart-001",

                store: "Flipkart",

                name: "Performance Laptop",

                price: 54999,

                lowestPrice: 49999,

                category: "Laptop",

                currency: "INR",

                mode: "demo"
            }

        ];


        return res.status(200).json({

            success: true,

            count: products.length,

            mode: "demo",

            products: products

        });


    } catch (error) {

        console.error(
            "Products API error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Unable to load products"

        });

    }

}
