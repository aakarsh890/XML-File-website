import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Container } from "@mui/material";
import UploadPage from "./pages/UploadPage";
import ReportsList from "./pages/ReportsList";
import ReportDetail from "./pages/ReportDetail";

function App() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Button color="inherit" component={Link} to="/">
            Upload
          </Button>
          <Button color="inherit" component={Link} to="/reports">
            Reports
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/reports" element={<ReportsList />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
