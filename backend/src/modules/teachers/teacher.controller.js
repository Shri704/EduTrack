import * as teacherService from "./teacher.service.js";
import { successResponse } from "../../utils/responseFormatter.js";

export const createTeacher = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Teacher created",
      await teacherService.createTeacher(req.body),
      201
    );
  } catch (err) {
    next(err);
  }
};

export const getAllTeachers = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Teachers fetched",
      await teacherService.getAllTeachers()
    );
  } catch (err) {
    next(err);
  }
};

export const getTeacherById = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Teacher fetched",
      await teacherService.getTeacherById(req.params.id)
    );
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Teacher profile fetched",
      await teacherService.getTeacherByUserId(req.user._id)
    );
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Profile updated",
      await teacherService.updateMyTeacherProfile(req.user._id, req.body)
    );
  } catch (err) {
    next(err);
  }
};

export const updateTeacher = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Teacher updated",
      await teacherService.updateTeacher(req.params.id, req.body)
    );
  } catch (err) {
    next(err);
  }
};

export const assignSubject = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Subject assigned",
      await teacherService.assignSubject(req.params.id, req.body.subjectId)
    );
  } catch (err) {
    next(err);
  }
};

export const deleteTeacher = async (req, res, next) => {
  try {
    const r = await teacherService.deleteTeacher(req.params.id);
    return successResponse(res, r.message);
  } catch (err) {
    next(err);
  }
};