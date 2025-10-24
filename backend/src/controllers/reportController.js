import fs from "fs";
const fsp = fs.promises;
import mongoose from "mongoose";
import Report from "../models/Report.js";
import { parseExperianXML } from "../utils/xmlParser.js";

export const uploadReport = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  let xml;
  try {
    xml = await fsp.readFile(req.file.path, "utf8");
  } catch (e) {
    try { await fsp.unlink(req.file.path); } catch (_) {}
    return res.status(500).json({ message: "Failed to read uploaded file" });
  }

  let parsed;
  try {
    parsed = await parseExperianXML(xml);
  } catch (e) {
    try { await fsp.unlink(req.file.path); } catch (_) {}
    return res.status(422).json({ message: "Invalid XML", details: e?.message || String(e) });
  } finally {
    try { await fsp.unlink(req.file.path); } catch (_) {}
  }

  const sanitized = {
    fileName: req.file.originalname,
    basicDetails: {
      name: parsed.basicDetails.name || "",
      mobile: parsed.basicDetails.mobile || "",
      pan: parsed.basicDetails.pan || "",
      creditScore:
        parsed.basicDetails.creditScore != null && parsed.basicDetails.creditScore >= 300
          ? parsed.basicDetails.creditScore
          : null,
    },
    summary: {
      totalAccounts: parsed.summary.totalAccounts ?? 0,
      activeAccounts: parsed.summary.activeAccounts ?? 0,
      closedAccounts: parsed.summary.closedAccounts ?? 0,
      currentBalance: parsed.summary.currentBalance ?? 0,
      securedAmount: parsed.summary.securedAmount ?? 0,
      unsecuredAmount: parsed.summary.unsecuredAmount ?? 0,
      enquiriesLast7Days: parsed.summary.enquiriesLast7Days ?? 0,
    },
    accounts: (parsed.accounts ?? [])
      .map((a) => ({
        type: a.type || "Other",
        provider: a.provider || "",
        addresses: Array.isArray(a.addresses) ? a.addresses : [],
        accountNumber: a.accountNumber || "",
        amountOverdue: a.amountOverdue ?? 0,
        currentBalance: a.currentBalance ?? 0,
        status: a.status || "Unknown",
      }))
      .filter((acc) => acc.accountNumber || acc.currentBalance || acc.amountOverdue || acc.provider),
  };

  console.log("PARSED BEFORE SAVE:", JSON.stringify(sanitized, null, 2));

  const doc = new Report({
    fileName: sanitized.fileName,
    basicDetails: sanitized.basicDetails,
    summary: sanitized.summary,
    accounts: sanitized.accounts,
  });

  try {
    await doc.save();
  } catch (e) {
    console.error("Error saving report:", e);
    if (e && e.name === "ValidationError") {
      return res.status(422).json({ message: "Validation failed", details: e.errors });
    }
    return res.status(500).json({ message: "Failed to save report" });
  }

  return res.status(201).json({ message: "File processed and saved successfully", reportId: doc._id });
};

export const getReports = async (req, res) => {
  try {
    const rows = await Report.find({}, "basicDetails uploadedAt fileName").sort({ uploadedAt: -1 }).lean();
    res.json(rows);
  } catch (e) {
    console.error("Error fetching reports:", e);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

export const getReportById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

  try {
    const row = await Report.findById(id).lean();
    if (!row) return res.status(404).json({ message: "Report not found" });
    res.json(row);
  } catch (e) {
    console.error("Error fetching report by id:", e);
    res.status(500).json({ message: "Failed to fetch report" });
  }
};

export const deleteReport = async (req, res) => {
  const { id } = req.params;
  console.log("[DELETE] request received for id:", id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.warn("[DELETE] invalid ObjectId:", id);
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    const doc = await Report.findById(id).lean();
    console.log("[DELETE] found doc:", !!doc);
    if (!doc) return res.status(404).json({ message: "Report not found" });

    if (doc.filePath) {
      try {
        if (fs.existsSync(doc.filePath)) {
          await fsp.unlink(doc.filePath);
          console.log("[DELETE] removed file:", doc.filePath);
        } else {
          console.log("[DELETE] filePath not found on disk:", doc.filePath);
        }
      } catch (fErr) {
        console.warn("[DELETE] could not remove file:", fErr);
      }
    }

    await Report.findByIdAndDelete(id);
    console.log("[DELETE] deleted:", id);
    return res.json({ message: "Report deleted successfully", id });
  } catch (err) {
    console.error("[DELETE] error:", err);
    return res.status(500).json({ message: "Failed to delete report" });
  }
};
