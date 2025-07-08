let cartItems = [];

document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus();
  loadCart();
  setupEventListeners();
});

// Check authentication status
function checkAuthStatus() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    showMessage("Please login to view your cart", "error");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
    return;
  }

  const currentUser = JSON.parse(user);
  const usernameDisplay = document.getElementById("username-display");

  if (usernameDisplay) {
    const username =
      currentUser.username.length > 15
        ? currentUser.username.substring(0, 15) + "..."
        : currentUser.username;

    usernameDisplay.innerHTML = `👋 ${username}`;
  }
}

// Setup event listeners
function setupEventListeners() {
  const logoutBtn = document.getElementById("logout-btn");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", checkout);
  }
}

// Load cart items
async function loadCart() {
  try {
    const response = await fetch("/api/cart", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      cartItems = await response.json();
      displayCart();
    } else {
      showMessage("Error loading cart", "error");
    }
  } catch (error) {
    console.error("Error loading cart:", error);
    showMessage("Error loading cart", "error");
  }
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

// Get product image URL - updated to use actual URLs
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
  return `https://via.placeholder.com/120x120/${colorPair[0]}/${
    colorPair[1]
  }?text=${getProductEmoji(productName)}`;
}

// Update displayCart to use actual image URLs
function displayCart() {
  const cartContainer = document.getElementById("cart-items");
  const emptyCart = document.getElementById("empty-cart");
  const cartSummary = document.getElementById("cart-summary");

  if (cartItems.length === 0) {
    cartContainer.style.display = "none";
    cartSummary.style.display = "none";
    emptyCart.style.display = "block";
    return;
  }

  cartContainer.style.display = "block";
  cartSummary.style.display = "block";
  emptyCart.style.display = "none";

  cartContainer.innerHTML = "";
  let total = 0;

  cartItems.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    // Use actual image URL if available
    const imageUrl = getProductImage(
      item.name,
      item.product_id,
      item.image_url
    );

    cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${imageUrl}" alt="${
      item.name
    }" style="width: 120px; height: 120px; object-fit: cover; border-radius: 12px;" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; align-items: center; justify-content: center; width: 120px; height: 120px; background: linear-gradient(45deg, #2a2a2a, #3a3a3a); color: white; font-size: 1.5rem; border-radius: 12px;">
                    ${getProductEmoji(item.name)}
                </div>
            </div>
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.name}</h3>
                <div class="cart-item-price">$${Number.parseFloat(
                  item.price
                ).toFixed(2)} each</div>
                <div class="cart-item-quantity">
                    <label style="color: #cccccc; margin-bottom: 8px; display: block;">Quantity:</label>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${
                          item.product_id
                        }, ${item.quantity - 1})">−</button>
                        <input type="number" class="quantity-input" value="${
                          item.quantity
                        }" min="1" onchange="updateQuantity(${
      item.product_id
    }, this.value)">
                        <button class="quantity-btn" onclick="updateQuantity(${
                          item.product_id
                        }, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <div class="item-total">Subtotal: $${itemTotal.toFixed(2)}</div>
            </div>
            <button class="btn btn-danger" onclick="removeFromCart(${
              item.product_id
            })">
                🗑️ Remove
            </button>
        `;

    cartContainer.appendChild(cartItem);
  });

  document.getElementById("cart-total").textContent = total.toFixed(2);
}

// Update item quantity
async function updateQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(productId);
    return;
  }

  try {
    // Remove current item
    await fetch(`/api/cart/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    // Add with new quantity
    await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: Number.parseInt(newQuantity),
      }),
    });

    showMessage("✅ Quantity updated", "success");
    loadCart();
  } catch (error) {
    console.error("Error updating quantity:", error);
    showMessage("Error updating quantity", "error");
  }
}

// Remove item from cart
async function removeFromCart(productId) {
  if (!confirm("Are you sure you want to remove this item from your cart?")) {
    return;
  }

  try {
    const response = await fetch(`/api/cart/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      showMessage("🗑️ Item removed from cart", "success");
      loadCart();
    } else {
      showMessage("Error removing item", "error");
    }
  } catch (error) {
    console.error("Error removing item:", error);
    showMessage("Error removing item", "error");
  }
}

// Checkout process
async function checkout() {
  if (cartItems.length === 0) {
    showMessage("Your cart is empty", "error");
    return;
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (!confirm(`Complete your order for $${total.toFixed(2)}?`)) {
    return;
  }

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        total_amount: total,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      showMessage(
        "🎉 Order placed successfully! Thank you for your purchase!",
        "success"
      );

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else {
      showMessage("Error placing order", "error");
    }
  } catch (error) {
    console.error("Error during checkout:", error);
    showMessage("Error placing order", "error");
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  showMessage("👋 Logged out successfully", "success");
  setTimeout(() => {
    window.location.href = "/";
  }, 1000);
}

// Show message function with better styling
function showMessage(message, type) {
  // Remove existing messages
  const existingMessages = document.querySelectorAll(".floating-message");
  existingMessages.forEach((msg) => msg.remove());

  const messageDiv = document.createElement("div");
  messageDiv.className = `floating-message message ${type}`;
  messageDiv.innerHTML = message;

  document.body.appendChild(messageDiv);

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

  setTimeout(() => {
    messageDiv.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    messageDiv.style.transform = "translateX(100%)";
    setTimeout(() => {
      messageDiv.remove();
    }, 300);
  }, 4000);
}
