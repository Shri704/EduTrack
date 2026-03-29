import * as courseService from "./course.service.js";
import { validateCourse } from "./course.validator.js";
import { successResponse } from "../../utils/responseFormatter.js";

export const createCourse = async (req, res, next) => {
  try {
    validateCourse(req.body);
    const payload = {
      name: req.body.name?.trim(),
      code: req.body.code?.trim().toUpperCase(),
      description: req.body.description?.trim() || undefined,
      duration: Number(req.body.duration) || 4,
      totalSemesters: Number(req.body.totalSemesters) || 8
    };
    return successResponse(
      res,
      "Branch created",
      await courseService.createCourse(payload),
      201
    );
  } catch (err) {
    next(err);
  }
};

export const getAllCourses = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Courses fetched",
      await courseService.getAllCourses()
    );
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Course fetched",
      await courseService.getCourseById(req.params.id)
    );
  } catch (err) {
    next(err);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Course updated",
      await courseService.updateCourse(req.params.id, req.body)
    );
  } catch (err) {
    next(err);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const r = await courseService.deleteCourse(req.params.id);
    return successResponse(res, r.message);
  } catch (err) {
    next(err);
  }
};