require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MySQL connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Home route
app.get("/", (req, res) => {
  res.json({ message: "Sproutly Backend is running!" });
});

// Get all plants
app.get("/api/plants", async (req, res) => {
  try {
    const [plants] = await pool.query(
      "SELECT * FROM plants ORDER BY plant_id"
    );
    res.json(plants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch plants" });
  }
});

// Get inventory
app.get("/api/inventory", async (req, res) => {
  try {
    const [inventory] = await pool.query(
      "SELECT plant_id, name, category, price, stock FROM plants ORDER BY plant_id"
    );
    res.json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch inventory" });
  }
});

// Update inventory stock
app.put("/api/inventory/:id", async (req, res) => {
  try {
    const plantId = Number(req.params.id);
    const stock = Number(req.body.stock);

    if (
      !Number.isInteger(plantId) ||
      plantId <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return res.status(400).json({
        message: "Valid plant ID and stock are required"
      });
    }

    const [result] = await pool.execute(
      "UPDATE plants SET stock = ? WHERE plant_id = ?",
      [stock, plantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Plant not found" });
    }

    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to update stock" });
  }
});

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders ORDER BY order_date DESC"
    );

    const [items] = await pool.query(
      "SELECT * FROM order_items ORDER BY item_id"
    );

    const result = orders.map((order) => ({
      ...order,
      items: items.filter(
        (item) => Number(item.order_id) === Number(order.order_id)
      )
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch orders" });
  }
});

// Create a new order
app.post("/api/orders", async (req, res) => {
  const {
    customer_name,
    mobile,
    address,
    payment_method,
    items
  } = req.body;

  if (
    !customer_name ||
    !address ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      message: "Customer name, address and order items are required"
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const plantId = Number(item.plant_id);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(plantId) ||
        plantId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        throw new Error("Invalid plant ID or quantity");
      }

      const [plants] = await connection.execute(
        "SELECT * FROM plants WHERE plant_id = ? FOR UPDATE",
        [plantId]
      );

      if (plants.length === 0) {
        throw new Error("Plant not found");
      }

      const plant = plants[0];

      if (plant.stock < quantity) {
        throw new Error(`Insufficient stock for ${plant.name}`);
      }

      const unitPrice = Number(plant.price);
      const subtotal = unitPrice * quantity;

      totalAmount += subtotal;

      orderItems.push({
        plant_name: plant.name,
        quantity,
        unit_price: unitPrice,
        subtotal
      });

      await connection.execute(
        "UPDATE plants SET stock = stock - ? WHERE plant_id = ?",
        [quantity, plantId]
      );
    }

    const [orderResult] = await connection.execute(
      `INSERT INTO orders
       (customer_name, mobile, address, payment_method, total_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [
        customer_name,
        mobile || null,
        address,
        payment_method || "COD",
        totalAmount
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, plant_name, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.plant_name,
          item.quantity,
          item.unit_price,
          item.subtotal
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Order placed successfully",
      order_id: orderId,
      total_amount: totalAmount
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(error);
    res.status(400).json({ message: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Start backend server
async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL database connected successfully!");

    
    app.listen(PORT, "0.0.0.0", () => {
  console.log(`Sproutly backend running on port ${PORT}`);
});
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}

startServer();