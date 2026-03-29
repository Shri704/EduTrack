import cron from "node-cron";

import { checkLowAttendance } from "./attendanceAlerts.js";
import { checkLowPerformance } from "./performanceAlerts.js";

export const startJobs = () => {

  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {

    console.log("Running scheduled jobs...");

    await checkLowAttendance();

    await checkLowPerformance();

  });

};