import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

export const createEstimate = async (data) => {
  const response = await api.post("/api/estimate", data);
  return response.data;
};

export const getHistory = async () => {
  const response = await api.get("/api/history");
  return response.data;
};
