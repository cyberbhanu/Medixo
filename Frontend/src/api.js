import axios from "axios";

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://127.0.0.1:5000/api";
  }

  return "/api";
};

export const API = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired/invalid tokens automatically
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const signup = async (userData) => {
  const response = await API.post("/auth/signup", userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await API.post("/auth/login", userData);
  return response.data;
};

export const adminCreateUser = async (userData) => {
  const response = await API.post("/auth/admin/create-user", userData);
  return response.data;
};

export const getDoctors = async (params = {}) => {
  const response = await API.get("/doctors", { params });
  return response.data;
};

export const getDoctorById = async (doctorId) => {
  const response = await API.get(`/doctors/${doctorId}`);
  return response.data;
};

export const getSpecialties = async () => {
  const response = await API.get("/doctors/specialties");
  return response.data;
};

export const getCities = async () => {
  const response = await API.get("/doctors/locations");
  return response.data;
};

export const getLabs = async (params = {}) => {
  const response = await API.get("/labs", { params });
  return response.data;
};

export const getLabById = async (labId) => {
  const response = await API.get(`/labs/${labId}`);
  return response.data;
};

export const getLabTests = async () => {
  const response = await API.get("/labs/tests");
  return response.data;
};

export const getHospitals = async (params = {}) => {
  const response = await API.get("/hospitals", { params });
  return response.data;
};

export const getHospitalById = async (hospitalId) => {
  const response = await API.get(`/hospitals/${hospitalId}`);
  return response.data;
};

export const getClinics = async (params = {}) => {
  const response = await API.get("/clinics", { params });
  return response.data;
};

export const getClinicById = async (clinicId) => {
  const response = await API.get(`/clinics/${clinicId}`);
  return response.data;
};

export const getDepartments = async (params = {}) => {
  const response = await API.get("/departments", { params });
  return response.data;
};

export const getHomepageData = async () => {
  const response = await API.get("/home");
  return response.data;
};

export const createDoctor = async (doctorData) => {
  const response = await API.post("/doctors", doctorData);
  return response.data;
};

export const updateDoctor = async (doctorId, doctorData) => {
  const response = await API.put(`/doctors/${doctorId}`, doctorData);
  return response.data;
};

export const deleteDoctor = async (doctorId) => {
  const response = await API.delete(`/doctors/${doctorId}`);
  return response.data;
};

export const updateDoctorHospitalDetails = async (doctorId, hospitalDetails, token) => {
  const response = await API.put(
    `/doctors/${doctorId}/hospital-details`,
    { hospitalClinicDetails: hospitalDetails },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const updateDoctorAvailability = async (doctorId, availability) => {
  const response = await API.put(`/doctors/${doctorId}/availability`, { availability });
  return response.data;
};

export const uploadClinicImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await API.post("/doctors/upload-image", formData);
  return response.data;
};

export const uploadDoctorImage = uploadClinicImage;

export const getAppointments = async (params = {}) => {
  const response = await API.get("/appointments", { params });
  return response.data;
};

export const createAppointment = async (appointmentData) => {
  const response = await API.post("/appointments", appointmentData);
  return response.data;
};

export const updateAppointment = async (appointmentId, appointmentData) => {
  const response = await API.put(`/appointments/${appointmentId}`, appointmentData);
  return response.data;
};
