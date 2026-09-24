/* =========================================================
   PriceNazar - Main Application JavaScript
   ========================================================= */


/* ================= DEMO DATA ================= */

const demoData = {

    amazon: {
        store: "Amazon",
        productName: "Premium Smartphone",
        currentPrice: 29999,
        lowestPrice: 27999,
        history: [
            { date: "Sep 16", price: 31999 },
            { date: "Sep 17", price: 30999 },
            { date: "Sep 18", price: 30499 },
            { date: "Sep 19", price: 29999 },
            { date: "Sep 20", price: 29499 },
            { date: "Sep 21", price: 28999 },
            { date: "Sep 22", price: 29999 }
        ]
    },

    flipkart: {
        store: "Flipkart",
        productName: "Performance Laptop",
        currentPrice: 54999,
        lowestPrice: 49999,
        history: [
            { date: "Sep 16", price: 57999 },
            { date: "Sep 17", price: 56999 },
            { date: "Sep 18", price: 55999 },
            { date: "Sep 19", price: 54999 },
            { date: "Sep 20", price: 53999 },
            { date: "Sep 21", price: 52999 },
            { date: "Sep 22", price: 54999 }
        ]
    }

};


/* ================= DOM ELEMENTS ================= */

const productSearch =
    document.getElementById("productSearch");

const trackProductBtn =
    document.getElementById("trackProductBtn");

const searchStatus =
    document.getElementById("searchStatus");

const trackerCard =
    document.getElementById("trackerCard");

const trackerEmpty =
    document.getElementById("trackerEmpty");

const trackerStore =
    document.getElementById("trackerStore");

const trackerProductName =
    document.getElementById("trackerProductName");

const trackerProductUrl =
    document.getElementById("trackerProductUrl");

const trackerCurrentPrice =
    document.getElementById("trackerCurrentPrice");

const trackerLowestPrice =
    document.getElementById("trackerLowestPrice");

const trackerUpdated =
    document.getElementById("trackerUpdated");

const priceChart =
    document.getElementById("priceChart");

const targetPrice =
    document.getElementById("targetPrice");

const saveAlertBtn =
    document.getElementById("saveAlertBtn");

const alertStatus =
    document.getElementById("alertStatus");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const mainNav =
    document.querySelector(".main-nav");
/* ================= API AUTH ================= */

async function getAuthHeaders() {

    try {

        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) {
            return null;
        }

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (
            error ||
            !data ||
            !data.session
        ) {
            return null;
        }

        return {
            "Content-Type":
                "application/json",

            "Authorization":
                `Bearer ${data.session.access_token}`
        };

    } catch (error) {

        console.warn(
            "Unable to get auth session:",
            error
        );

        return null;
    }
}

/* ================= HELPERS ================= */

function formatPrice(value) {

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return "₹—";
    }

    return "₹" +
        number.toLocaleString("en-IN");

}


function showSearchStatus(
    message,
    type = "info"
) {

    if (!searchStatus) {
        return;
    }

    searchStatus.textContent =
        message;

    if (type === "error") {

        searchStatus.style.color =
            "#dc2626";

    } else if (type === "success") {

        searchStatus.style.color =
            "#16a34a";

    } else {

        searchStatus.style.color =
            "#2563eb";

    }

}


function clearSearchStatus() {

    if (searchStatus) {
        searchStatus.textContent = "";
    }

}


/* ================= URL DETECTION ================= */

function detectStore(url) {

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
    return "amazon";
}


        if (
            hostname === "flipkart.com" ||
            hostname.endsWith(".flipkart.com")
        ) {

            return "flipkart";

        }


        return null;

    } catch (error) {

        return null;

    }

}


/* ================= URL VALIDATION ================= */

function isValidProductUrl(url) {

    const store =
        detectStore(url);

    return store !== null;

}


/* ================= PRODUCT DATA ================= */

function createProductData(
    store,
    url
) {

    const data =
        demoData[store];

    return {

        store:
            data.store,

        productName:
            data.productName,

        currentPrice:
            data.currentPrice,

        lowestPrice:
            data.lowestPrice,

        history:
            data.history,

        url:
            url,

        updatedAt:
            new Date().toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )

    };

}


/* ================= RENDER TRACKER ================= */

function renderTracker(product) {

    if (!product) {
        return;
    }


    if (trackerCard) {
        trackerCard.classList.remove("hidden");
    }

    if (trackerEmpty) {
        trackerEmpty.classList.add("hidden");
    }


    if (trackerStore) {

        trackerStore.textContent =
            product.store;

    }


    if (trackerProductName) {

        trackerProductName.textContent =
            product.productName;

    }


    if (trackerProductUrl) {

        trackerProductUrl.textContent =
            product.url;

    }


    if (trackerCurrentPrice) {

        trackerCurrentPrice.textContent =
            formatPrice(
                product.currentPrice
            );

    }


    if (trackerLowestPrice) {

        trackerLowestPrice.textContent =
            formatPrice(
                product.lowestPrice
            );

    }


    if (trackerUpdated) {

        trackerUpdated.textContent =
            product.updatedAt;

    }


    renderPriceHistory(
        product.history
    );


    try {

        localStorage.setItem(
            "priceNazarTrackedProduct",
            JSON.stringify(product)
        );

    } catch (error) {

        console.warn(
            "Could not save product:",
            error
        );

    }


    setTimeout(() => {

        const tracker =
            document.getElementById(
                "tracker"
            );

        if (tracker) {

            tracker.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }, 100);

}


/* ================= PRICE HISTORY ================= */

function renderPriceHistory(history) {

    if (!priceChart) {
        return;
    }

    priceChart.innerHTML = "";

    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {
        priceChart.innerHTML =
            "<p>No price history available.</p>";
        return;
    }

    const prices = history.map(
        item => Number(item.price)
    );

    const width = 700;
    const height = 300;

    const paddingLeft = 65;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 55;

    const chartWidth =
        width -
        paddingLeft -
        paddingRight;

    const chartHeight =
        height -
        paddingTop -
        paddingBottom;

    const maxPrice =
        Math.max(...prices);

    const minPrice =
        Math.min(...prices);

    const range =
        maxPrice - minPrice || 1;


    /* ================= POINTS ================= */

    const points = history.map(
        (item, index) => {

            const x =
                paddingLeft +
                (
                    index /
                    Math.max(history.length - 1, 1)
                ) *
                chartWidth;

            const y =
                paddingTop +
                (
                    (maxPrice - Number(item.price)) /
                    range
                ) *
                chartHeight;

            return {
                x,
                y,
                price: Number(item.price),
                date: item.date
            };

        }
    );


    /* ================= SVG ================= */

    const svgNS =
        "http://www.w3.org/2000/svg";

    const svg =
        document.createElementNS(
            svgNS,
            "svg"
        );

    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );

    svg.setAttribute(
        "width",
        "100%"
    );

    svg.setAttribute(
        "height",
        "300"
    );

    svg.style.display =
        "block";

    svg.style.overflow =
        "visible";


    /* ================= GRID LINES ================= */

    for (let i = 0; i <= 4; i++) {

        const y =
            paddingTop +
            (chartHeight / 4) * i;

        const line =
            document.createElementNS(
                svgNS,
                "line"
            );

        line.setAttribute(
            "x1",
            paddingLeft
        );

        line.setAttribute(
            "x2",
            width - paddingRight
        );

        line.setAttribute(
            "y1",
            y
        );

        line.setAttribute(
            "y2",
            y
        );

        line.setAttribute(
            "stroke",
            "rgba(148,163,184,0.20)"
        );

        line.setAttribute(
            "stroke-width",
            "1"
        );

        svg.appendChild(line);


        /* Y-axis price */

        const priceValue =
            maxPrice -
            (
                range / 4
            ) * i;

        const text =
            document.createElementNS(
                svgNS,
                "text"
            );

        text.setAttribute(
            "x",
            8
        );

        text.setAttribute(
            "y",
            y + 4
        );

        text.setAttribute(
            "fill",
            "#94a3b8"
        );

        text.setAttribute(
            "font-size",
            "12"
        );

        text.textContent =
            formatPrice(
                Math.round(priceValue)
            );

        svg.appendChild(text);

    }


    /* ================= LINE ================= */

    const pathData =
        points
            .map(
                (point, index) =>
                    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");


    const path =
        document.createElementNS(
            svgNS,
            "path"
        );

    path.setAttribute(
        "d",
        pathData
    );

    path.setAttribute(
        "fill",
        "none"
    );

    path.setAttribute(
        "stroke",
        "#60a5fa"
    );

    path.setAttribute(
        "stroke-width",
        "4"
    );

    path.setAttribute(
        "stroke-linecap",
        "round"
    );

    path.setAttribute(
        "stroke-linejoin",
        "round"
    );

    svg.appendChild(path);


    /* ================= POINTS + LABELS ================= */

    points.forEach(
        point => {

            const circle =
                document.createElementNS(
                    svgNS,
                    "circle"
                );

            circle.setAttribute(
                "cx",
                point.x
            );

            circle.setAttribute(
                "cy",
                point.y
            );

            circle.setAttribute(
                "r",
                "5"
            );

            circle.setAttribute(
                "fill",
                "#60a5fa"
            );

            circle.setAttribute(
                "stroke",
                "#ffffff"
            );

            circle.setAttribute(
                "stroke-width",
                "2"
            );

            svg.appendChild(circle);


            /* Price label */

            const priceText =
                document.createElementNS(
                    svgNS,
                    "text"
                );

            priceText.setAttribute(
                "x",
                point.x
            );

            priceText.setAttribute(
                "y",
                point.y - 12
            );

            priceText.setAttribute(
                "text-anchor",
                "middle"
            );

            priceText.setAttribute(
                "fill",
                "#e2e8f0"
            );

            priceText.setAttribute(
                "font-size",
                "11"
            );

            priceText.setAttribute(
                "font-weight",
                "600"
            );

            priceText.textContent =
                formatPrice(
                    point.price
                );

            svg.appendChild(priceText);


            /* Date label */

            const dateText =
                document.createElementNS(
                    svgNS,
                    "text"
                );

            dateText.setAttribute(
                "x",
                point.x
            );

            dateText.setAttribute(
                "y",
                height - 18
            );

            dateText.setAttribute(
                "text-anchor",
                "middle"
            );

            dateText.setAttribute(
                "fill",
                "#94a3b8"
            );

            dateText.setAttribute(
                "font-size",
                "11"
            );

            dateText.textContent =
                point.date;

            svg.appendChild(dateText);

        }
    );


    priceChart.appendChild(svg);

}
/* ================= LOAD PRICE HISTORY ================= */

async function loadPriceHistory(productUrl) {

    if (!productUrl) {
        return;
    }

    try {

        const authHeaders =
            await getAuthHeaders();

        const headers =
            authHeaders || {
                "Content-Type":
                    "application/json"
            };

        const response =
            await fetch(
                `/api/history?product_url=${encodeURIComponent(productUrl)}`
                {
                    method: "GET",
                    headers: headers
                }
            );

        const result =
            await response.json();

        if (
            response.ok &&
            result.success &&
            Array.isArray(result.history)
        ) {

            renderPriceHistory(
                result.history
            );

            return result;

        }

        console.warn(
            "Price history unavailable:",
            result.message || "Unknown error"
        );

    } catch (error) {

        console.warn(
            "History API request failed:",
            error
        );

    }

    return null;
}

/* ================= TRACK PRODUCT ================= */

async function trackProduct() {

    const url =
        productSearch
            ? productSearch.value.trim()
            : "";


    clearSearchStatus();


    if (!url) {

        showSearchStatus(
            "Please paste an Amazon or Flipkart product URL.",
            "error"
        );

        return;

    }


    if (!isValidProductUrl(url)) {

        showSearchStatus(
            "Please enter a valid Amazon.in or Flipkart.com product URL.",
            "error"
        );

        return;

    }


    const store =
        detectStore(url);


    showSearchStatus(
        "Checking product...",
        "info"
    );


    if (trackProductBtn) {

        trackProductBtn.disabled =
            true;

        trackProductBtn.textContent =
            "Checking...";

    }


    try {

        // Get logged-in user's session
        const authHeaders =
            await getAuthHeaders();


        const headers =
            authHeaders || {
                "Content-Type":
                    "application/json"
            };


        const response =
            await fetch(
                "/api/track",
                {
                    method: "POST",

                    headers:
                        headers,

                    body:
                        JSON.stringify({
                            url: url
                        })
                }
            );


        const result =
            await response.json();


        if (
            response.ok &&
            result.success
        ) {

            const product =
                createProductData(
                    store,
                    url
                );


            renderTracker(
                product
            );


            showSearchStatus(
                `${result.store || product.store} product added successfully.`,
                "success"
            );


            // Load saved price history
            await loadPriceHistory(
                url
            );


        } else {

            throw new Error(
                result.message ||
                "Unable to track product."
            );

        }


    } catch (error) {

        console.warn(
            "Track API request failed:",
            error
        );


        /*
         * Demo fallback.
         * Real Amazon/Flipkart price data
         * will be connected after authorized
         * store API access is available.
         */

        const product =
            createProductData(
                store,
                url
            );


        renderTracker(
            product
        );


        showSearchStatus(
            "Product added in demo mode. Real store price data will be connected through authorized APIs.",
            "info"
        );

    }


    finally {

        if (trackProductBtn) {

            trackProductBtn.disabled =
                false;

            trackProductBtn.textContent =
                "Track Product";

        }

    }

}
            


/* ================= DEMO PRODUCT ================= */

window.demoProduct =
    function(productName) {

        let store =
            "amazon";

        let url =
            "https://www.amazon.in/";

        if (
            productName
                .toLowerCase()
                .includes("laptop")
        ) {

            store =
                "flipkart";

            url =
                "https://www.flipkart.com/";

        }


        if (productSearch) {

            productSearch.value =
                url;

        }


        const product =
            createProductData(
                store,
                url
            );


        product.productName =
            productName;


        renderTracker(product);


        showSearchStatus(
            "Demo product loaded.",
            "success"
        );

    };


/* ================= SAVE ALERT ================= */

async function savePriceAlert() {

    const value =
        targetPrice
            ? Number(targetPrice.value)
            : 0;


    if (!value || value <= 0) {

        if (alertStatus) {

            alertStatus.textContent =
                "Please enter a valid target price.";

            alertStatus.style.color =
                "#dc2626";

        }

        return;
    }


    const savedProduct =
        getStoredProduct();


    if (!savedProduct || !savedProduct.url) {

        if (alertStatus) {

            alertStatus.textContent =
                "Please track a product first.";

            alertStatus.style.color =
                "#dc2626";

        }

        return;
    }


    try {

        /* Get logged-in user's session */

        const authHeaders =
            await getAuthHeaders();


        if (!authHeaders) {

            if (alertStatus) {

                alertStatus.textContent =
                    "Please login to create a price alert.";

                alertStatus.style.color =
                    "#dc2626";

            }

            return;
        }


        if (alertStatus) {

            alertStatus.textContent =
                "Saving price alert...";

            alertStatus.style.color =
                "#2563eb";

        }


        const response =
            await fetch(
                "/api/alerts",
                {
                    method: "POST",

                    headers:
                        authHeaders,

                    body:
                        JSON.stringify({

                            targetPrice:
                                value,

                            productUrl:
                                savedProduct.url

                        })
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to save price alert."
            );

        }


        /* Save local copy for UI */

        const alertData = {

            targetPrice:
                value,

            productUrl:
                savedProduct.url,

            createdAt:
                new Date().toISOString()

        };


        try {

            localStorage.setItem(
                "priceNazarAlert",
                JSON.stringify(alertData)
            );

        } catch (storageError) {

            console.warn(
                "Could not save local alert:",
                storageError
            );

        }


        if (alertStatus) {

            alertStatus.textContent =
                `Price alert saved for ${formatPrice(value)}.`;

            alertStatus.style.color =
                "#16a34a";

        }


    } catch (error) {

        console.error(
            "Price alert error:",
            error
        );


        if (alertStatus) {

            alertStatus.textContent =
                error.message ||
                "Unable to save price alert.";

            alertStatus.style.color =
                "#dc2626";

        }

    }

}


/* ================= LOAD STORED PRODUCT ================= */

function getStoredProduct() {

    try {

        const data =
            localStorage.getItem(
                "priceNazarTrackedProduct"
            );


        if (!data) {
            return null;
        }


        return JSON.parse(data);

    } catch (error) {

        return null;

    }

}


/* ================= RESTORE TRACKER ================= */

function restoreTracker() {

    const product =
        getStoredProduct();


    if (product) {

        renderTracker(product);

    }

}


/* ================= RESTORE ALERT ================= */

function restoreAlert() {

    try {

        const saved =
            localStorage.getItem(
                "priceNazarAlert"
            );


        if (!saved) {
            return;
        }


        const alertData =
            JSON.parse(saved);


        if (
            targetPrice &&
            alertData.targetPrice
        ) {

            targetPrice.value =
                alertData.targetPrice;

        }


        if (alertStatus) {

            alertStatus.textContent =
                `Saved target price: ${formatPrice(
                    alertData.targetPrice
                )}`;

            alertStatus.style.color =
                "#16a34a";

        }

    } catch (error) {

        console.warn(
            "Could not restore alert."
        );

    }

}


/* ================= MOBILE MENU ================= */

if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener(
        "click",
        () => {

            if (!mainNav) {
                return;
            }


            const isOpen =
                mainNav.classList.contains(
                    "mobile-open"
                );


            if (isOpen) {

                mainNav.classList.remove(
                    "mobile-open"
                );

                mainNav.style.display =
                    "";

            } else {

                mainNav.classList.add(
                    "mobile-open"
                );

                mainNav.style.display =
                    "flex";

                mainNav.style.position =
                    "absolute";

                mainNav.style.top =
                    "64px";

                mainNav.style.left =
                    "14px";

                mainNav.style.right =
                    "14px";

                mainNav.style.padding =
                    "15px";

                mainNav.style.background =
                    "#ffffff";

                mainNav.style.border =
                    "1px solid #e5e7eb";

                mainNav.style.borderRadius =
                    "14px";

                mainNav.style.flexDirection =
                    "column";

                mainNav.style.alignItems =
                    "flex-start";

                mainNav.style.gap =
                    "15px";

                mainNav.style.boxShadow =
                    "0 15px 35px rgba(15,23,42,.12)";

            }

        }
    );

}


/* ================= EVENT LISTENERS ================= */

if (trackProductBtn) {

    trackProductBtn.addEventListener(
        "click",
        trackProduct
    );

}


if (productSearch) {

    productSearch.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                trackProduct();

            }

        }
    );

}


if (saveAlertBtn) {

    saveAlertBtn.addEventListener(
        "click",
        savePriceAlert
    );

}


/* ================= INITIALIZE ================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        restoreTracker();

        restoreAlert();

    }
);
