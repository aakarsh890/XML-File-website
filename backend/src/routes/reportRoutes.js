import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { uploadReport, getReports, getReportById, deleteReport } from "../controllers/reportController.js";

const router = express.Router();
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
    const random = crypto.randomBytes(6).toString("hex");
    cb(null, `${Date.now()}-${random}-${base}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/upload", upload.single("file"), uploadReport);
router.get("/", getReports);
router.get("/:id", getReportById);
router.delete("/:id", deleteReport);

export default router;
