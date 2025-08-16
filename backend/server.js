import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pkg from "pg";

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurable via env
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
const PORT = process.env.PORT || 4000;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || `${50 * 1024 * 1024}`, 10); // 50MB

// Ensure upload dir exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// CORS setup (adjust origins in production)
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000","http://localhost:5173","http://localhost:8080"],
  credentials: true
}));

// Multer setup (disk storage with timestamp prefix)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const name = `${Date.now()}_${safe}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// Postgres pool
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    await pool.query(
      "INSERT INTO files (filename, class) VALUES ($1, $2)",
      [req.file.filename, req.body.class || null]
    );
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// Fuzzy search endpoint
app.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  try {
    const result = await pool.query(
      `
      SELECT filename, class, upload_time
      FROM files
      WHERE filename % $1 OR class % $1
      ORDER BY GREATEST(similarity(filename, $1), similarity(class, $1)) DESC
      LIMIT 20
      `,
      [query]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search query failed" });
  }
});

// Health check
app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}, upload dir: ${UPLOAD_DIR}`);
});
