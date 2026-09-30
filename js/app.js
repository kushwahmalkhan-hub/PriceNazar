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
   Products — Admin Panel से load होंगे
   ========================================= */

var defaultProducts = products.slice(); // backup

function getProducts() {
  var stored = localStorage.getItem("pn_products");
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return defaultProducts;
}

/* =========================================
   State
   ========================================= */

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
  var query = encodeURIComponent(productName);
  if (store === "amazon") {
    return "https://www.amazon.in/s?k=" + query + "&tag=pricenazar02-21";
  }
  return "https://www.flipkart.com/search?q=" + query;
}

function getProductById(id) {
  return products.find(function(product) {
    return product.id === Number(id);
  });
}

function getCategoryMatch(productCategory, filterValue) {
  if (filterValue === "all") return true;
  if (filterValue === "Tablets") {
    return productCategory === "Tablets" || productCategory === "Smartwatches";
  }
  return productCategory === filterValue;
}

/* =========================================
   Product Cards
   ========================================= */

function createProductCard(product) {
  var isSelected = selectedProducts.includes(product.id);

  return '<article class="product-card">'
    + '<div class="product-image"><span>' + escapeHTML(product.image) + '</span></div>'
    + '<div class="product-info">'
    + '<span class="product-category">' + escapeHTML(product.category) + '</span>'
    + '<h3 class="product-name">' + escapeHTML(product.name) + '</h3>'
    + '<p class="product-description">' + escapeHTML(product.description) + '</p>'
    + '<div class="product-price">' + formatPrice(product.price) + '</div>'
    + '<p class="price-note">Price may vary by store. Check the retailer for the latest price.</p>'
    + '<div class="product-actions">'
    + '<a class="primary-btn store-link" href="' + (product.amazonLink || getSearchUrl("amazon", product.name)) + '" target="_blank" rel="noopener noreferrer">Amazon</a>'
    + '<a class="secondary-btn store-link" href="' + (product.flipkartLink || getSearchUrl("flipkart", product.name)) + '" target="_blank" rel="noopener noreferrer">Flipkart</a>'
    + '</div>'
    + '<button class="compare-btn ' + (isSelected ? "selected" : "") + '" data-compare-id="' + product.id + '" aria-pressed="' + (isSelected ? "true" : "false") + '">'
    + (isSelected ? "✓ Added to Compare" : "＋ Compare")
    + '</button>'
    + '</div></article>';
}

/* =========================================
   Filter & Render
   ========================================= */

function getFilteredProducts() {
  var productSearchEl = document.getElementById("productSearch");
  var categoryFilterEl = document.getElementById("categoryFilter");
  var sortFilterEl = document.getElementById("sortFilter");

  var rawSearch = productSearchEl ? productSearchEl.value.trim() : "";
  var searchTerm = normalizeText(rawSearch);
  var category = categoryFilterEl ? categoryFilterEl.value : "all";
  var sortValue = sortFilterEl ? sortFilterEl.value : "default";

  var allProducts = getProducts();
  var filtered = allProducts.filter(function(product) {
    var searchableText = normalizeText([
      product.name,
      product.category,
      product.description,
      product.searchTerms || ""
    ].join(" "));

    var matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    var matchesCategory = getCategoryMatch(product.category, category);
    var matchesActiveCategory = getCategoryMatch(product.category, activeCategory);

    return matchesSearch && matchesCategory && matchesActiveCategory;
  });

  if (sortValue === "name-asc") {
    filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });
  }
  if (sortValue === "price-asc") {
    filtered.sort(function(a, b) {
      if (a.price == null) return 1;
      if (b.price == null) return -1;
      return a.price - b.price;
    });
  }
  if (sortValue === "price-desc") {
    filtered.sort(function(a, b) {
      if (a.price == null) return 1;
      if (b.price == null) return -1;
      return b.price - a.price;
    });
  }

  return filtered;
}

function renderProducts() {
  var productGrid = document.getElementById("productGrid");
  var searchStatus = document.getElementById("searchStatus");

  if (!productGrid) return;

  var filtered = getFilteredProducts();

  if (!filtered.length) {
    var productSearchEl = document.getElementById("productSearch");
    var searchQuery = productSearchEl ? productSearchEl.value.trim() : "";

    if (searchQuery) {
      var amazonUrl = "https://www.amazon.in/s?k=" + encodeURIComponent(searchQuery) + "&tag=pricenazar02-21";
      var flipkartUrl = "https://www.flipkart.com/search?q=" + encodeURIComponent(searchQuery);

      productGrid.innerHTML = '<div class="tracker-empty">'
        + '<div class="empty-icon">🔍</div>'
        + '<h3>' + searchQuery + ' - हमारी site पर नहीं मिला</h3>'
        + '<p style="margin-bottom:20px;color:#64748b;">इसे Amazon या Flipkart पर खोजें:</p>'
        + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">'
        + '<a href="' + amazonUrl + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#FF9900;color:#000;padding:13px 24px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">🛒 Amazon पर खोजें</a>'
        + '<a href="' + flipkartUrl + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#2874F0;color:#fff;padding:13px 24px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">🛍️ Flipkart पर खोजें</a>'
        + '</div>'
        + '<p style="margin-top:18px;font-size:13px;color:#64748b;">या <button id="resetSearchBtn" style="background:none;border:none;color:#2563eb;cursor:pointer;font-weight:700;font-size:13px;text-decoration:underline;">सभी products देखें</button></p>'
        + '</div>';
    } else {
      productGrid.innerHTML = '<div class="tracker-empty">'
        + '<div class="empty-icon">🔎</div>'
        + '<h3>No products found</h3>'
        + '<p>Try a different search term or category.</p>'
        + '<button class="primary-btn" id="resetSearchBtn">Show All Products</button>'
        + '</div>';
    }

    var resetBtn = document.getElementById("resetSearchBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetSearch);
    }
  } else {
    productGrid.innerHTML = filtered.map(createProductCard).join("");
  }

  if (searchStatus) {
    searchStatus.textContent = filtered.length + " product" + (filtered.length === 1 ? "" : "s") + " found";
  }
}

function resetSearch() {
  var productSearchEl = document.getElementById("productSearch");
  var categoryFilterEl = document.getElementById("categoryFilter");
  var sortFilterEl = document.getElementById("sortFilter");

  if (productSearchEl) productSearchEl.value = "";
  if (categoryFilterEl) categoryFilterEl.value = "all";
  if (sortFilterEl) sortFilterEl.value = "default";
  activeCategory = "all";
  renderProducts();
}

function doSearch() {
  activeCategory = "all";
  var categoryFilterEl = document.getElementById("categoryFilter");
  if (categoryFilterEl) categoryFilterEl.value = "all";
  renderProducts();
}

/* =========================================
   Compare
   ========================================= */

function renderComparison() {
  var compareList = document.getElementById("compareList");
  if (!compareList) return;

  if (!selectedProducts.length) {
    compareList.innerHTML = '<p class="compare-empty">Select products using the Compare button on a product card.</p>';
    return;
  }

  var selected = selectedProducts.map(getProductById).filter(Boolean);

  var rows = selected.map(function(p) { return '<td>' + escapeHTML(p.category) + '</td>'; }).join("");
  var priceRows = selected.map(function(p) { return '<td>' + formatPrice(p.price) + '</td>'; }).join("");
  var descRows = selected.map(function(p) { return '<td>' + escapeHTML(p.description) + '</td>'; }).join("");
  var headers = selected.map(function(p) {
    return '<th>' + escapeHTML(p.image) + '<br>' + escapeHTML(p.name) + '<br>'
      + '<button class="compare-remove-btn" data-remove-id="' + p.id + '">Remove</button></th>';
  }).join("");

  compareList.innerHTML = '<div class="comparison-table-wrap"><table class="comparison-table">'
    + '<thead><tr><th>Features</th>' + headers + '</tr></thead>'
    + '<tbody>'
    + '<tr><th>Category</th>' + rows + '</tr>'
    + '<tr><th>Price</th>' + priceRows + '</tr>'
    + '<tr><th>Description</th>' + descRows + '</tr>'
    + '</tbody></table></div>';
}

function toggleCompare(id) {
  var productId = Number(id);
  var searchStatus = document.getElementById("searchStatus");

  if (selectedProducts.includes(productId)) {
    selectedProducts = selectedProducts.filter(function(sid) { return sid !== productId; });
  } else {
    if (selectedProducts.length >= 3) {
      if (searchStatus) searchStatus.textContent = "You can compare up to 3 products at a time.";
      return;
    }
    selectedProducts.push(productId);
  }

  renderProducts();
  renderComparison();
}

/* =========================================
   Init — सब कुछ DOMContentLoaded में
   ========================================= */

document.addEventListener("DOMContentLoaded", function() {

  // Product grid click (compare button)
  var productGrid = document.getElementById("productGrid");
  if (productGrid) {
    productGrid.addEventListener("click", function(event) {
      var button = event.target.closest("[data-compare-id]");
      if (!button) return;
      toggleCompare(button.dataset.compareId);
    });
  }

  // Compare list click (remove button)
  var compareList = document.getElementById("compareList");
  if (compareList) {
    compareList.addEventListener("click", function(event) {
      var button = event.target.closest("[data-remove-id]");
      if (!button) return;
      toggleCompare(button.dataset.removeId);
    });
  }

  // Clear comparison
  var clearCompareBtn = document.getElementById("clearCompareBtn");
  if (clearCompareBtn) {
    clearCompareBtn.addEventListener("click", function() {
      selectedProducts = [];
      renderProducts();
      renderComparison();
    });
  }

  // Search button
  var searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", function() {
      doSearch();
      var productsSection = document.getElementById("products");
      if (productsSection) productsSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Search input
  var productSearch = document.getElementById("productSearch");
  if (productSearch) {
    productSearch.addEventListener("input", function() {
      doSearch();
    });
    productSearch.addEventListener("keydown", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        doSearch();
        var productsSection = document.getElementById("products");
        if (productsSection) productsSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Category dropdown
  var categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", function() {
      activeCategory = "all";
      renderProducts();
    });
  }

  // Sort filter
  var sortFilter = document.getElementById("sortFilter");
  if (sortFilter) {
    sortFilter.addEventListener("change", renderProducts);
  }

  // Category cards
  document.querySelectorAll(".category-card").forEach(function(button) {
    button.addEventListener("click", function() {
      activeCategory = button.dataset.category;
      var categoryFilter = document.getElementById("categoryFilter");
      if (categoryFilter) {
        var optionExists = Array.from(categoryFilter.options).some(function(opt) {
          return opt.value === activeCategory;
        });
        categoryFilter.value = optionExists ? activeCategory : "all";
      }
      var productSearch = document.getElementById("productSearch");
      if (productSearch) productSearch.value = "";
      var sortFilter = document.getElementById("sortFilter");
      if (sortFilter) sortFilter.value = "default";

      var productsSection = document.getElementById("products");
      if (productsSection) productsSection.scrollIntoView({ behavior: "smooth" });

      renderProducts();
    });
  });

  // Mobile nav
  var mobileMenuBtn = document.getElementById("mobileMenuBtn");
  var mainNav = document.getElementById("mainNav");
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener("click", function() {
      mainNav.classList.toggle("mobile-open");
    });
    mainNav.querySelectorAll("a").forEach(function(link) {
      link.addEventListener("click", function() {
        mainNav.classList.remove("mobile-open");
      });
    });
  }

  // Footer year
  var currentYear = document.getElementById("currentYear");
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Initial render
  renderProducts();
  renderComparison();

});
