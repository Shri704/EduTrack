import * as reportService from "./report.service.js";
import * as teacherService from "../teachers/teacher.service.js";
import { successResponse } from "../../utils/responseFormatter.js";

export const attendanceReport = async (req, res, next) => {
  try {
    const report = await reportService.getAttendanceReport(req.query);
    return successResponse(res, "Attendance report generated", report);
  } catch (error) {
    next(error);
  }
};

export const attendanceReportTeacher = async (req, res, next) => {
  try {
    const teacher = await teacherService.getTeacherByUserId(req.user._id);
    const report = await reportService.getAttendanceReportForTeacher(req.query, teacher._id);
    return successResponse(res, "Subject report generated", report);
  } catch (error) {
    next(error);
  }
};

export const studentReport = async (req, res, next) => {
  try {
    const report = await reportService.getStudentReport(
      req.params.studentId
    );

    return successResponse(res, "Student report generated", report);
  } catch (error) {
    next(error);
  }
};

export const myStudentReport = async (req, res, next) => {
  try {
    const report = await reportService.getMyStudentReport(req.user._id);
    return successResponse(res, "Student report generated", report);
  } catch (error) {
    next(error);
  }
};

export const classReport = async (req, res, next) => {
  try {
    const report = await reportService.getClassReport(
      req.params.courseId
    );

    return successResponse(res, "Class report generated", report);
  } catch (error) {
    next(error);
  }
};