USE ecommerce_db;

-- Insert sample admin user (password: admin123)
-- Note: In production, this password should be properly hashed
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@ecommerce.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjO', 'admin');

-- Insert sample products
INSERT INTO products (name, description, price, image_url, stock_quantity) VALUES 
('Laptop', 'High-performance laptop for work and gaming', 999.99, '/placeholder.svg?height=250&width=300', 10),
('Smartphone', 'Latest smartphone with advanced features', 699.99, '/placeholder.svg?height=250&width=300', 15),
('Headphones', 'Wireless noise-cancelling headphones', 199.99, '/placeholder.svg?height=250&width=300', 20),
('Tablet', '10-inch tablet perfect for entertainment', 399.99, '/placeholder.svg?height=250&width=300', 12),
('Smart Watch', 'Fitness tracking smartwatch', 299.99, '/placeholder.svg?height=250&width=300', 8),
('Camera', 'Professional DSLR camera', 1299.99, '/placeholder.svg?height=250&width=300', 5);