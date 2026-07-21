const DEFAULT_DEV_JWT_SECRET = "replace-this-in-production";

let warnedAboutDevSecret = false;

const isProduction = () => process.env.NODE_ENV === "production";

const getJwtSecret = () => {
  const configuredSecret = process.env.JWT_SECRET?.trim();

  if (configuredSecret && configuredSecret !== DEFAULT_DEV_JWT_SECRET) {
    if (isProduction() && configuredSecret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production");
    }

    return configuredSecret;
  }

  if (isProduction()) {
    throw new Error("JWT_SECRET is required in production");
  }

  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn("Using development JWT secret. Set JWT_SECRET before deploying.");
  }

  return DEFAULT_DEV_JWT_SECRET;
};

module.exports = {
  getJwtSecret,
};
