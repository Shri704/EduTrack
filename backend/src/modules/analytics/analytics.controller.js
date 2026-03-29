import mongoose from "mongoose";
import * as analyticsService from "./analytics.service.js";
import { successResponse } from "../../utils/responseFormatter.js";
import * as teacherService from "../teachers/teacher.service.js";
import Student from "../students/student.model.js";

export const studentAnalytics = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }
    const data = await analyticsService.getStudentOverview(studentId);
    return successResponse(res, "Student analytics fetched", data);
  } catch (error) {
    next(error);
  }
};

export const studentDashboardOverview = async (req, res, next) => {
  try {
    const email = String(req.user.email || "").toLowerCase();
    const student = await Student.findOne({ email });
    if (!student) {
      return successResponse(res, "Student profile not found", {
        attendancePercent: 0,
        avgScore: 0,
        sessionsTotal: 0,
        sessionsPresent: 0,
        examCount: 0
      });
    }
    const data = await analyticsService.getStudentOverview(student._id);
    return successResponse(res, "Student overview fetched", data);
  } catch (err) {
    next(err);
  }
};

export const classAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getClassAnalytics(
      req.params.courseId
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getAdminOverview();
    return successResponse(res, "Admin overview fetched", data);
  } catch (err) {
    next(err);
  }
};

export const attendanceDaily = async (req, res, next) => {
  try {
    let studentId;
    if (req.user.role === "student") {
      const student = await Student.findOne({
        email: String(req.user.email || "").toLowerCase()
      });
      if (!student) {
        return successResponse(
          res,
          "Daily attendance fetched",
          analyticsService.getEmptyAttendanceDailySeries()
        );
      }
      studentId = student._id;
    }
    const data = await analyticsService.getAttendanceDaily({ studentId });
    return successResponse(res, "Daily attendance fetched", data);
  } catch (err) {
    next(err);
  }
};

export const performanceOverview = async (req, res, next) => {
  try {
    let studentId;
    if (req.user.role === "student") {
      const student = await Student.findOne({
        email: String(req.user.email || "").toLowerCase()
      });
      if (!student) {
        return successResponse(res, "Performance overview fetched", []);
      }
      studentId = student._id;
    }
    const data = await analyticsService.getPerformanceOverview({ studentId });
    return successResponse(res, "Performance overview fetched", data);
  } catch (err) {
    next(err);
  }
};

export const subjectBreakdown = async (req, res, next) => {
  try {
    let studentId;
    if (req.user.role === "student") {
      const student = await Student.findOne({
        email: String(req.user.email || "").toLowerCase()
      });
      if (!student) {
        return successResponse(res, "Subject breakdown fetched", []);
      }
      studentId = student._id;
    }
    const data = await analyticsService.getSubjectWiseBreakdown({
      studentId
    });
    return successResponse(res, "Subject breakdown fetched", data);
  } catch (err) {
    next(err);
  }
};

export const teacherOverview = async (req, res, next) => {
  try {
    const teacher = await teacherService.getTeacherByUserId(req.user._id);
    const data = await analyticsService.getTeacherOverview(teacher._id);
    return successResponse(res, "Teacher overview fetched", data);
  } catch (err) {
    next(err);
  }
};
