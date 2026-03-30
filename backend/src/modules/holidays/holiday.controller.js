import { successResponse } from "../../utils/responseFormatter.js";
import * as holidayService from "./holiday.service.js";

export const createHoliday = async (req, res, next) => {
  try {
    const { courseId, semester, date, note, subjectId } = req.body || {};
    const data = await holidayService.createHolidayForCourse({
      courseId,
      semester,
      date,
      subjectId,
      userId: req.user._id,
      userRole: req.user.role,
      note
    });
    return successResponse(res, data.message || "Holiday saved", data);
  } catch (err) {
    next(err);
  }
};

export const listHolidays = async (req, res, next) => {
  try {
    const { courseId, semester, subjectId } = req.query;
    const data = await holidayService.listHolidays({
      courseId,
      semester,
      subjectId,
      userId: req.user._id,
      userRole: req.user.role
    });
    return successResponse(res, "Holidays fetched", data);
  } catch (err) {
    next(err);
  }
};

export const removeHoliday = async (req, res, next) => {
  try {
    const { courseId, semester, date, subjectId } = req.body || {};
    const data = await holidayService.removeHolidayForCourse({
      courseId,
      semester,
      date,
      subjectId,
      userId: req.user._id,
      userRole: req.user.role
    });
    return successResponse(res, data.message || "Holiday removed", data);
  } catch (err) {
    next(err);
  }
};
