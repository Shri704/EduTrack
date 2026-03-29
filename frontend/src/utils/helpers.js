export const formatPercent = (value) =>
  `${Number(value || 0).toFixed(1)}%`;

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
};