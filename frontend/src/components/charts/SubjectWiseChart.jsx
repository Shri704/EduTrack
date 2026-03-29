import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import apiClient from "../../api/axios.js";
import { useTheme } from "../../context/ThemeContext.jsx";

const REFRESH_MS = 45_000;

const pct = (v) =>
  v != null && Number.isFinite(Number(v))
    ? `${Number(v).toFixed(1)}%`
    : "—";

const SubjectTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-lg dark:border-slate-700 dark:bg-slate-950/95">
      <p className="mb-1.5 font-semibold text-slate-900 dark:text-slate-100">{row.subject}</p>
      <p className="text-emerald-700 dark:text-emerald-300">
        Attendance: {pct(row.attendancePercent)}{" "}
        <span className="text-slate-500 dark:text-slate-500">
          ({row.classesRecorded} class session
          {row.classesRecorded === 1 ? "" : "s"} recorded)
        </span>
      </p>
      <p className="text-sky-700 dark:text-sky-300">
        Avg score: {pct(row.avgScorePercent)}{" "}
        <span className="text-slate-500 dark:text-slate-500">
          ({row.examCount} exam{row.examCount === 1 ? "" : "s"})
        </span>
      </p>
    </div>
  );
};

/**
 * @param {{ embedData?: unknown[]; embedLoading?: boolean }} props
 * When `embedData` is provided, the chart uses it and does not fetch (student dashboard).
 * When omitted, it loads `/analytics/subjects/breakdown` (e.g. admin dashboard).
 */
const SubjectWiseChart = ({ embedData, embedLoading } = {}) => {
  const { isDark } = useTheme();
  const controlled = embedData !== undefined;
  const [raw, setRaw] = useState(() =>
    controlled && Array.isArray(embedData) ? embedData : []
  );
  const [loading, setLoading] = useState(controlled ? !!embedLoading : true);
  const [error, setError] = useState(null);

  const gridStroke = isDark ? "#1e293b" : "#cbd5e1";
  const cursorFill = isDark ? "#1e293b33" : "#0d948826";

  useEffect(() => {
    if (controlled) {
      setRaw(Array.isArray(embedData) ? embedData : []);
      setLoading(!!embedLoading);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const res = await apiClient.get("/analytics/subjects/breakdown");
        const payload = res.data?.data ?? res.data;
        const next = Array.isArray(payload) ? payload : [];
        if (!cancelled) setRaw(next);
      } catch {
        if (!cancelled) {
          setError("Could not load subject breakdown.");
          setRaw([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [controlled, embedData, embedLoading]);

  const data = useMemo(
    () =>
      raw.map((r) => ({
        ...r,
        attendanceBar:
          r.attendancePercent != null ? Number(r.attendancePercent) : 0,
        scoreBar: r.avgScorePercent != null ? Number(r.avgScorePercent) : 0
      })),
    [raw]
  );

  const showEmpty = !loading && !error && data.length === 0;

  return (
    <div
      className="relative h-80 min-h-[16rem] w-full min-w-0 sm:h-[22rem]"
      style={{ minWidth: "min(100%, 320px)" }}
    >
      {loading && (
        <p className="absolute inset-0 z-10 flex items-center justify-center text-xs text-slate-500">
          Loading…
        </p>
      )}
      {error && (
        <p className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center text-xs text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}
      {showEmpty && (
        <p className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center text-xs text-slate-500">
          No subject data yet. Attendance and marks will appear here by
          subject.
        </p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: 4, bottom: 48 }}
          barCategoryGap="14%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridStroke}
            vertical={false}
          />
          <XAxis
            dataKey="subject"
            type="category"
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            tickLine={false}
            interval={0}
            angle={-32}
            textAnchor="end"
            height={56}
          />
          <YAxis
            type="number"
            domain={[0, 100]}
            stroke="#64748b"
            tickFormatter={(v) => `${v}%`}
            fontSize={11}
            width={40}
          />
          <Tooltip content={<SubjectTooltip />} cursor={{ fill: cursorFill }} />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: 4 }}
            formatter={(value) => (
              <span className="text-slate-400">{value}</span>
            )}
          />
          <Bar
            dataKey="attendanceBar"
            name="Attendance %"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="scoreBar"
            name="Avg score %"
            fill="#38bdf8"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubjectWiseChart;
