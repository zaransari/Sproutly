CREATE DATABASE IF NOT EXISTS sproutly_db;

USE sproutly_db;

-- 1. Plants Table
CREATE TABLE IF NOT EXISTS plants (
    plant_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10,2),
    stock INT DEFAULT 0,
    description TEXT
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15),
    address TEXT,
    payment_method VARCHAR(30),
    total_amount DECIMAL(10,2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    plant_name VARCHAR(100),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- 4. Add plants only if they do not already exist
INSERT INTO plants (name, category, price, stock, description)
SELECT new.name, new.category, new.price, new.stock, new.description
FROM (
    SELECT 'Money Plant' AS name, 'Indoor' AS category, 199.00 AS price, 20 AS stock, 'Easy to grow indoor plant' AS description
    UNION ALL SELECT 'Snake Plant', 'Indoor', 299.00, 15, 'Low maintenance indoor plant'
    UNION ALL SELECT 'Aloe Vera', 'Medicinal', 149.00, 25, 'Useful medicinal plant'
    UNION ALL SELECT 'Peace Lily', 'Indoor', 349.00, 10, 'Beautiful flowering indoor plant'
    UNION ALL SELECT 'Areca Plant', 'Indoor', 499.00, 12, 'Decorative indoor plant'
    UNION ALL SELECT 'Spider Plant', 'Indoor', 199.00, 18, 'Easy to care indoor plant'
    UNION ALL SELECT 'Rose', 'Flowering', 99.00, 30, 'Beautiful flowering plant'
    UNION ALL SELECT 'Hibiscus', 'Flowering', 149.00, 20, 'Flowering garden plant'
    UNION ALL SELECT 'Jasmine', 'Flowering', 129.00, 15, 'Fragrant flowering plant'
    UNION ALL SELECT 'Tulsi', 'Medicinal', 99.00, 25, 'Traditional medicinal plant'
    UNION ALL SELECT 'Curry Leaf', 'Herb', 79.00, 20, 'Useful kitchen garden plant'
    UNION ALL SELECT 'Lemon', 'Fruit', 249.00, 10, 'Fruit bearing plant'
) AS new
WHERE NOT EXISTS (
    SELECT 1 FROM plants p WHERE p.name = new.name
);

-- 5. Check all plants
SELECT * FROM plants;

-- 6. Check all tables
SHOW TABLES;