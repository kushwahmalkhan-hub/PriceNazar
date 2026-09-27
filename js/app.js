/* =========================================
   PriceNazar - Electronics Catalog
   Search, Filter, Sort and Compare
   ========================================= */

const products = [
  {
    id: 1,
    name: "Samsung Galaxy S Series",
    category: "Smartphones",
    description: "Samsung flagship smartphone",
    price: null,
    image: "📱",
    searchTerms: "samsung galaxy s series galaxy s samsung phone mobile"
  },
  {
    id: 2,
    name: "Apple iPhone",
    category: "Smartphones",
    description: "Apple smartphone",
    price: null,
    image: "📱",
    searchTerms: "apple iphone ios mobile phone"
  },
  {
    id: 3,
    name: "OnePlus Smartphone",
    category: "Smartphones",
    description: "OnePlus Android smartphone",
    price: null,
    image: "📱",
    searchTerms: "oneplus one plus android smartphone mobile phone oneplus 15"
  },
  {
    id: 4,
    name: "Gaming Laptop",
    category: "Laptops",
    description: "Laptop for gaming and performance",
    price: null,
    image: "💻",
    searchTerms: "gaming laptop gaming notebook"
  },
  {
    id: 5,
    name: "Thin and Light Laptop",
    category: "Laptops",
    description: "Portable laptop for everyday use",
    price: null,
    image: "💻",
    searchTerms: "thin light laptop portable notebook"
  },
  {
    id: 6,
    name: "Smart LED TV",
    category: "Smart TVs",
    description: "Smart television",
    price: null,
    image: "📺",
    searchTerms: "smart tv television led tv"
  },
  {
    id: 7,
    name: "Gaming Graphics Card",
    category: "PC Parts",
    description: "Graphics card for gaming PCs",
    price: null,
    image: "🎮",
    searchTerms: "gaming graphics card gpu nvidia amd"
  },
  {
    id: 8,
    name: "Desktop Processor",
    category: "PC Parts",
    description: "CPU for desktop computers",
    price: null,
    image: "🖥️",
    searchTerms: "desktop processor cpu intel amd"
  },
  {
    id: 9,
    name: "DDR5 RAM",
    category: "PC Parts",
    description: "Desktop memory",
    price: null,
    image: "💾",
    searchTerms: "ddr5 ram memory computer"
  },
  {
    id: 10,
    name: "Wireless Headphones",
    category: "Accessories",
    description: "Wireless audio headphones",
    price: null,
    image: "🎧",
    searchTerms: "wireless headphones headset audio"
  },
  {
    id: 11,
    name: "Bluetooth Earbuds",
    category: "Accessories",
    description: "True wireless earbuds",
    price: null,
    image: "🎵",
    searchTerms: "bluetooth earbuds tws earphones"
  },
  {
    id: 12,
    name: "Android Tablet",
    category: "Tablets",
    description: "Tablet for study and entertainment",
    price: null,
    image: "📟",
    searchTerms: "android tablet tab"
  },
  {
    id: 13,
    name: "Smartwatch",
    category: "Smartwatches",
    description: "Smart wearable watch",
    price: null,
    image: "⌚",
    searchTerms: "smartwatch smart watch wearable"
  },
  {
    id: 14,
    name: "Portable SSD",
    category: "PC Parts",
    description: "External solid state drive",
    price: null,
    image: "💽",
    searchTerms: "portable ssd external storage drive"
  },
  {
    id: 15,
    name: "Wireless Keyboard",
    category: "Accessories",
    description: "Wireless computer keyboard",
    price: null,
    image: "⌨️",
    searchTerms: "wireless keyboard computer"
  },
  {
    id: 16,
    name: "Gaming Mouse",
    category: "Accessories",
    description: "Mouse for gaming and work",
    price: null,
    image: "🖱️",
    searchTerms: "gaming mouse computer mouse"
  }
];

/* =========================================
   DOM Elements
   ========================================= */

const productGrid = document.getElementById("productGrid");
const productSearch = document.getElementById("productSearch");
const searchBtn = document.getElementById("searchBtn");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const searchStatus = document.getElementById("searchStatus");
const compareList = document.getElementById("compareList");
const clearCompareBtn = document.getElementById("clearCompareBtn");
const currentYear = document.getElementById("currentYear");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mainNav = document.getElementById("mainNav");

let selectedProducts = [];
let activeCategory = "all";

/* =========================================
   Helpers
   ========================================= */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatPrice(price) {
  if (typeof price !== "number" || !Number.isFinite(price)) {
    return "Check store";
  }
  return "₹" + price.toLocaleString("en-IN");
}

function getSearchUrl(store, productName) {
  const query = encodeURIComponent(productName);
  if (store === "amazon") {
    return `https://www.amazon.in/s?k=${query}`;
  }
  return `https://www.flipkart.com/search?q=${query}`;
}

function getProductById(id) {
  return products.find(product => product.id === Number(id));
}

/* =========================================
   Product Cards
   ========================================= */

function createProductCard(product) {
  const isSelected = selectedProducts.includes(product.id);

  return `
    <article class="product-card">
      <div class="product-image">
        <span>${escapeHTML(product.image)}</span>
      </div>

      <div class="product-info">
        <span class="product-category">
          ${escapeHTML(product.category)}
        </span>

        <h3 class="product-name">
          ${escapeHTML(product.name)}
        </h3>

        <p class="product-description">
          ${escapeHTML(product.description)}
        </p>

        <div class="product-price">
          ${formatPrice(product.price)}
        </div>

        <p class="price-note">
          Price may vary by store. Check the retailer for the latest price.
        </p>

        <div class="product-actions">
          <a
            class="primary-btn store-link"
            href="${getSearchUrl("amazon", product.name)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Amazon
          </a>

          <a
            class="secondary-btn store-link"
            href="${getSearchUrl("flipkart", product.name)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Flipkart
          </a>
        </div>

        <button
          class="compare-btn ${isSelected ? "selected" : ""}"
          data-compare-id="${product.id}"
          aria-pressed="${isSelected ? "true" : "false"}"
        >
          ${isSelected ? "✓ Added to Compare" : "＋ Compare"}
        </button>
      </div>
    </article>
  `;
}

/* =========================================
   ✅ FIXED: Search, Filter and Sort
   ========================================= */

function getCategoryMatch(productCategory, filterValue) {
  if (filterValue === "all") return true;
  // "Tablets" filter में Tablets + Smartwatches दोनों दिखें
  if (filterValue === "Tablets") {
    return productCategory === "Tablets" || productCategory === "Smartwatches";
  }
  return productCategory === filterValue;
}

function getFilteredProducts() {
  const rawSearch = productSearch.value.trim();
  const searchTerm = normalizeText(rawSearch);
  const category = categoryFilter.value;
  const sortValue = sortFilter.value;

  let filtered = products.filter(product => {
    // Search match
    const searchableText = normalizeText([
      product.name,
      product.category,
      product.description,
      product.searchTerms || ""
    ].join(" "));

    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

    // Dropdown filter match
    const matchesCategory = getCategoryMatch(product.category, category);

    // Category card click match
    const matchesActiveCategory = getCategoryMatch(product.category, activeCategory);

    return matchesSearch && matchesCategory && matchesActiveCategory;
  });

  if (sortValue === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sortValue === "price-asc") {
    filtered.sort((a, b) => {
      if (a.price == null) return 1;
      if (b.price == null) return -1;
      return a.price - b.price;
    });
  }

  if (sortValue === "price-desc") {
    filtered.sort((a, b) => {
      if (a.price == null) return 1;
      if (b.price == null) return -1;
      return b.price - a.price;
    });
  }

  return filtered;
}

function renderProducts() {
  const filtered = getFilteredProducts();

  if (!filtered.length) {
    productGrid.innerHTML = `
      <div class="tracker-empty">
        <div class="empty-icon">🔎</div>
        <h3>No products found</h3>
        <p>Try a different search term or category.</p>
        <button class="primary-btn" id="resetSearchBtn">
          Show All Products
        </button>
      </div>
    `;

    const resetButton = document.getElementById("resetSearchBtn");
    if (resetButton) {
      resetButton.addEventListener("click", resetSearch);
    }
  } else {
    productGrid.innerHTML = filtered.map(createProductCard).join("");
  }

  searchStatus.textContent =
    `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`;
}

function resetSearch() {
  productSearch.value = "";
  categoryFilter.value = "all";
  sortFilter.value = "default";
  activeCategory = "all";
  renderProducts();
}

/* =========================================
   Category Card Click
   ========================================= */

document.querySelectorAll(".category-card").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;

    // Dropdown को sync करें
    const optionExists = [...categoryFilter.options].some(
      opt => opt.value === activeCategory
    );
    categoryFilter.value = optionExists ? activeCategory : "all";

    productSearch.value = "";
    sortFilter.value = "default";

    document.getElementById("products").scrollIntoView({ behavior: "smooth" });

    renderProducts();
  });
});

/* =========================================
   Compare Products
   ========================================= */

function renderComparison() {
  if (!selectedProducts.length) {
    compareList.innerHTML = `
      <p class="compare-empty">
        Select products using the Compare button on a product card.
      </p>
    `;
    return;
  }

  const selected = selectedProducts.map(getProductById).filter(Boolean);

  compareList.innerHTML = `
    <div class="comparison-table-wrap">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Features</th>
            ${selected.map(product => `
              <th>
                ${escapeHTML(product.image)}<br>
                ${escapeHTML(product.name)}<br>
                <button class="compare-remove-btn" data-remove-id="${product.id}">
                  Remove
                </button>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Category</th>
            ${selected.map(p => `<td>${escapeHTML(p.category)}</td>`).join("")}
          </tr>
          <tr>
            <th>Price</th>
            ${selected.map(p => `<td>${formatPrice(p.price)}</td>`).join("")}
          </tr>
          <tr>
            <th>Description</th>
            ${selected.map(p => `<td>${escapeHTML(p.description)}</td>`).join("")}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function toggleCompare(id) {
  const productId = Number(id);

  if (selectedProducts.includes(productId)) {
    selectedProducts = selectedProducts.filter(sid => sid !== productId);
  } else {
    if (selectedProducts.length >= 3) {
      searchStatus.textContent = "You can compare up to 3 products at a time.";
      return;
    }
    selectedProducts.push(productId);
  }

  renderProducts();
  renderComparison();
}

/* =========================================
   Product Grid - Compare Button
   ========================================= */

productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-compare-id]");
  if (!button) return;
  toggleCompare(button.dataset.compareId);
});

/* =========================================
   Compare List - Remove Button
   ========================================= */

compareList.addEventListener("click", event => {
  const button = event.target.closest("[data-remove-id]");
  if (!button) return;
  toggleCompare(button.dataset.removeId);
});

/* =========================================
   Clear Comparison
   ========================================= */

clearCompareBtn.addEventListener("click", () => {
  selectedProducts = [];
  renderProducts();
  renderComparison();
});

/* =========================================
   ✅ FIXED: Search Events
   activeCategory और categoryFilter दोनों
   reset होते हैं search से पहले
   ========================================= */

function doSearch() {
  activeCategory = "all";
  categoryFilter.value = "all";
  renderProducts();
}

searchBtn.addEventListener("click", () => {
  doSearch();
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
});

productSearch.addEventListener("input", () => {
  doSearch();
});

productSearch.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    doSearch();
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  }
});

/* =========================================
   Category Dropdown Filter
   ========================================= */

categoryFilter.addEventListener("change", () => {
  activeCategory = "all";
  renderProducts();
});

/* =========================================
   Sort Filter
   ========================================= */

sortFilter.addEventListener("change", renderProducts);

/* =========================================
   Mobile Navigation
   ========================================= */

mobileMenuBtn.addEventListener("click", () => {
  mainNav.classList.toggle("mobile-open");
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("mobile-open");
  });
});

/* =========================================
   Footer Year
   ========================================= */

currentYear.textContent = new Date().getFullYear();

/* =========================================
   Initial Render
   ========================================= */

renderProducts();
renderComparison();
