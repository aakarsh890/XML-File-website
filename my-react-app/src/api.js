import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // change if backend runs elsewhere
});

// Upload XML
export const uploadXML = (formData) =>
  API.post("/reports/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Fetch all reports
export const fetchReports = () => API.get("/reports");

// Fetch report by ID
export const fetchReportById = (id) => API.get(`/reports/${id}`);

// 🆕 DELETE report by ID (add this!)
export const deleteReport = (id) => API.delete(`/reports/${id}`);
