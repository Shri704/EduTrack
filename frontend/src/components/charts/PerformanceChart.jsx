import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import apiClient from "../../api/axios.js";
import { useTheme } from "../../context/ThemeContext.jsx";

const REFRESH_MS = 45_000;

const PerfTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-lg dark:border-slate-700 dark:bg-slate-950/95">
      <p className="mb-1.5 font-semibold text-slate-900 dark:text-slate-100">{row.subject}</p>
      <p className="text-emerald-700 dark:text-emerald-300">
        Average score: {Number(row.avg).toFixed(1)}%
      </p>
      <p className="text-sky-700 dark:text-sky-300">
        Pass rate (≥40%): {Number(row.pass).toFixed(1)}%
      </p>
      <p className="mt-1 text-slate-500 dark:text-slate-500">
        Based on {row.exams ?? 0} exam record
        {(row.exams ?? 0) === 1 ? "" : "s"}
      </p>
    </div>
  );
};

const PerformanceChart = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const gridStroke = isDark ? "#1e293b" : "#cbd5e1";
  const cursorFill = isDark ? "#1e293b33" : "#0d948826";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const res = await apiClient.get("/analytics/performance/overview");
        const payload = res.data?.data ?? res.data;
        const next = Array.isArray(payload) ? payload : [];
        if (!cancelled) setData(next);
      } catch {
        if (!cancelled) {
          setError("Could not load performance data.");
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
          No marks recorded yet.
        </p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 16, right: 8, left: 4, bottom: 48 }}
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
          <Tooltip content={<PerfTooltip />} cursor={{ fill: cursorFill }} />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: 4 }}
            formatter={(value) => (
              <span className="text-slate-400">{value}</span>
            )}
          />
          <Bar
            dataKey="avg"
            name="Average %"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
          >
            <LabelList
              dataKey="avg"
              position="top"
              formatter={(v) =>
                v != null ? `${Number(v).toFixed(0)}%` : ""
              }
              className="fill-slate-500 dark:fill-slate-400"
              style={{ fontSize: 10 }}
            />
          </Bar>
          <Bar
            dataKey="pass"
            name="Pass rate %"
            fill="#38bdf8"
            radius={[6, 6, 0, 0]}
          >
            <LabelList
              dataKey="pass"
              position="top"
              formatter={(v) =>
                v != null ? `${Number(v).toFixed(0)}%` : ""
              }
              className="fill-slate-500 dark:fill-slate-400"
              style={{ fontSize: 10 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
