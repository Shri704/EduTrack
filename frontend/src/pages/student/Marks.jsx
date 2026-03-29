import { useEffect, useState } from "react";
import { getMyMarks } from "../../api/performanceApi.js";
import MarksTable from "../../components/tables/MarksTable.jsx";

const StudentMarks = () => {
  const [marks, setMarks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const data = await getMyMarks();
        setMarks(Array.isArray(data) ? data : []);
      } catch (err) {
        setMarks([]);
        setError(
          err.response?.data?.message || "Failed to load marks"
        );
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="edu-page-title">
          Your marks
        </h2>
        <p className="edu-muted mt-1 text-xs">
          View scores for each subject.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </p>
      )}

      <MarksTable marks={marks} />
    </div>
  );
};

export default StudentMarks;