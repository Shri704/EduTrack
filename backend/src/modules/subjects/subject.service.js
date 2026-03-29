import Subject from "./subject.model.js";
import Attendance from "../attendance/attendance.model.js";
import Marks from "../performance/marks.model.js";
import Teacher from "../teachers/teacher.model.js";

export const createSubject = async (data) => {
  const created = await Subject.create(data);
  return Subject.findById(created._id)
    .populate("course")
    .populate("teacher");
};

export const getAllSubjects = async (filters = {}) => {
  const query = { isActive: true };
  const courseId = filters.course || filters.courseId;
  if (courseId) query.course = courseId;
  if (filters.semester !== undefined && filters.semester !== "") {
    query.semester = Number(filters.semester);
  }

  return Subject.find(query)
    .populate("course")
    .populate({
      path: "teacher",
      populate: { path: "user", select: "firstName lastName" }
    })
    .sort({ name: 1 });
};

export const getSubjectById = async (id) => {
  const s = await Subject.findById(id)
    .populate("course")
    .populate({
      path: "teacher",
      populate: { path: "user", select: "firstName lastName email" }
    });
  if (!s) throw new Error("Subject not found");
  return s;
};

export const updateSubject = async (id, data) => {
  const s = await Subject.findByIdAndUpdate(id, data, { new: true })
    .populate("course")
    .populate("teacher");
  if (!s) throw new Error("Subject not found");
  return s;
};

export const deleteSubject = async (id) => {
  const subject = await Subject.findById(id);
  if (!subject) throw new Error("Subject not found");

  const [attCount, marksCount] = await Promise.all([
    Attendance.countDocuments({ subject: id }),
    Marks.countDocuments({ subject: id })
  ]);

  if (attCount > 0 || marksCount > 0) {
    throw new Error(
      `Cannot delete this subject: it has ${attCount} attendance record(s) and ${marksCount} marks record(s). Remove or reassign those first.`
    );
  }

  await Teacher.updateMany(
    { subjects: id },
    { $pull: { subjects: id } }
  );

  await Subject.findByIdAndDelete(id);
  return { message: "Subject removed from database" };
};