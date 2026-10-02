/* =========================================
   PriceNazar - Electronics Catalog
   Supabase powered: search, filter, sort, compare
   (100,000+ products, loaded page by page)
   ========================================= */

/* ---------- CONFIG: यहाँ अपनी Supabase details डालें ---------- */
var SUPABASE_URL = "https://fpkkyppdhkngkktkrbji.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_ib6fxqUCmPPGcJZE0Yqo3A_9Y8pUSXM";
/* ---------------------------------------------------------------- */

var PAGE_SIZE = 24;
var SELECT_COLS = "id,name,category,description,price,image,amazon_link,flipkart_link,search_terms";

/* =========================================
   State
   ========================================= */

var loadedProducts = [];
var totalCount = 0;
var isLoading = false;
var loadError = "";
var requestToken = 0;
var productCache = {};
var selectedProducts = [];
var activeCategory = "all";
var searchTimer = null;

/* =========================================
   Helpers
   ========================================= */

function escapeHTML(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    var entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}

function normalizeText(value) {
  return String(value == null ? "" : value)
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

function safeUrl(url) {
  url = String(url || "").trim();
  return /^https?:\/\//i.test(url) ? url : "";
}

function getSearchUrl(store, productName) {
  var query = encodeURIComponent(productName);
  if (store === "amazon") {
    return "https://www.amazon.in/s?k=" + query + "&tag=pricenazar02-21";
  }
  return "https://www.flipkart.com/search?q=" + query;
}

function getProductById(id) {
  return productCache[Number(id)];
}

function mapRow(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description || "",
    price: r.price === null || r.price === undefined ? null : Number(r.price),
    image: r.image || "📦",
    amazonLink: r.amazon_link || "",
    flipkartLink: r.flipkart_link || "",
    searchTerms: r.search_terms || ""
  };
}

function sbHeaders(extra) {
  var h = { apikey: SUPABASE_ANON_KEY };
  if (SUPABASE_ANON_KEY.indexOf("eyJ") === 0) {
    h.Authorization = "Bearer " + SUPABASE_ANON_KEY;
  }
  for (var k in extra) {
    h[k] = extra[k];
  }
  return h;
}

/* =========================================
   Product Cards
   ========================================= */

function createProductCard(product) {
  var isSelected = selectedProducts.indexOf(product.id) !== -1;
  var amazonHref = safeUrl(product.amazonLink) || getSearchUrl("amazon", product.name);
  var flipkartHref = safeUrl(product.flipkartLink) || getSearchUrl("flipkart", product.name);

  return '<article class="product-card">'
    + '<div class="product-image"><span>' + escapeHTML(product.image) + '</span></div>'
    + '<div class="product-info">'
    + '<span class="product-category">' + escapeHTML(product.category) + '</span>'
    + '<h3 class="product-name">' + escapeHTML(product.name) + '</h3>'
    + '<p class="product-description">' + escapeHTML(product.description) + '</p>'
    + '<div class="product-price">' + formatPrice(product.price) + '</div>'
    + '<p class="price-note">Price may vary by store. Check the retailer for the latest price.</p>'
    + '<div class="product-actions">'
    + '<a class="primary-btn store-link" href="' + escapeHTML(amazonHref) + '" target="_blank" rel="noopener noreferrer">Amazon</a>'
    + '<a class="secondary-btn store-link" href="' + escapeHTML(flipkartHref) + '" target="_blank" rel="noopener noreferrer">Flipkart</a>'
    + '</div>'
    + '<button class="compare-btn ' + (isSelected ? "selected" : "") + '" data-compare-id="' + product.id + '" aria-pressed="' + (isSelected ? "true" : "false") + '">'
    + (isSelected ? "✓ Added to Compare" : "＋ Compare")
    + '</button>'
    + '<button class="share-btn" data-share-name="' + escapeHTML(product.name) + '" data-share-amazon="' + escapeHTML(safeUrl(product.amazonLink)) + '" data-share-flipkart="' + escapeHTML(safeUrl(product.flipkartLink)) + '">🔗 Share</button>'
    + '</div></article>';
}

/* =========================================
   Load products from Supabase (page by page)
   ========================================= */

function getFilterState() {
  var searchEl = document.getElementById("productSearch");
  var categoryEl = document.getElementById("categoryFilter");
  var sortEl = document.getElementById("sortFilter");
  var category = categoryEl && categoryEl.value !== "all" ? categoryEl.value : activeCategory;
  return {
    search: searchEl ? searchEl.value.trim() : "",
    category: category,
    sort: sortEl ? sortEl.value : "default"
  };
}

function buildQuery(state, offset, limit) {
  var parts = ["select=" + SELECT_COLS];

  if (state.category !== "all") {
    var cat = state.category === "Tablets" ? "in.(Tablets,Smartwatches)" : "eq." + state.category;
    parts.push("category=" + encodeURIComponent(cat));
  }

  normalizeText(state.search).split(" ").filter(Boolean).slice(0, 6).forEach(function (word) {
    parts.push("search_text=" + encodeURIComponent("ilike.*" + word + "*"));
  });

  var order = "id.asc";
  if (state.sort === "name-asc") order = "name.asc,id.asc";
  if (state.sort === "price-asc") order = "price.asc.nullslast,id.asc";
  if (state.sort === "price-desc") order = "price.desc.nullslast,id.asc";
  parts.push("order=" + order);

  parts.push("limit=" + limit);
  parts.push("offset=" + offset);
  return parts.join("&");
}

function loadProducts(reset) {
  if (isLoading && !reset) return;

  if (SUPABASE_URL.indexOf("YOUR-PROJECT") !== -1) {
    loadError = "Supabase config अभी नहीं डाली गई है (js/app.js के ऊपर SUPABASE_URL और SUPABASE_ANON_KEY भरें)।";
    renderProducts();
    return;
  }

  var state = getFilterState();
  if (reset) {
    loadedProducts = [];
    totalCount = 0;
    requestToken++;
  }
  var myToken = requestToken;
  var offset = loadedProducts.length;

  isLoading = true;
  loadError = "";
  renderProducts();

  fetch(SUPABASE_URL + "/rest/v1/products?" + buildQuery(state, offset, PAGE_SIZE), {
    headers: sbHeaders(offset === 0 ? { Prefer: "count=exact" } : {})
  })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      var range = res.headers.get("Content-Range");
      return res.json().then(function (rows) {
        return { rows: rows, range: range };
      });
    })
    .then(function (result) {
      if (myToken !== requestToken) return;
      if (offset === 0) {
        var total = result.range ? parseInt(result.range.split("/")[1], 10) : NaN;
        totalCount = isNaN(total) ? result.rows.length : total;
      }
      result.rows.map(mapRow).forEach(function (p) {
        productCache[p.id] = p;
        loadedProducts.push(p);
      });
      isLoading = false;
      renderProducts();
    })
    .catch(function (err) {
      if (myToken !== requestToken) return;
      isLoading = false;
      loadError = "Products लोड नहीं हो पाए (" + err.message + "). थोड़ी देर बाद फिर कोशिश करें।";
      renderProducts();
    });
}

/* =========================================
   Render
   ========================================= */

function updateLoadMore() {
  var wrap = document.getElementById("loadMoreWrap");
  var grid = document.getElementById("productGrid");
  if (!wrap && grid && grid.parentNode) {
    wrap = document.createElement("div");
    wrap.id = "loadMoreWrap";
    wrap.style.cssText = "text-align:center;margin:24px 0;";
    grid.parentNode.insertBefore(wrap, grid.nextSibling);
    wrap.addEventListener("click", function (event) {
      if (event.target.closest("#loadMoreBtn")) loadProducts(false);
    });
  }
  if (!wrap) return;

  var remaining = totalCount - loadedProducts.length;
  if (loadedProducts.length && remaining > 0 && !loadError) {
    wrap.innerHTML = '<button class="primary-btn" id="loadMoreBtn"' + (isLoading ? " disabled" : "") + '>'
      + (isLoading ? "Loading..." : "और products दिखाएँ (" + remaining.toLocaleString("en-IN") + " बाकी)")
      + '</button>';
  } else {
    wrap.innerHTML = "";
  }
}

function renderProducts() {
  var productGrid = document.getElementById("productGrid");
  var searchStatus = document.getElementById("searchStatus");
  if (!productGrid) return;

  if (loadError) {
    productGrid.innerHTML = '<div class="tracker-empty">'
      + '<div class="empty-icon">⚠️</div>'
      + '<h3>Products नहीं मिले</h3>'
      + '<p>' + escapeHTML(loadError) + '</p>'
      + '<button class="primary-btn" id="retryBtn">फिर कोशिश करें</button>'
      + '</div>';
    var retryBtn = document.getElementById("retryBtn");
    if (retryBtn) retryBtn.addEventListener("click", function () { loadProducts(true); });
    if (searchStatus) searchStatus.textContent = "";
    updateLoadMore();
    return;
  }

  if (!loadedProducts.length) {
    if (isLoading) {
      productGrid.innerHTML = '<div class="tracker-empty">'
        + '<div class="empty-icon">🛍️</div>'
        + '<h3>Loading products...</h3>'
        + '</div>';
      if (searchStatus) searchStatus.textContent = "Loading...";
      updateLoadMore();
      return;
    }

    var searchQuery = getFilterState().search;
    if (searchQuery) {
      var amazonUrl = "https://www.amazon.in/s?k=" + encodeURIComponent(searchQuery) + "&tag=pricenazar02-21";
      var flipkartUrl = "https://www.flipkart.com/search?q=" + encodeURIComponent(searchQuery);

      productGrid.innerHTML = '<div class="tracker-empty">'
        + '<div class="empty-icon">🔍</div>'
        + '<h3>' + escapeHTML(searchQuery) + ' - हमारी site पर नहीं मिला</h3>'
        + '<p style="margin-bottom:20px;color:#64748b;">इसे Amazon या Flipkart पर खोजें:</p>'
        + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">'
        + '<a href="' + escapeHTML(amazonUrl) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#FF9900;color:#000;padding:13px 24px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">🛒 Amazon पर खोजें</a>'
        + '<a href="' + escapeHTML(flipkartUrl) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#2874F0;color:#fff;padding:13px 24px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">🛍️ Flipkart पर खोजें</a>'
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
    if (resetBtn) resetBtn.addEventListener("click", resetSearch);

    if (searchStatus) searchStatus.textContent = "0 products found";
    updateLoadMore();
    return;
  }

  productGrid.innerHTML = loadedProducts.map(createProductCard).join("");

  if (searchStatus) {
    if (loadedProducts.length < totalCount) {
      searchStatus.textContent = "Showing " + loadedProducts.length.toLocaleString("en-IN") + " of " + totalCount.toLocaleString("en-IN") + " products";
    } else {
      searchStatus.textContent = totalCount.toLocaleString("en-IN") + " product" + (totalCount === 1 ? "" : "s") + " found";
    }
  }
  updateLoadMore();
}

function resetSearch() {
  var productSearchEl = document.getElementById("productSearch");
  var categoryFilterEl = document.getElementById("categoryFilter");
  var sortFilterEl = document.getElementById("sortFilter");

  if (productSearchEl) productSearchEl.value = "";
  if (categoryFilterEl) categoryFilterEl.value = "all";
  if (sortFilterEl) sortFilterEl.value = "default";
  activeCategory = "all";
  loadProducts(true);
}

function doSearch() {
  activeCategory = "all";
  var categoryFilterEl = document.getElementById("categoryFilter");
  if (categoryFilterEl) categoryFilterEl.value = "all";
  loadProducts(true);
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

  var rows = selected.map(function (p) { return '<td>' + escapeHTML(p.category) + '</td>'; }).join("");
  var priceRows = selected.map(function (p) { return '<td>' + formatPrice(p.price) + '</td>'; }).join("");
  var descRows = selected.map(function (p) { return '<td>' + escapeHTML(p.description) + '</td>'; }).join("");
  var headers = selected.map(function (p) {
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

  if (selectedProducts.indexOf(productId) !== -1) {
    selectedProducts = selectedProducts.filter(function (sid) { return sid !== productId; });
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
   Init
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

  // Share button click
  document.addEventListener("click", function (event) {
    var btn = event.target.closest(".share-btn");
    if (!btn) return;
    if (window.openShareModal) {
      window.openShareModal(btn.dataset.shareName, btn.dataset.shareAmazon, btn.dataset.shareFlipkart);
    }
  });

  // Product grid click (compare button)
  var productGrid = document.getElementById("productGrid");
  if (productGrid) {
    productGrid.addEventListener("click", function (event) {
      var button = event.target.closest("[data-compare-id]");
      if (!button) return;
      toggleCompare(button.dataset.compareId);
    });
  }

  // Compare list click (remove button)
  var compareList = document.getElementById("compareList");
  if (compareList) {
    compareList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-remove-id]");
      if (!button) return;
      toggleCompare(button.dataset.removeId);
    });
  }

  // Clear comparison
  var clearCompareBtn = document.getElementById("clearCompareBtn");
  if (clearCompareBtn) {
    clearCompareBtn.addEventListener("click", function () {
      selectedProducts = [];
      renderProducts();
      renderComparison();
    });
  }

  // Search button
  var searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", function () {
      clearTimeout(searchTimer);
      doSearch();
      var productsSection = document.getElementById("products");
      if (productsSection) productsSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Search input (waits 300ms after typing stops)
  var productSearch = document.getElementById("productSearch");
  if (productSearch) {
    productSearch.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(doSearch, 300);
    });
    productSearch.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        clearTimeout(searchTimer);
        doSearch();
        var productsSection = document.getElementById("products");
        if (productsSection) productsSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Category dropdown
  var categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", function () {
      activeCategory = "all";
      loadProducts(true);
    });
  }

  // Sort filter
  var sortFilter = document.getElementById("sortFilter");
  if (sortFilter) {
    sortFilter.addEventListener("change", function () { loadProducts(true); });
  }

  // Category cards
  document.querySelectorAll(".category-card").forEach(function (button) {
    button.addEventListener("click", function () {
      activeCategory = button.dataset.category;
      var categoryFilterEl = document.getElementById("categoryFilter");
      if (categoryFilterEl) {
        var optionExists = Array.from(categoryFilterEl.options).some(function (opt) {
          return opt.value === activeCategory;
        });
        categoryFilterEl.value = optionExists ? activeCategory : "all";
      }
      var productSearchEl = document.getElementById("productSearch");
      if (productSearchEl) productSearchEl.value = "";
      var sortFilterEl = document.getElementById("sortFilter");
      if (sortFilterEl) sortFilterEl.value = "default";

      var productsSection = document.getElementById("products");
      if (productsSection) productsSection.scrollIntoView({ behavior: "smooth" });

      loadProducts(true);
    });
  });

  // Mobile nav
  var mobileMenuBtn = document.getElementById("mobileMenuBtn");
  var mainNav = document.getElementById("mainNav");
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener("click", function () {
      mainNav.classList.toggle("mobile-open");
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("mobile-open");
      });
    });
  }

  // Footer year
  var currentYear = document.getElementById("currentYear");
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Initial load
  loadProducts(true);
  renderComparison();
});
