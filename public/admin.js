let currentUser = null;
let products = [];
let users = [];

document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus();
  setupEventListeners();
  loadProducts();
  loadUsers();
});

// Check authentication and admin status
function checkAuthStatus() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "/login";
    return;
  }

  currentUser = JSON.parse(user);

  if (currentUser.role !== "admin") {
    alert("Access denied. Admin privileges required.");
    window.location.href = "/";
    return;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Product form
  const addProductBtn = document.getElementById("add-product-btn");
  const productForm = document.getElementById("product-form-element");
  const cancelProductBtn = document.getElementById("cancel-product");

  addProductBtn.addEventListener("click", showProductForm);
  productForm.addEventListener("submit", handleProductSubmit);
  cancelProductBtn.addEventListener("click", hideProductForm);

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", logout);
}

// Switch between tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

  // Update tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(`${tabName}-tab`).classList.add("active");
}

// Load products
async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    products = await response.json();
    displayProducts();
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// Display products in admin panel
function displayProducts() {
  const productsList = document.querySelector("#products-tab .admin-list");
  productsList.innerHTML = "";

  products.forEach((product) => {
    const productItem = document.createElement("div");
    productItem.className = "admin-item";

    // Create image preview for admin
    const imagePreview = product.image_url
      ? `<img src="${product.image_url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;" onerror="this.style.display='none'">`
      : `<div style="width: 60px; height: 60px; background: #333; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #666;">📷</div>`;

    productItem.innerHTML = `
            <div class="item-info" style="display: flex; align-items: center;">
                ${imagePreview}
                <div>
                    <h3>${product.name}</h3>
                    <p>Price: $${Number.parseFloat(product.price).toFixed(
                      2
                    )}</p>
                    <p>Stock: ${product.stock_quantity}</p>
                    <p>Description: ${product.description}</p>
                    ${
                      product.image_url
                        ? `<p style="font-size: 0.8rem; color: #888;">Image: ${product.image_url.substring(
                            0,
                            50
                          )}...</p>`
                        : ""
                    }
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-primary" onclick="editProduct(${
                  product.id
                })">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct(${
                  product.id
                })">Delete</button>
            </div>
        `;
    productsList.appendChild(productItem);
  });
}

// Show product form
function showProductForm(product = null) {
  const form = document.getElementById("product-form");
  const title = document.getElementById("form-title");
  const imageInput = document.getElementById("product-image");
  const imagePreview = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");

  if (product) {
    title.textContent = "Edit Product";
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-description").value = product.description;
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-image").value = product.image_url;
    document.getElementById("product-stock").value = product.stock_quantity;

    // Show image preview if URL exists
    if (product.image_url) {
      previewImg.src = product.image_url;
      imagePreview.style.display = "block";
    }
  } else {
    title.textContent = "Add Product";
    document.getElementById("product-form-element").reset();
    document.getElementById("product-id").value = "";
    imagePreview.style.display = "none";
  }

  // Add image preview functionality
  imageInput.addEventListener("input", function () {
    const url = this.value.trim();
    if (url && isValidImageUrl(url)) {
      previewImg.src = url;
      previewImg.onload = () => {
        imagePreview.style.display = "block";
      };
      previewImg.onerror = () => {
        imagePreview.style.display = "none";
        showMessage("Invalid image URL or image failed to load", "error");
      };
    } else {
      imagePreview.style.display = "none";
    }
  });

  form.style.display = "block";

  // Scroll to the form smoothly when editing
  if (product) {
    setTimeout(() => {
      form.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 100);
  }
}

// Check if URL is a valid image URL
function isValidImageUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return (
      pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
      url.includes("placeholder") ||
      url.includes("unsplash") ||
      url.includes("pexels")
    );
  } catch {
    return false;
  }
}

// Hide product form
function hideProductForm() {
  document.getElementById("product-form").style.display = "none";
}

// Handle product form submission
async function handleProductSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById("product-id").value;
  const productData = {
    name: document.getElementById("product-name").value,
    description: document.getElementById("product-description").value,
    price: Number.parseFloat(document.getElementById("product-price").value),
    image_url: document.getElementById("product-image").value,
    stock_quantity: Number.parseInt(
      document.getElementById("product-stock").value
    ),
  };

  try {
    const url = productId ? `/api/products/${productId}` : "/api/products";
    const method = productId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(productData),
    });

    if (response.ok) {
      showMessage(
        productId
          ? "Product updated successfully"
          : "Product added successfully",
        "success"
      );
      hideProductForm();
      loadProducts();
    } else {
      showMessage("Error saving product", "error");
    }
  } catch (error) {
    console.error("Error saving product:", error);
    showMessage("Error saving product", "error");
  }
}

// Edit product
function editProduct(productId) {
  const product = products.find((p) => p.id === productId);
  if (product) {
    showProductForm(product);
  }
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) {
    return;
  }

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      showMessage("Product deleted successfully", "success");
      loadProducts();
    } else {
      showMessage("Error deleting product", "error");
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    showMessage("Error deleting product", "error");
  }
}

// Load users
async function loadUsers() {
  try {
    const response = await fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      users = await response.json();
      displayUsers();
    }
  } catch (error) {
    console.error("Error loading users:", error);
  }
}

// Display users in admin panel
function displayUsers() {
  const usersList = document.querySelector("#users-tab .admin-list");
  usersList.innerHTML = "";

  users.forEach((user) => {
    const userItem = document.createElement("div");
    userItem.className = "admin-item";
    userItem.innerHTML = `
            <div class="item-info">
                <h3>${user.username}</h3>
                <p>Email: ${user.email}</p>
                <p>Role: ${user.role}</p>
                <p>Joined: ${new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div class="item-actions">
                ${
                  user.id !== currentUser.id
                    ? `<button class="btn btn-danger" onclick="deleteUser(${user.id})">Delete</button>`
                    : ""
                }
            </div>
        `;
    usersList.appendChild(userItem);
  });
}

// Delete user
async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      showMessage("User deleted successfully", "success");
      loadUsers();
    } else {
      showMessage("Error deleting user", "error");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    showMessage("Error deleting user", "error");
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

// Show message function
function showMessage(message, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  messageDiv.style.position = "fixed";
  messageDiv.style.top = "80px";
  messageDiv.style.right = "20px";
  messageDiv.style.zIndex = "9999";
  messageDiv.style.maxWidth = "300px";

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}
