import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchReports, deleteReport } from "../api";

export default function ReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetchReports({ signal: controller.signal });
        if (!res || !res.data) setReports([]);
        else setReports(res.data);
      } catch (err) {
        if (err.name !== "AbortError")
          setError(err?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this report?");
    if (!confirmDelete) return;

    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
      alert("Report deleted successfully!");
    } catch (error) {
      alert("Failed to delete report.");
      console.error(error);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Uploaded Reports
        </Typography>
        <Typography color="error">{error}</Typography>
      </Paper>
    );

  if (!reports.length)
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Uploaded Reports
        </Typography>
        <Typography>No reports uploaded yet.</Typography>
      </Paper>
    );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Uploaded Reports
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>PAN</TableCell>
              <TableCell>Credit Score</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.basicDetails?.name ?? "-"}</TableCell>
                <TableCell>{r.basicDetails?.pan ?? "-"}</TableCell>
                <TableCell>{r.basicDetails?.creditScore ?? "-"}</TableCell>
                <TableCell>
                  {r.uploadedAt ? new Date(r.uploadedAt).toLocaleString() : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => navigate(`/reports/${r._id}`)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDelete(r._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
