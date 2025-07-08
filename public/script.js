// Global variables
let currentUser = null;
let products = [];
const cart = [];

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus();
  loadProducts();
  setupEventListeners();
});

// Check if user is authenticated
function checkAuthStatus() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (token && user) {
    currentUser = JSON.parse(user);
    updateAuthUI();
    loadCartCount();
  }
}

// Update authentication UI
function updateAuthUI() {
  const authLinks = document.getElementById("auth-links");
  const userMenu = document.getElementById("user-menu");
  const usernameDisplay = document.getElementById("username-display");
  const adminLink = document.getElementById("admin-link");

  if (currentUser) {
    authLinks.style.display = "none";
    userMenu.style.display = "flex";

    // Format username display properly
    const username =
      currentUser.username.length > 15
        ? currentUser.username.substring(0, 15) + "..."
        : currentUser.username;

    usernameDisplay.innerHTML = `👋 ${username}`;

    if (currentUser.role === "admin" && adminLink) {
      adminLink.style.display = "inline";
      adminLink.innerHTML = "⚙️ Admin";
    }
  } else {
    authLinks.style.display = "flex";
    userMenu.style.display = "none";
  }
}

// Setup event listeners
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Mobile menu toggle
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }
}

// Load products from API
async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (response.ok) {
      products = await response.json();
      displayProducts();
    } else {
      console.error("Failed to load products");
      showMessage("Failed to load products", "error");
    }
  } catch (error) {
    console.error("Error loading products:", error);
    showMessage("Error loading products", "error");
  }
}

// Display products on the page
function displayProducts() {
  const productsGrid = document.getElementById("products-grid");
  if (!productsGrid) return;

  productsGrid.innerHTML = "";

  if (products.length === 0) {
    productsGrid.innerHTML =
      '<p style="text-align: center; color: #cccccc; font-size: 1.2rem;">No products available</p>';
    return;
  }

  products.forEach((product) => {
    const productCard = createProductCard(product);
    productsGrid.appendChild(productCard);
  });
}

// Create product card element
function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  // Use actual image URL if available
  const imageUrl = getProductImage(product.name, product.id, product.image_url);

  card.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${
    product.name
  }" style="width: 100%; height: 280px; object-fit: cover; border-radius: 20px 20px 0 0;" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="display: none; align-items: center; justify-content: center; height: 280px; background: linear-gradient(45deg, #2a2a2a, #3a3a3a); color: white; font-size: 1.1rem; font-weight: 600; border-radius: 20px 20px 0 0;">
                ${getProductEmoji(product.name)} ${product.name}
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">$${Number.parseFloat(
              product.price
            ).toFixed(2)}</div>
            <button class="btn btn-primary" onclick="addToCart(${product.id})">
                🛒 Add to Cart
            </button>
        </div>
    `;

  return card;
}

// Get product emoji based on product name
function getProductEmoji(productName) {
  const name = productName.toLowerCase();
  if (name.includes("laptop")) return "💻";
  if (name.includes("phone") || name.includes("smartphone")) return "📱";
  if (name.includes("headphone")) return "🎧";
  if (name.includes("tablet")) return "📱";
  if (name.includes("watch")) return "⌚";
  if (name.includes("camera")) return "📷";
  if (name.includes("mouse")) return "🖱️";
  if (name.includes("keyboard")) return "⌨️";
  if (name.includes("monitor")) return "🖥️";
  if (name.includes("speaker")) return "🔊";
  return "📦";
}

// Get product image URL - now supports actual URLs
function getProductImage(productName, productId, actualImageUrl = null) {
  // If we have an actual image URL, use it
  if (actualImageUrl && actualImageUrl.trim() !== "") {
    return actualImageUrl;
  }

  // Fallback to gradient placeholder
  const colors = [
    ["667eea", "f093fb"],
    ["f093fb", "f5576c"],
    ["4facfe", "00f2fe"],
    ["43e97b", "38f9d7"],
    ["fa709a", "fee140"],
    ["a8edea", "fed6e3"],
    ["ff9a9e", "fecfef"],
    ["ffecd2", "fcb69f"],
  ];

  const colorPair = colors[productId % colors.length];
  return `https://via.placeholder.com/400x280/${colorPair[0]}/${
    colorPair[1]
  }?text=${encodeURIComponent(productName)}`;
}

// Add product to cart
async function addToCart(productId) {
  if (!currentUser) {
    showMessage("Please login to add items to cart", "error");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
    return;
  }

  try {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: 1,
      }),
    });

    if (response.ok) {
      showMessage("✅ Item added to cart!", "success");
      loadCartCount();
    } else {
      const errorData = await response.json();
      showMessage(errorData.error || "Error adding item to cart", "error");
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    showMessage("Error adding item to cart", "error");
  }
}

// Load cart count
async function loadCartCount() {
  if (!currentUser) return;

  try {
    const response = await fetch("/api/cart", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const cartItems = await response.json();
      const count = cartItems.reduce((total, item) => total + item.quantity, 0);
      const cartCountElement = document.getElementById("cart-count");
      if (cartCountElement) {
        cartCountElement.textContent = count;
        // Add animation when count changes
        cartCountElement.style.transform = "scale(1.2)";
        setTimeout(() => {
          cartCountElement.style.transform = "scale(1)";
        }, 200);
      }
    }
  } catch (error) {
    console.error("Error loading cart count:", error);
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  currentUser = null;
  showMessage("👋 Logged out successfully", "success");
  setTimeout(() => {
    window.location.href = "/";
  }, 1000);
}

// Show message to user with better styling
function showMessage(message, type) {
  // Remove existing messages
  const existingMessages = document.querySelectorAll(".floating-message");
  existingMessages.forEach((msg) => msg.remove());

  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = `floating-message message ${type}`;
  messageDiv.innerHTML = message;

  // Add to page
  document.body.appendChild(messageDiv);

  // Style the message
  messageDiv.style.position = "fixed";
  messageDiv.style.top = "90px";
  messageDiv.style.right = "20px";
  messageDiv.style.zIndex = "9999";
  messageDiv.style.maxWidth = "350px";
  messageDiv.style.padding = "15px 20px";
  messageDiv.style.borderRadius = "12px";
  messageDiv.style.fontWeight = "600";
  messageDiv.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)";
  messageDiv.style.backdropFilter = "blur(10px)";
  messageDiv.style.transform = "translateX(100%)";
  messageDiv.style.transition = "transform 0.3s ease";

  // Animate in
  setTimeout(() => {
    messageDiv.style.transform = "translateX(0)";
  }, 100);

  // Remove after 4 seconds
  setTimeout(() => {
    messageDiv.style.transform = "translateX(100%)";
    setTimeout(() => {
      messageDiv.remove();
    }, 300);
  }, 4000);
}

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});
