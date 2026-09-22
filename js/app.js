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
            hostname.endsWith(".amazon.com")
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


    const prices =
        history.map(
            item => Number(item.price)
        );


    const maxPrice =
        Math.max(...prices);

    const minPrice =
        Math.min(...prices);


    const range =
        maxPrice - minPrice || 1;


    history.forEach(
        (item) => {

            const price =
                Number(item.price);


            let height =
                35 +
                (
                    (price - minPrice) /
                    range
                ) * 55;


            if (height > 92) {
                height = 92;
            }


            if (height < 30) {
                height = 30;
            }


            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "chart-bar";


            bar.style.setProperty(
                "--bar-height",
                `${height}%`
            );


            const value =
                document.createElement(
                    "span"
                );

            value.className =
                "chart-value";

            value.textContent =
                formatPrice(price);


            const date =
                document.createElement(
                    "span"
                );

            date.className =
                "chart-date";

            date.textContent =
                item.date;


            bar.appendChild(value);

            bar.appendChild(date);

            priceChart.appendChild(bar);

        }
    );

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

        const response =
            await fetch(
                "/api/track",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
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


            renderTracker(product);


            showSearchStatus(
                `${result.store || product.store} product added successfully.`,
                "success"
            );

        } else {

            throw new Error(
                result.message ||
                "Unable to track product."
            );

        }


    } catch (error) {

        console.warn(
            "API request failed:",
            error
        );


        /*
         * Demo fallback.
         * This keeps the frontend usable while
         * real product APIs are being connected.
         */

        const product =
            createProductData(
                store,
                url
            );


        renderTracker(product);


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
            ? Number(
                targetPrice.value
            )
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


    const alertData = {

        targetPrice:
            value,

        productUrl:
            savedProduct
                ? savedProduct.url
                : "",

        createdAt:
            new Date().toISOString()

    };


    try {

        localStorage.setItem(
            "priceNazarAlert",
            JSON.stringify(alertData)
        );

    } catch (error) {

        console.warn(
            "Could not save alert:",
            error
        );

    }


    if (alertStatus) {

        alertStatus.textContent =
            `Price alert saved for ${formatPrice(value)}.`;

        alertStatus.style.color =
            "#16a34a";

    }


    /*
     * Try backend alert API.
     * If the API is not connected yet,
     * localStorage still keeps the alert.
     */

    try {

        await fetch(
            "/api/alerts",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    targetPrice:
                        value,

                    productUrl:
                        savedProduct
                            ? savedProduct.url
                            : ""
                })
            }
        );

    } catch (error) {

        console.warn(
            "Alert API not available yet."
        );

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
