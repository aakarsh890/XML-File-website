import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Stack,
  useTheme,
  Divider,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ClearIcon from "@mui/icons-material/Clear";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { uploadXML } from "../api";

function formatBytes(bytes = 0) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function UploadPage() {
  const theme = useTheme();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: "info", text: "" });
  const inputRef = useRef(null);
  const MAX_SIZE = 5 * 1024 * 1024;

  const onChoose = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xml")) {
      setSnack({ open: true, severity: "error", text: "Only .xml files are allowed." });
      return;
    }
    if (f.size > MAX_SIZE) {
      setSnack({ open: true, severity: "error", text: `File too large. Max ${formatBytes(MAX_SIZE)}.` });
      return;
    }
    setFile(f);
    setMessage("");
    setProgress(0);
  };

  const handleFileChange = (e) => onChoose(e.target.files?.[0] ?? null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer?.files?.[0] ?? null;
    onChoose(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
    setProgress(0);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setSnack({ open: true, severity: "warning", text: "Please select an XML file first." });
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      setMessage("");
      setProgress(0);
      const response = await uploadXML(formData, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      setMessage(response?.data?.message || "Upload successful");
      setSnack({ open: true, severity: "success", text: "Upload successful" });
      resetInput();
    } catch (err) {
      const text = err?.response?.data?.message || err?.message || "Upload failed";
      setMessage(text);
      setSnack({ open: true, severity: "error", text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", mt: 4, px: 2 }}>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5">Upload Experian XML Report</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Max file size: {formatBytes(MAX_SIZE)}
            </Typography>
          </Stack>
        </Stack>

        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          sx={{
            border: `2px dashed ${theme.palette.primary.main}`,
            borderRadius: 1.5,
            py: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 2,
            textAlign: "center",
            bgcolor: theme.palette.mode === "light" ? "grey.50" : "background.default",
          }}
        >
          <input
            ref={inputRef}
            id="upload-input"
            type="file"
            accept=".xml,application/xml,text/xml"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <CloudUploadIcon sx={{ fontSize: 44, color: "primary.main" }} />
          <Typography variant="h6">{file ? "Ready to upload" : "Drag & drop XML here or choose a file"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {file ? `${file.name} • ${formatBytes(file.size)}` : "Only .xml files are supported"}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <label htmlFor="upload-input">
              <Button variant="contained" component="span" startIcon={<InsertDriveFileIcon />}>
                Choose File
              </Button>
            </label>

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={resetInput}
              disabled={!file || loading}
            >
              Clear
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleUpload}
              disabled={!file || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />}
            >
              {loading ? "Uploading..." : "Upload & Process"}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          {progress > 0 && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 1 }} />
              <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                {progress}% uploaded
              </Typography>
            </Box>
          )}

          {message && (
            <Alert severity={message.toLowerCase().includes("success") ? "success" : "info"} sx={{ mt: 1 }}>
              {message}
            </Alert>
          )}

          {!file && (
            <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center" }}>
              <InsertDriveFileIcon fontSize="small" color="disabled" />
              <Typography variant="body2" color="text.secondary">
                No file chosen
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}
