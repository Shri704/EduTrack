import * as authService from "./auth.service.js";
import { validateRegister } from "./auth.validator.js";
import {
  successResponse,
  errorResponse
} from "../../utils/responseFormatter.js";

const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) {
    if (obj?.[k] !== undefined) out[k] = obj[k];
  }
  return out;
};

const normalizeRegisterBody = (body) =>
  pick(body, ["fullName", "name", "firstName", "lastName", "email", "password", "rollNumber", "semester", "sem", "branch"]);

const normalizeVerifyOtpBody = (body) =>
  pick(body, ["email", "otp", "rollNumber", "semester", "sem", "branch"]);

export const register = async (req, res, next) => {
  try {
    const payload = normalizeRegisterBody(req.body);
    validateRegister(payload);
    const result = await authService.register(payload);
    const msg =
      result?.emailSent === false
        ? "Account created. Email was not sent — use the verification code in the response to continue (non-production only)."
        : "Registration successful. OTP sent to email.";
    return successResponse(res, msg, result, 201);
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(normalizeVerifyOtpBody(req.body));
    return successResponse(res, "Account verified successfully", result);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, "Login successful", result);
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user._id);
    return successResponse(res, "Profile fetched", user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(
      req.user._id,
      req.body
    );
    return successResponse(res, "Profile updated", user);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(
      req.user._id,
      req.body
    );
    return successResponse(res, result.message);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return successResponse(res, result.message, { email: result.email });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return successResponse(res, result.message);
  } catch (err) {
    next(err);
  }
};