import React from "react";
import { Grid, Card, CardContent, Typography } from "@mui/material";

function ReportSummary({ summary }) {
  if (!summary) return null;

  const fields = [
    { label: "Total Accounts", value: summary.totalAccounts },
    { label: "Active Accounts", value: summary.activeAccounts },
    { label: "Closed Accounts", value: summary.closedAccounts },
    { label: "Current Balance", value: summary.currentBalance },
    { label: "Secured Amount", value: summary.securedAmount },
    { label: "Unsecured Amount", value: summary.unsecuredAmount },
    { label: "Credit Enquiries (7 days)", value: summary.enquiriesLast7Days },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Report Summary
        </Typography>
        <Grid container spacing={2}>
          {fields.map((f, i) => (
            <Grid item xs={6} sm={4} key={i}>
              <Typography variant="body2" color="text.secondary">
                {f.label}
              </Typography>
              <Typography variant="subtitle1">
                {f.value ?? "-"}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default ReportSummary;
