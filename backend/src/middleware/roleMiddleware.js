import { errorResponse } from "../utils/responseFormatter.js";

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Role '${req.user.role}' is not authorized to access this resource`,
        403
      );
    }
    next();
  };
};