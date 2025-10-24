import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Typography,
  TableContainer,
  Paper,
} from "@mui/material";

function CreditAccounts({ accounts }) {
  if (!accounts?.length) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Credit Accounts Information
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Bank</TableCell>
                <TableCell>Account No</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Overdue</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>{a?.type || "-"}</TableCell>
                  <TableCell>{a?.provider || "-"}</TableCell>
                  <TableCell>{a?.accountNumber || "-"}</TableCell>
                  <TableCell>{a?.currentBalance?.toLocaleString() ?? 0}</TableCell>
                  <TableCell>{a?.amountOverdue?.toLocaleString() ?? 0}</TableCell>
                  <TableCell>{a?.status || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

export default CreditAccounts;
