import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchReportById } from "../api";
import { Typography, Paper, Divider, CircularProgress, Box, Alert } from "@mui/material";
import BasicDetails from "../components/BasicDetails";
import ReportSummary from "../components/ReportSummary";
import CreditAccounts from "../components/CreditAccounts";

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetchReportById(id);
        if (!mounted) return;
        if (!res || !res.data) {
          setError("Report not found");
          setReport(null);
        } else {
          setReport(res.data);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load report");
        setReport(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Report Details
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Alert severity="error">{error}</Alert>
      </Paper>
    );

  if (!report)
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Report Details
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography>No report data available.</Typography>
      </Paper>
    );

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Report Details
      </Typography>
      <Divider sx={{ my: 2 }} />
      <BasicDetails data={report.basicDetails} />
      <Divider sx={{ my: 2 }} />
      <ReportSummary summary={report.summary} />
      <Divider sx={{ my: 2 }} />
      <CreditAccounts accounts={report.accounts} />
    </Paper>
  );
}
