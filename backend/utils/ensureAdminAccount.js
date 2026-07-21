const User = require("../models/User");
const { ROLES, normalizeRole } = require("./roles");

const DEFAULT_ADMIN_NAME = "Medixo Admin";
const DEFAULT_ADMIN_EMAIL = "admin@medixo.com";
const DEFAULT_ADMIN_PASSWORD = "admin12345";

async function ensureAdminAccount() {
  const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const adminName = (process.env.ADMIN_NAME || DEFAULT_ADMIN_NAME).trim();
  const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

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
  console.log(`Default admin account created: ${adminEmail}`);
}

module.exports = ensureAdminAccount;
