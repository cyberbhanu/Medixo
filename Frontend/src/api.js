import axios from "axios";
import { Capacitor } from "@capacitor/core";

const PRODUCTION_API_URL =
  "https://medixo-yj2x.onrender.com/api";

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  if (
    !Capacitor.isNativePlatform() &&
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://127.0.0.1:5000/api";
  }

  return PRODUCTION_API_URL;
};

export const API = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// =====================================================
// TOKEN INTERCEPTOR
// =====================================================

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";

    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/signup");
    const isGuestBookingRequest = requestUrl.includes("/appointments/guest");

    if (
      error.response &&
      error.response.status === 401 &&
      !isAuthRequest &&
      !isGuestBookingRequest
    ) {
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// =====================================================
// AUTH
// =====================================================

export const signup = async (userData) => {
  const response = await API.post(
    "/auth/signup",
    userData
  );

  return response.data;
};

export const login = async (userData) => {
  const response = await API.post(
    "/auth/login",
    userData
  );

  return response.data;
};

export const adminCreateUser = async (userData) => {
  const response = await API.post(
    "/auth/admin/create-user",
    userData
  );

  return response.data;
};

export const requestAccountDeletion = async (email, reason) => {
  const response = await API.post("/auth/account-deletion-request", { email, reason });
  return response.data;
};

export const deleteAccount = async (password) => {
  const response = await API.delete("/auth/account", { data: { password } });
  return response.data;
};

// =====================================================
// DOCTORS
// =====================================================

export const getDoctors = async (params = {}) => {
  const response = await API.get("/doctors", {
    params,
  });

  return response.data;
};

export const getDoctorById = async (doctorId) => {
  const response = await API.get(
    `/doctors/${doctorId}`
  );

  return response.data;
};

export const getSpecialties = async () => {
  const response = await API.get(
    "/doctors/specialties"
  );

  return response.data;
};

export const getCities = async () => {
  const response = await API.get(
    "/doctors/locations"
  );

  return response.data;
};

export const createDoctor = async (doctorData) => {
  const response = await API.post(
    "/doctors",
    doctorData
  );

  return response.data;
};

export const updateDoctor = async (
  doctorId,
  doctorData
) => {
  const response = await API.put(
    `/doctors/${doctorId}`,
    doctorData
  );

  return response.data;
};

export const deleteDoctor = async (doctorId) => {
  const response = await API.delete(
    `/doctors/${doctorId}`
  );

  return response.data;
};

export const updateDoctorHospitalDetails = async (
  doctorId,
  hospitalDetails,
  token
) => {
  const response = await API.put(
    `/doctors/${doctorId}/hospital-details`,
    {
      hospitalClinicDetails:
        hospitalDetails,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateDoctorAvailability = async (
  doctorId,
  availability
) => {
  const response = await API.put(
    `/doctors/${doctorId}/availability`,
    {
      availability,
    }
  );

  return response.data;
};

export const uploadClinicImage = async (file) => {
  const formData = new FormData();

  formData.append("image", file);

  const response = await API.post(
    "/doctors/upload-image",
    formData
  );

  return response.data;
};

export const uploadDoctorImage =
  uploadClinicImage;

// =====================================================
// LABS
// =====================================================

export const getLabs = async (params = {}) => {
  const response = await API.get("/labs", {
    params,
  });

  return response.data;
};

export const getLabById = async (labId) => {
  const response = await API.get(
    `/labs/${labId}`
  );

  return response.data;
};

export const getLabTests = async () => {
  const response = await API.get(
    "/labs/tests"
  );

  return response.data;
};

// =====================================================
// HOSPITALS
// =====================================================

export const getHospitals = async (params = {}) => {
  const response = await API.get("/hospitals", {
    params,
  });

  return response.data;
};

export const getHospitalById = async (
  hospitalId
) => {
  const response = await API.get(
    `/hospitals/${hospitalId}`
  );

  return response.data;
};

// =====================================================
// CLINICS
// =====================================================

export const getClinics = async (params = {}) => {
  const response = await API.get("/clinics", {
    params,
  });

  return response.data;
};

export const getClinicById = async (
  clinicId
) => {
  const response = await API.get(
    `/clinics/${clinicId}`
  );

  return response.data;
};

// =====================================================
// ADMIN CLINIC MANAGEMENT
// =====================================================

export const createClinic = async (
  clinicData
) => {
  const response = await API.post(
    "/clinics",
    clinicData
  );

  return response.data;
};

export const updateClinic = async (
  clinicId,
  clinicData
) => {
  const response = await API.put(
    `/clinics/${clinicId}`,
    clinicData
  );

  return response.data;
};

export const deleteClinic = async (
  clinicId
) => {
  const response = await API.delete(
    `/clinics/${clinicId}`
  );

  return response.data;
};

// =====================================================
// DEPARTMENTS
// =====================================================

export const getDepartments = async (
  params = {}
) => {
  const response = await API.get(
    "/departments",
    {
      params,
    }
  );

  return response.data;
};

// =====================================================
// HOMEPAGE
// =====================================================

export const getHomepageData = async () => {
  const response = await API.get("/home");

  return response.data;
};

// =====================================================
// APPOINTMENTS
// =====================================================

export const getAppointments = async (
  params = {}
) => {
  const response = await API.get(
    "/appointments",
    {
      params,
    }
  );

  return response.data;
};

export const createAppointment = async (
  appointmentData
) => {
  const response = await API.post(
    "/appointments",
    appointmentData
  );

  return response.data;
};

export const createGuestAppointment = async (appointmentData) => {
  const response = await API.post("/appointments/guest", appointmentData);
  return response.data;
};

export const accessGuestBooking = async (bookingReference, bookingPassword) => {
  const response = await API.post("/appointments/guest/access", {
    bookingReference,
    bookingPassword,
  });
  return response.data;
};

export const getGuestBooking = async (appointmentId, guestToken) => {
  const response = await API.get(`/appointments/guest/${appointmentId}`, {
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  return response.data;
};

export const updateGuestBooking = async (appointmentId, guestToken, appointmentData) => {
  const response = await API.put(`/appointments/guest/${appointmentId}`, appointmentData, {
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  return response.data;
};

export const updateAppointment = async (
  appointmentId,
  appointmentData
) => {
  const response = await API.put(
    `/appointments/${appointmentId}`,
    appointmentData
  );

  return response.data;
};

// =====================================================
// NOTIFICATIONS
// =====================================================

export const getNotifications = async () => {
  const response = await API.get("/notifications");
  return response.data;
};

export const getNotificationPublicKey = async () => {
  const response = await API.get("/notifications/vapid-public-key");
  return response.data;
};

export const subscribeToNotifications = async (subscription) => {
  const response = await API.post("/notifications/subscribe", { subscription });
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await API.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await API.patch("/notifications/read-all");
  return response.data;
};

export const getPatientReport = async (params = {}) => {
  const response = await API.get("/appointments/reports/patients", { params });
  return response.data;
};

// =====================================================
// ADMIN STAFF MANAGEMENT
// =====================================================

export const getAdminStaff = async () => {
  const response = await API.get(
    "/admin/staff"
  );

  return response.data;
};

export const createAdminStaff = async (
  staffData
) => {
  const response = await API.post(
    "/admin/staff",
    staffData
  );

  return response.data;
};

export const updateAdminStaff = async (
  staffId,
  staffData
) => {
  const response = await API.put(
    `/admin/staff/${staffId}`,
    staffData
  );

  return response.data;
};

export const updateAdminCustomerPassword = async (email, password) => {
  const response = await API.put(
    "/admin/customer-password",
    { email, password }
  );

  return response.data;
};

export const toggleAdminStaffStatus = async (
  staffId,
  isActive
) => {
  const response = await API.patch(
    `/admin/staff/${staffId}/status`,
    {
      isActive,
    }
  );

  return response.data;
};

export const deleteAdminStaff = async (
  staffId
) => {
  const response = await API.delete(
    `/admin/staff/${staffId}`
  );

  return response.data;
};
