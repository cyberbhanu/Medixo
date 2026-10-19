const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Lab = require("../models/Lab");
const { ROLES, hasRole } = require("./roles");

const isAdmin = (user) => hasRole(user, [ROLES.SUPER_ADMIN, ROLES.DISTRICT_ADMIN]);
const isGlobalAdmin = (user) => hasRole(user, ROLES.SUPER_ADMIN);

const managedCities = (user) =>
  [...new Set((Array.isArray(user?.managedCities) ? user.managedCities : [])
    .map((city) => String(city || "").trim().toLowerCase())
    .filter(Boolean))];

const cityMatches = (user, city) =>
  isGlobalAdmin(user) || managedCities(user).includes(String(city || "").trim().toLowerCase());

const scopedRegex = (user) =>
  managedCities(user).length
    ? new RegExp(`^(?:${managedCities(user).map((city) => city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`, "i")
    : /^$a/;

const getScopedDoctors = async (user) => {
  if (isGlobalAdmin(user)) return Doctor.find({ isActive: { $ne: false } }).select("_id location").lean();
  return Doctor.find({ location: scopedRegex(user), isActive: { $ne: false } }).select("_id location").lean();
};

const getScopedHospitals = async (user) => {
  if (isGlobalAdmin(user)) return Hospital.find({ isActive: { $ne: false } }).select("_id city").lean();
  return Hospital.find({ city: scopedRegex(user), isActive: { $ne: false } }).select("_id city").lean();
};

const getScopedLabs = async (user) => {
  if (isGlobalAdmin(user)) return Lab.find({ isActive: { $ne: false } }).select("_id location").lean();
  return Lab.find({ location: scopedRegex(user), isActive: { $ne: false } }).select("_id location").lean();
};

module.exports = {
  isAdmin,
  isGlobalAdmin,
  managedCities,
  cityMatches,
  scopedRegex,
  getScopedDoctors,
  getScopedHospitals,
  getScopedLabs,
};
