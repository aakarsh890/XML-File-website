import React from "react";
import { Grid, Typography, Card, CardContent, Divider } from "@mui/material";

function BasicDetails({ data }) {
  if (!data) return null;

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Basic Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">Name: {data.name || "N/A"}</Typography>
            <Typography variant="body1">Mobile: {data.mobile || "N/A"}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">PAN: {data.pan || "N/A"}</Typography>
            <Typography variant="body1">Credit Score: {data.creditScore ?? "N/A"}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default BasicDetails;
