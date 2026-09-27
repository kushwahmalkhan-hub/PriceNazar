
/* =========================================
   PriceNazar - Static Electronics Catalog
   No API, no price tracking
   ========================================= */

const products = [
  {
    id: 1,
    name: "Samsung Galaxy S Series",
    category: "Smartphones",
    description: "Samsung flagship smartphone",
    price: null,
    image: "📱"
  },
  {
    id: 2,
    name: "Apple iPhone",
    category: "Smartphones",
    description: "Apple smartphone",
    price: null,
    image: "📱"
  },
  {
    id: 3,
    name: "OnePlus Smartphone",
    category: "Smartphones",
    description: "OnePlus Android smartphone",
    price: null,
    image: "📱"
  },
  {
    id: 4,
    name: "Gaming Laptop",
    category: "Laptops",
    description: "Laptop for gaming and performance",
    price: null,
    image: "💻"
  },
  {
    id: 5,
    name: "Thin and Light Laptop",
    category: "Laptops",
    description: "Portable laptop for everyday use",
    price: null,
    image: "💻"
  },
  {
    id: 6,
    name: "Smart LED TV",
    category: "Smart TVs",
    description: "Smart television",
    price: null,
    image: "📺"
  },
  {
    id: 7,
    name: "Gaming Graphics Card",
    category: "PC Parts",
    description: "Graphics card for gaming PCs",
    price: null,
    image: "🎮"
  },
  {
    id: 8,
    name: "Desktop Processor",
    category: "PC Parts",
    description: "CPU for desktop computers",
    price: null,
    image: "🖥️"
  },
  {
    id: 9,
    name: "DDR5 RAM",
    category: "PC Parts",
    description: "Desktop memory",
    price: null,
    image: "💾"
  },
  {
    id: 10,
    name: "Wireless Headphones",
    category: "Accessories",
    description: "Wireless audio headphones",
    price: null,
    image: "🎧"
  },
  {
    id: 11,
    name: "Bluetooth Earbuds",
    category: "Accessories",
    description: "True wireless earbuds",
    price: null,
    image: "🎵"
  },
  {
    id: 12,
    name: "Android Tablet",
    category: "Tablets",
    description: "Tablet for study and entertainment",
    price: null,
    image: "📟"
  },
  {
    id: 13,
    name: "Smartwatch",
    category: "Smartwatches",
    description: "Smart wearable watch",
    price: null,
    image: "⌚"
  },
  {
    id: 14,
    name: "Portable SSD",
    category: "PC Parts",
    description: "External solid state drive",
    price: null,
    image: "💽"
  },
  {
    id: 15,
    name: "Wireless Keyboard",
    category: "Accessories",
    description: "Wireless computer keyboard",
    price: null,
    image: "⌨️"
  },
  {
    id: 16,
    name: "Gaming Mouse",
    category: "Accessories",
    description: "Mouse for gaming and work",
    price: null,
    image: "🖱️"
  }
];

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
          ${isSelected ? "aria-pressed='true'" : "aria-pressed='false'"}
        >
          ${isSelected ? "✓ Added to Compare" : "＋ Compare"}
        </button>
      </div>
    </article>
  `;
}

/* =========================================
   Search, Filter and Sort
   ========================================= */

function getFilteredProducts() {
  const searchTerm = productSearch.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const sortValue = sortFilter.value;

  let filtered = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm);

    const matchesCategory =
      category === "all" || product.category === category;

    const matchesActiveCategory =
  activeCategory === "all" ||
  product.category === activeCategory ||
  (
    activeCategory === "Tablets" &&
    ["Tablets", "Smartwatches"].includes(product.category)
  );

    return matchesSearch && matchesCategory && matchesActiveCategory;
  });

  if (sortValue === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === "price-asc") {
    filtered.sort((a, b) => {
      if (a.price == null) return 1;
      if (b.price == null) return -1;
      return a.price - b.price;
    });
  } else if (sortValue === "price-desc") {
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
      </div>
    `;
  } else {
    productGrid.innerHTML = filtered.map(createProductCard).join("");
  }

  searchStatus.textContent =
    `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`;
}

/* =========================================
   Category Selection
   ========================================= */

document.querySelectorAll(".category-card").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;

    categoryFilter.value =
      [...categoryFilter.options].some(
        option => option.value === activeCategory
      )
        ? activeCategory
        : "all";

    productSearch.value = "";

    document.getElementById("products").scrollIntoView({
      behavior: "smooth"
    });

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

  const selected = selectedProducts
    .map(getProductById)
    .filter(Boolean);

  compareList.innerHTML = `
    <div class="comparison-table-wrap">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Features</th>
            ${selected.map(product => `
              <th>
                ${escapeHTML(product.image)}
                <br>
                ${escapeHTML(product.name)}
                <br>
                <button
                  class="compare-remove-btn"
                  data-remove-id="${product.id}"
                >
                  Remove
                </button>
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>
          <tr>
            <th>Category</th>
            ${selected.map(product => `
              <td>${escapeHTML(product.category)}</td>
            `).join("")}
          </tr>

          <tr>
            <th>Price</th>
            ${selected.map(product => `
              <td>${formatPrice(product.price)}</td>
            `).join("")}
          </tr>

          <tr>
            <th>Description</th>
            ${selected.map(product => `
              <td>${escapeHTML(product.description)}</td>
            `).join("")}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

es(productId)) {
    selectedProducts = selectedProducts.filter(
      selectedId => selectedId !== productId
    );
  } else {
    if (selectedProducts.length >= 3) {
      searchStatus.textContent =
        "You can compare up to 3 products at a time.";
      return;
    }

    selectedProducts.push(productId);
  }

  renderProducts();
  renderComparison();
}

/* =========================================
   Event Listeners
   ========================================= */

productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-compare-id]");

  if (!button) return;

  toggleCompare(button.dataset.compareId);
});

compareList.addEventListener("click", event => {
  const button = event.target.closest("[data-remove-id]");

  if (!button) return;

  toggleCompare(button.dataset.removeId);
});

clearCompareBtn.addEventListener("click", () => {
  selectedProducts = [];
  renderProducts();
  renderComparison();
});

searchBtn.addEventListener("click", renderProducts);

productSearch.addEventListener("input", renderProducts);

productSearch.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    renderProducts();
  }
});

categoryFilter.addEventListener("change", () => {
  activeCategory = "all";
  renderProducts();
});

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
