import * as studentService from "./student.service.js";
import {
  parseCSV,
  validateStudentCSV
} from "../../utils/csvParser.js";
import {
  successResponse,
  errorResponse
} from "../../utils/responseFormatter.js";
import { comparePassword } from "../../utils/passwordHasher.js";
import fs from "fs";

const normalizeStudentPayload = (body = {}) => {
  const { courseId, ...rest } = body;
  return {
    ...rest,
    ...(courseId ? { course: courseId, branch: courseId } : {})
  };
};

export const createStudent = async (req, res, next) => {
  try {
    const student = await studentService.createStudent({
      ...normalizeStudentPayload(req.body)
    });
    return successResponse(res, 'Student created successfully', student, 201);
  } catch (err) { next(err); }
};

export const getAllStudents = async (req, res, next) => {
  try {
    const students = await studentService.getAllStudents(req.query, {
      role: req.user.role,
      userId: req.user._id
    });
    return successResponse(res, 'Students fetched', students);
  } catch (err) { next(err); }
};

export const getStudentById = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    return successResponse(res, 'Student fetched', student);
  } catch (err) { next(err); }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const student = await studentService.getStudentByUserId(req.user._id);
    return successResponse(res, 'Student profile fetched', student);
  } catch (err) { next(err); }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const student = await studentService.getStudentByUserId(req.user._id);
    const { rollNumber, name } = req.body || {};

    if ("semester" in (req.body || {}) || "branch" in (req.body || {}) || "email" in (req.body || {}) || "password" in (req.body || {})) {
      throw new Error("You can only update roll number and name.");
    }

    const payload = {
      ...(rollNumber !== undefined ? { rollNumber: String(rollNumber).trim() } : {}),
      ...(name !== undefined ? { name: String(name).trim() } : {})
    };

    if (!payload.rollNumber && !payload.name) {
      throw new Error("No valid profile fields provided.");
    }

    const updated = await studentService.updateStudent(student._id, payload);
    return successResponse(res, "Student profile updated", updated);
  } catch (err) {
    next(err);
  }
};

export const updateMyPassword = async (req, res, next) => {
  try {
    const student = await studentService.getStudentByUserId(req.user._id);
    const { currentPassword, newPassword, confirmNewPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      throw new Error("currentPassword, newPassword and confirmNewPassword are required.");
    }
    if (String(newPassword) !== String(confirmNewPassword)) {
      throw new Error("New password and confirm password do not match.");
    }
    if (String(newPassword).length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }

    const ok = await comparePassword(currentPassword, student.password);
    if (!ok) {
      throw new Error("Current password is incorrect.");
    }

    // Setting plain password then saving will trigger studentSchema.pre('save') hashing.
    student.password = String(newPassword);
    await student.save();

    return successResponse(res, "Password updated", { updated: true });
  } catch (err) {
    next(err);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const student = await studentService.updateStudent(
      req.params.id,
      normalizeStudentPayload(req.body)
    );
    return successResponse(res, 'Student updated', student);
  } catch (err) { next(err); }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const result = await studentService.deleteStudent(req.params.id);
    return successResponse(res, result.message, result.details ?? null);
  } catch (err) { next(err); }
};

export const bulkImportStudents = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No CSV file uploaded', 400);
    const data = await parseCSV(req.file.path);
    const { valid, errors } = validateStudentCSV(data);
    if (!valid) return errorResponse(res, 'CSV validation failed', 400, errors);
    const results = await studentService.bulkCreateStudents(data);
    if (req.file.path) fs.unlinkSync(req.file.path);
    return successResponse(res, `Imported ${results.created.length} students. ${results.errors.length} failed.`, results);
  } catch (err) { next(err); }
};

export const promoteStudents = async (req, res, next) => {
  try {
    const { courseId, course, semester, excludeRollNumbers } = req.body || {};
    const courseField = courseId || course;
    const result = await studentService.promoteStudents({
      course: courseField,
      semester,
      excludeRollNumbers
    });
    return successResponse(res, result.message, result);
  } catch (err) {
    next(err);
  }
};

