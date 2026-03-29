import jwt from "jsonwebtoken";
import env from "./env.js";

export const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};