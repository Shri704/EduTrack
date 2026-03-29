import { verifyToken } from "../config/jwt.js";
import User from "../modules/users/user.model.js";
import { errorResponse } from "../utils/responseFormatter.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, "Not authorized, no token provided", 401);
    }

    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return errorResponse(res, "User not found", 401);
    }

    if (!req.user.isActive) {
      return errorResponse(res, "Account is deactivated", 401);
    }

    next();
  } catch (error) {
    return errorResponse(res, "Not authorized, token failed", 401);
  }
};