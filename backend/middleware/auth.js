const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret } = require("../utils/jwt");
const { normalizeRole, hasRole } = require("../utils/roles");

async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    const normalizedRole = normalizeRole(user.role);
    if (normalizedRole && user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: normalizedRole || user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!hasRole(req.user, roles)) {
    return res.status(403).json({ error: "You are not allowed to perform this action" });
  }

  return next();
};

module.exports = {
  authenticateUser,
  authorizeRoles,
};
