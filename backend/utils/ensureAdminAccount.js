const User = require("../models/User");
const { ROLES, normalizeRole } = require("./roles");

const DEFAULT_ADMIN_NAME = "Medixo Admin";
const DEFAULT_ADMIN_EMAIL = "admin@medixo.com";
const DEFAULT_ADMIN_PASSWORD = "admin12345";

const isProduction = () => process.env.NODE_ENV === "production";

const getAdminConfig = () => {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim();
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (isProduction()) {
    if (!configuredEmail || !configuredPassword) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in production");
    }

    if (configuredPassword === DEFAULT_ADMIN_PASSWORD || configuredPassword.length < 12) {
      throw new Error("ADMIN_PASSWORD must be unique and at least 12 characters in production");
    }
  }

  return {
    email: (configuredEmail || DEFAULT_ADMIN_EMAIL).toLowerCase(),
    name: (process.env.ADMIN_NAME || DEFAULT_ADMIN_NAME).trim(),
    password: configuredPassword || DEFAULT_ADMIN_PASSWORD,
  };
};

async function ensureAdminAccount() {
  const {
    email: adminEmail,
    name: adminName,
    password: adminPassword,
  } = getAdminConfig();

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    if (normalizeRole(existingAdmin.role) !== ROLES.SUPER_ADMIN) {
      existingAdmin.role = ROLES.SUPER_ADMIN;
      await existingAdmin.save();
      console.log(`Updated existing user to super admin: ${adminEmail}`);
    } else if (existingAdmin.role !== ROLES.SUPER_ADMIN) {
      existingAdmin.role = ROLES.SUPER_ADMIN;
      await existingAdmin.save();
    }

    return;
  }

  const adminUser = new User({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: ROLES.SUPER_ADMIN,
  });

  await adminUser.save();
  console.log(`Admin account created: ${adminEmail}`);
}

module.exports = ensureAdminAccount;
