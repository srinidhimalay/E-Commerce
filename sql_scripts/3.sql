-- Temporary admin user (we'll update the password later)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@ecommerce.com', 'temp_password', 'admin');