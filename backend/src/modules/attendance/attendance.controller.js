import * as attendanceService from "./attendance.service.js";
import { successResponse } from "../../utils/responseFormatter.js";
import Student from "../students/student.model.js";

export const markAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.markAttendance(req.body.records);
    return successResponse(res, 'Attendance marked successfully', result);
  } catch (err) { next(err); }
};

export const getStudentAttendance = async (req, res, next) => {
  try {
    const data = await attendanceService.getStudentAttendance(req.params.studentId, req.query);
    return successResponse(res, 'Attendance fetched', data);
  } catch (err) { next(err); }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const student = await Student.findOne({ email: req.user.email });
    if (!student)
      return successResponse(res, "No attendance found", {
        records: [],
        summary: { total: 0, present: 0, absent: 0, percentage: 0 },
        semesterSummary: { total: 0, present: 0, absent: 0, percentage: 0 }
      });
    const data = await attendanceService.getStudentAttendance(student._id, req.query);
    return successResponse(res, 'My attendance fetched', data);
  } catch (err) { next(err); }
};

export const getClassAttendance = async (req, res, next) => {
  try {
    const data = await attendanceService.getClassAttendance(req.params.subjectId, req.query.date);
    return successResponse(res, 'Class attendance fetched', data);
  } catch (err) { next(err); }
};

export const getLowAttendance = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 75;
    const data = await attendanceService.getLowAttendanceStudents(threshold);
    return successResponse(res, 'Low attendance students fetched', data);
  } catch (err) { next(err); }
};
