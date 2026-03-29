import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import apiClient from "../../api/axios.js";
import { useTheme } from "../../context/ThemeContext.jsx";

const REFRESH_MS = 45_000;

const AttendanceChart = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const gridStroke = isDark ? "#1e293b" : "#cbd5e1";
  const tooltipStyle = isDark
    ? {
        backgroundColor: "#020617",
        borderRadius: "0.75rem",
        border: "1px solid #1e293b",
        fontSize: "0.75rem"
      }
    : {
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        border: "1px solid #99f6e4",
        fontSize: "0.75rem",
        boxShadow: "0 10px 40px -12px rgba(13, 148, 136, 0.25)"
      };
  const tooltipLabel = isDark ? "#e2e8f0" : "#0f172a";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const res = await apiClient.get("/analytics/attendance/daily");
        const payload = res.data?.data ?? res.data;
        const next = Array.isArray(payload) ? payload : [];
        if (!cancelled) setData(next);
      } catch {
        if (!cancelled) {
          setError("Could not load attendance data.");
          setData([]);
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
  }, []);

  const showEmpty = !loading && !error && data.length === 0;

  return (
    <div className="relative h-56 min-h-[14rem] w-full min-w-0 sm:h-64">
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
          No attendance records in this period yet.
        </p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient
              id="attendanceGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#22c55e"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="#22c55e"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridStroke}
            vertical={false}
          />
          <XAxis dataKey="day" stroke="#64748b" />
          <YAxis stroke="#64748b" tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: tooltipLabel }}
            formatter={(value) => [
              `${Number(value).toFixed(1)}%`,
              "Attendance"
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#attendanceGradient)"
            dot={{ r: 3, strokeWidth: 1, stroke: "#22c55e" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
