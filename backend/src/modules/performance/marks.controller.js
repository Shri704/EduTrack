import * as marksService from "./marks.service.js";
import { successResponse } from "../../utils/responseFormatter.js";
import Student from "../students/student.model.js";
import Teacher from "../teachers/teacher.model.js";

export const uploadMarks = async (req, res, next) => {
  try {
    const { subjectId, examType, totalMarks, rows, examDate } = req.body;
    if (!subjectId) throw new Error("subjectId is required");
    if (!totalMarks && totalMarks !== 0) throw new Error("totalMarks is required");
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("rows must be a non-empty array");

    const usesIAFields = rows.some(
      (r) =>
        r &&
        (r.ia1 !== undefined ||
          r.ia2 !== undefined ||
          r.additionalIA !== undefined)
    );
    if (!usesIAFields && !examType) throw new Error("examType is required");

    const teacher = await Teacher.findOne({ user: req.user._id });
    const teacherId = teacher?._id;

    const parseMaybeNumber = (v) => {
      if (v === "" || v === undefined || v === null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const normalizedRows = rows.map((r) => ({
      studentId: r.studentId || r.student,
      marksObtained: parseMaybeNumber(r.marksObtained ?? r.score),
      ia1: parseMaybeNumber(r.ia1),
      ia2: parseMaybeNumber(r.ia2),
      additionalIA: parseMaybeNumber(r.additionalIA)
    }));

    for (const r of normalizedRows) {
      if (Number.isFinite(r.additionalIA)) {
        if (Number.isFinite(r.ia1) && Number.isFinite(r.ia2)) {
          throw new Error(
            "Additional IA is only allowed when 1st IA or 2nd IA is not entered for that row."
          );
        }
      }
    }

    const created = await marksService.createMarksBulk({
      subjectId,
      teacherId,
      examType,
      totalMarks: Number(totalMarks),
      rows: normalizedRows,
      examDate
    });

    return successResponse(res, "Marks uploaded", created, 201);
  } catch (err) {
    next(err);
  }
};

export const getStudentMarks = async (req, res, next) => {
  try {
    const marks = await marksService.getStudentMarks(req.params.studentId, req.query);
    return successResponse(res, "Marks fetched", marks);
  } catch (err) {
    next(err);
  }
};

export const getMyMarks = async (req, res, next) => {
  try {
    const student = await Student.findOne({ email: req.user.email });
    if (!student) return successResponse(res, "No marks found", []);
    const marks = await marksService.getStudentMarks(student._id, req.query);
    return successResponse(res, "My marks fetched", marks);
  } catch (err) {
    next(err);
  }
};

export const getClassMarks = async (req, res, next) => {
  try {
    const marks = await marksService.getClassMarks(req.params.subjectId, req.query);
    return successResponse(res, "Class marks fetched", marks);
  } catch (err) {
    next(err);
  }
};