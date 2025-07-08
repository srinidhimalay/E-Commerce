const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;
const JWT_SECRET = "your-secret-key-change-this-in-production";

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(cors());

// Database connection - UPDATE THESE CREDENTIALS
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Bluelock1>", // Replace with your MySQL root password
  database: "ecommerce_db",
});

// Test database connection
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL database successfully!");
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Routes

// User registration
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error("Registration error:", err);
          return res
            .status(400)
            .json({ error: "User already exists or invalid data" });
        }
        res.json({ message: "User registered successfully" });
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// User login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) {
        console.error("Login query error:", err);
        return res.status(500).json({ error: "Server error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = results[0];

      // For the temporary admin user, check plain text password
      let validPassword = false;
      if (
        user.username === "admin" &&
        user.password === "temp_password" &&
        password === "admin123"
      ) {
        validPassword = true;
      } else {
        validPassword = await bcrypt.compare(password, user.password);
      }

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    }
  );
});

// Get all products
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Products query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(results);
  });
});

// Add product (admin only)
app.post("/api/products", authenticateToken, requireAdmin, (req, res) => {
  const { name, description, price, image_url, stock_quantity } = req.body;

  db.query(
    "INSERT INTO products (name, description, price, image_url, stock_quantity) VALUES (?, ?, ?, ?, ?)",
    [name, description, price, image_url, stock_quantity],
    (err, result) => {
      if (err) {
        console.error("Add product error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json({ message: "Product added successfully", id: result.insertId });
    }
  );
});

// Update product (admin only)
app.put("/api/products/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url, stock_quantity } = req.body;

  db.query(
    "UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, stock_quantity = ? WHERE id = ?",
    [name, description, price, image_url, stock_quantity, id],
    (err, result) => {
      if (err) {
        console.error("Update product error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json({ message: "Product updated successfully" });
    }
  );
});

// Delete product (admin only)
app.delete("/api/products/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Delete product error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json({ message: "Product deleted successfully" });
  });
});

// Get cart items
app.get("/api/cart", authenticateToken, (req, res) => {
  db.query(
    `SELECT c.*, p.name, p.price, p.image_url 
         FROM cart c 
         JOIN products p ON c.product_id = p.id 
         WHERE c.user_id = ?`,
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error("Cart query error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json(results);
    }
  );
});

// Add to cart
app.post("/api/cart", authenticateToken, (req, res) => {
  const { product_id, quantity } = req.body;

  // First check if item already exists in cart
  db.query(
    "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
    [req.user.id, product_id],
    (err, results) => {
      if (err) {
        console.error("Cart check error:", err);
        return res.status(500).json({ error: "Server error" });
      }

      if (results.length > 0) {
        // Update existing cart item
        db.query(
          "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?",
          [quantity, req.user.id, product_id],
          (err, result) => {
            if (err) {
              console.error("Cart update error:", err);
              return res.status(500).json({ error: "Server error" });
            }
            res.json({ message: "Cart updated" });
          }
        );
      } else {
        // Insert new cart item
        db.query(
          "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
          [req.user.id, product_id, quantity],
          (err, result) => {
            if (err) {
              console.error("Cart insert error:", err);
              return res.status(500).json({ error: "Server error" });
            }
            res.json({ message: "Item added to cart" });
          }
        );
      }
    }
  );
});

// Remove from cart
app.delete("/api/cart/:productId", authenticateToken, (req, res) => {
  const { productId } = req.params;

  db.query(
    "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
    [req.user.id, productId],
    (err, result) => {
      if (err) {
        console.error("Cart delete error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json({ message: "Item removed from cart" });
    }
  );
});

// Create order
app.post("/api/orders", authenticateToken, (req, res) => {
  const { total_amount, items } = req.body;

  db.query(
    "INSERT INTO orders (user_id, total_amount) VALUES (?, ?)",
    [req.user.id, total_amount],
    (err, result) => {
      if (err) {
        console.error("Order creation error:", err);
        return res.status(500).json({ error: "Server error" });
      }

      const orderId = result.insertId;

      // Insert order items
      const orderItems = items.map((item) => [
        orderId,
        item.product_id,
        item.quantity,
        item.price,
      ]);

      db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
        [orderItems],
        (err) => {
          if (err) {
            console.error("Order items error:", err);
            return res.status(500).json({ error: "Server error" });
          }

          // Clear cart
          db.query(
            "DELETE FROM cart WHERE user_id = ?",
            [req.user.id],
            (err) => {
              if (err) {
                console.error("Cart clear error:", err);
                return res.status(500).json({ error: "Server error" });
              }
              res.json({ message: "Order placed successfully", orderId });
            }
          );
        }
      );
    }
  );
});

// Get all users (admin only)
app.get("/api/users", authenticateToken, requireAdmin, (req, res) => {
  db.query(
    "SELECT id, username, email, role, created_at FROM users",
    (err, results) => {
      if (err) {
        console.error("Users query error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json(results);
    }
  );
});

// Delete user (admin only)
app.delete("/api/users/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("User delete error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json({ message: "User deleted successfully" });
  });
});

// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/cart", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cart.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Make sure to update the database password in server.js`);
});
