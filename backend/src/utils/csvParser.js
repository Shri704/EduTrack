import csv from "csv-parser";
import fs from "fs";

export const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

export const validateStudentCSV = (data) => {
  const required = ["firstName", "lastName", "email", "rollNumber"];
  const errors = [];

  data.forEach((row, index) => {
    required.forEach((field) => {
      if (!row[field]) {
        errors.push(`Row ${index + 1}: Missing field '${field}'`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
};