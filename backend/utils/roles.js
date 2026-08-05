const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  DOCTOR: "doctor",
  PATIENT: "patient",
  LABORATORY: "laboratory",
  STAFF: "staff",
});

const ROLE_ALIASES = Object.freeze({
  admin: ROLES.SUPER_ADMIN,
  superadmin: ROLES.SUPER_ADMIN,
  super_admin: ROLES.SUPER_ADMIN,
  lab: ROLES.LABORATORY,
  laboratory: ROLES.LABORATORY,
  doctor: ROLES.DOCTOR,
  patient: ROLES.PATIENT,
  staff: ROLES.STAFF,
  receptionist: ROLES.STAFF,
});

const normalizeRole = (role) => ROLE_ALIASES[String(role || "").trim().toLowerCase()] || "";

const hasRole = (user, roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.map(normalizeRole).includes(normalizeRole(user?.role));
};

module.exports = {
  ROLES,
  ROLE_ALIASES,
  normalizeRole,
  hasRole,
};
