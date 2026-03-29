export const calculateAverageMarks = (marks) => {
  if (!marks.length) return 0;

  const total = marks.reduce((sum, m) => sum + m.score, 0);

  return total / marks.length;
};

export const getTopStudents = (students) => {
  return students.sort((a, b) => b.average - a.average).slice(0, 5);
};