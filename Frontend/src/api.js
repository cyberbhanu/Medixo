import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth functions
export const signup = async (userData) => {
  const response = await API.post("/auth/signup", userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await API.post("/auth/login", userData);
  return response.data;
};