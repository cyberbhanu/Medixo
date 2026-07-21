const TOKEN_KEY = "token";
const USER_KEY = "user";

export const getStoredUser = () => {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const setStoredAuth = (token, user) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const normalizeRole = (role) => {
  const normalized = String(role || "").trim().toLowerCase();

  if (normalized === "admin" || normalized === "superadmin" || normalized === "super_admin") {
    return "super_admin";
  }

  if (normalized === "lab" || normalized === "laboratory") {
    return "laboratory";
  }

  return normalized;
};

export const getDashboardPath = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "super_admin") {
    return "/admin-dashboard";
  }

  if (normalizedRole === "doctor") {
    return "/doctor-dashboard";
  }

  if (normalizedRole === "laboratory") {
    return "/laboratory-dashboard";
  }

  return "/patient-dashboard";
};
