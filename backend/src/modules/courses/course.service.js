import Course from "./course.model.js";

export const createCourse = async (data) => {
  return Course.create(data);
};

export const getAllCourses = async () => {
  return Course.find({ isActive: true }).sort({ name: 1 });
};

export const getCourseById = async (id) => {
  const c = await Course.findById(id);
  if (!c) throw new Error("Course not found");
  return c;
};

export const updateCourse = async (id, data) => {
  const c = await Course.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
  if (!c) throw new Error("Course not found");
  return c;
};

export const deleteCourse = async (id) => {
  const c = await Course.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!c) throw new Error("Course not found");
  return { message: "Course deleted" };
};