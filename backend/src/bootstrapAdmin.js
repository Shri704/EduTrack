import User from "./modules/users/user.model.js";
import logger from "./utils/logger.js";

/**
 * First-time production setup: when there is no superadmin in the DB, create one from env.
 * Set on Render: AUTO_SEED_SUPERADMIN=true, SUPERADMIN_EMAIL=..., SUPERADMIN_PASSWORD=... (min 6 chars)
 * Then remove AUTO_SEED_SUPERADMIN or set false after you confirm login works.
 */
export async function ensureSuperAdminIfConfigured() {
  try {
    const enabled =
      String(process.env.AUTO_SEED_SUPERADMIN || "").toLowerCase() === "true";
    const email = String(process.env.SUPERADMIN_EMAIL || "")
      .trim()
      .toLowerCase();
    const password = String(process.env.SUPERADMIN_PASSWORD || "");

    if (!enabled) return;

    if (!email || password.length < 6) {
      logger.warn(
        "AUTO_SEED_SUPERADMIN is true but SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD is missing or password is shorter than 6 characters. Skipping bootstrap."
      );
      return;
    }

    const superCount = await User.countDocuments({ role: "superadmin" });
    if (superCount > 0) return;

    const existing = await User.findOne({ email });
    if (existing) {
      logger.warn(
        `Bootstrap skipped: an account already exists for ${email}. Create superadmin manually or use a different email.`
      );
      return;
    }

    await User.create({
      firstName: "Super",
      lastName: "Admin",
      email,
      password,
      role: "superadmin",
      isVerified: true,
      isActive: true
    });

    logger.info(
      `First super admin created (${email}). Sign in on the app, then turn off AUTO_SEED_SUPERADMIN in production.`
    );
  } catch (e) {
    logger.error(`Bootstrap super admin failed: ${e?.message || e}`);
  }
}
