import * as subjectService from "./subject.service.js";
import { successResponse } from "../../utils/responseFormatter.js";

const normalizeSubjectPayload = (body = {}) => {
  const { courseId, ...rest } = body;
  return {
    ...rest,
    ...(courseId ? { course: courseId } : {})
  };
};

export const createSubject = async (req, res, next) => {
  try {
    const s = await subjectService.createSubject(normalizeSubjectPayload(req.body));
    return successResponse(res, "Subject created", s, 201);
  } catch (err) {
    next(err);
  }
};

export const getAllSubjects = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Subjects fetched",
      await subjectService.getAllSubjects(req.query)
    );
  } catch (err) {
    next(err);
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Subject fetched",
      await subjectService.getSubjectById(req.params.id)
    );
  } catch (err) {
    next(err);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Subject updated",
      await subjectService.updateSubject(req.params.id, normalizeSubjectPayload(req.body))
    );
  } catch (err) {
    next(err);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const r = await subjectService.deleteSubject(req.params.id);
    return successResponse(res, r.message);
  } catch (err) {
    next(err);
  }
};