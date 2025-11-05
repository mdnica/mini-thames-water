// Load environment variables from .env file
import "dotenv/config";

// Import dependencies
import express from "express";
import helmet from "helmet"; // Adds security headers
import cors from "cors"; // Allows frontend (React) to call the API
import bcrypt from "bcrypt"; // For hashing passwords securely
import jwt from "jsonwebtoken"; // For generating/validating tokens
import fs from "fs"; // To read SQL files
import { getDB } from "./db.js"; // Our SQLite helper
import { requireAuth } from "./auth.js"; // Auth middleware we just made

// Create the Express app
const app = express();

// Apply middlewares
app.use(helmet()); // Adds security HTTP headers
app.use(cors({ origin: "http://localhost:5173", credentials: false })); // Allow local React app
app.use(express.json()); // Parse JSON request bodies

// Serve any mock files like fake PDFs (optional)
app.use("/mock", express.static("./server/mock"));

// ---------------------------------------------------------------------------
// 🧠 Initialize database and routes
// ---------------------------------------------------------------------------
async function init() {
  const db = await getDB();

  // 1️⃣ Run the SQL schema file to create tables (if not created yet)
  await db.exec(fs.readFileSync("./schema.sql", "utf8"));

  // If you run "node server.js seed", populate demo data from seed.sql
  if (process.argv[2] === "seed") {
    await db.exec(fs.readFileSync("./seed.sql", "utf8"));
    console.log("✅ Database seeded successfully!");
    console.log("Demo login: demo@customer.test / Demo123!");
    process.exit(0); // Exit after seeding
  }

  // -------------------------------------------------------------------------
  // 👤 AUTH ROUTES (Register and Login)
  // -------------------------------------------------------------------------

  // Register a new user
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, firstName, lastName, address } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Hash the password before saving
    const hash = await bcrypt.hash(password, 10);

    try {
      const db = await getDB();

      // Insert user data into DB
      const result = await db.run(
        "INSERT INTO users (email, password_hash, first_name, last_name, address) VALUES (?,?,?,?,?)",
        email,
        hash,
        firstName || null,
        lastName || null,
        address || null
      );

      // Create a token for the new user
      const token = jwt.sign(
        { id: result.lastID, email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token });
    } catch (err) {
      // Handle duplicate email case
      if (err.message.includes("UNIQUE")) {
        return res.status(409).json({ error: "Email already registered" });
      }
      res.status(500).json({ error: "Server error" });
    }
  });

  // Login existing user
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const db = await getDB();

    // Find user by email
    const user = await db.get("SELECT * FROM users WHERE email = ?", email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare entered password with hashed one
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate a token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  });

  // -------------------------------------------------------------------------
  // 🔒 PROTECTED ROUTES (requireAuth middleware)
  // -------------------------------------------------------------------------

  // Get current logged-in user's data
  app.get("/api/me", requireAuth, async (req, res) => {
    const db = await getDB();
    const user = await db.get(
      "SELECT id, email, first_name AS firstName, last_name AS lastName, address FROM users WHERE id = ?",
      req.user.id
    );
    res.json(user);
  });

  // Get all bills for logged-in user
  app.get("/api/bills", requireAuth, async (req, res) => {
    const db = await getDB();
    const rows = await db.all(
      "SELECT id, due_date AS dueDate, amount_pence AS amountPence, pdf_url AS pdfUrl, status FROM bills WHERE user_id = ? ORDER BY due_date DESC",
      req.user.id
    );
    res.json(rows);
  });

  // Get all meter readings
  app.get("/api/meter-readings", requireAuth, async (req, res) => {
    const db = await getDB();
    const rows = await db.all(
      "SELECT id, reading, submitted_at AS submittedAt FROM meter_readings WHERE user_id = ? ORDER BY submitted_at DESC",
      req.user.id
    );
    res.json(rows);
  });

  // Submit a new meter reading
  app.post("/api/meter-readings", requireAuth, async (req, res) => {
    const { reading } = req.body;

    // Validate reading
    if (typeof reading !== "number" || reading <= 0) {
      return res
        .status(400)
        .json({ error: "Reading must be a positive number" });
    }

    const db = await getDB();
    await db.run(
      "INSERT INTO meter_readings (user_id, reading, submitted_at) VALUES (?,?,?)",
      req.user.id,
      reading,
      new Date().toISOString()
    );
    res.status(201).json({ ok: true });
  });

  // Report a leak/outage/problem
  app.post("/api/incidents", requireAuth, async (req, res) => {
    const { type, description, postcode } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }

    const db = await getDB();
    await db.run(
      "INSERT INTO incidents (user_id, type, description, postcode, created_at) VALUES (?,?,?,?,?)",
      req.user.id,
      type,
      description || null,
      postcode || null,
      new Date().toISOString()
    );

    res.status(201).json({ ok: true });
  });

  // Mock “outage” data
  app.get("/api/outages", requireAuth, async (req, res) => {
    const { postcode = "" } = req.query;
    const area = (postcode || "SE1").slice(0, 2).toUpperCase();

    res.json([
      {
        id: 1,
        area,
        status: "investigating",
        message: "Low pressure reported in your area.",
      },
      {
        id: 2,
        area,
        status: "planned",
        message: "Planned maintenance on 2025-11-10 09:00–12:00.",
      },
    ]);
  });

  // -------------------------------------------------------------------------
  // 🚀 Start the server
  // -------------------------------------------------------------------------
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`✅ API running on http://localhost:${port}`);
  });
}

// Run your setup function
init();
