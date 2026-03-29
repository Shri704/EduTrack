import { generateToken as jwtGenerate } from "../config/jwt.js";

export const generateUserToken = (user) => {
  return jwtGenerate({
    id: user._id,
    email: user.email,
    role: user.role
  });
};

export default generateUserToken;