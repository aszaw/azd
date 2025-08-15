import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// configurable via env
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || `${50 * 1024 * 1024}`, 10); // 50MB

// ensure upload dir exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// basic CORS (lock this down in prod)
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
  credentials: true
}));

// Multer setup (disk storage, keep original filename with a timestamp prefix)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const name = `${Date.now()}_${safe}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// Upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  // Nginx serves "/uploads" from the same volume; we return a relative URL
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Health check
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// (Optional) static serving directly from Express if you want (Nginx already handles this):
// app.use("/uploads", express.static(UPLOAD_DIR));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend listening on :${port}, upload dir: ${UPLOAD_DIR}`);
});
