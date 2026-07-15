export const fmt = {
  time: (d) =>
    d
      ? new Date(d).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
  date: (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "—",
  datetime: (d) =>
    d
      ? new Date(d).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
  mins: (m) => {
    if (!m || m <= 0) return "0m";
    const h = Math.floor(m / 60),
      mn = Math.round(m % 60);
    return h > 0 ? `${h}h ${mn}m` : `${mn}m`;
  },
  bytes: (b) => {
    if (!b) return "0 B";
    const k = 1024,
      s = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
  },
  pct: (n, t) => (t > 0 ? Math.round((n / t) * 100) : 0),
  hhmm: (m) => {
    const h = Math.floor(m / 60),
      mn = Math.round(m % 60);
    return `${String(h).padStart(2, "0")}h${String(mn).padStart(2, "0")}m`;
  },
};

export const today = () => new Date().toISOString().split("T")[0];
export const weekAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
};

export const avatarBg = (name = "") => {
  const c = [
    "#1f6feb",
    "#238636",
    "#8957e5",
    "#d29922",
    "#f0883e",
    "#da3633",
    "#0969da",
    "#1a7f37",
  ];
  return c[(name.charCodeAt(0) || 0) % c.length];
};

export const initials = (n = "") =>
  n
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const scoreColor = (s) =>
  s >= 70 ? "var(--green)" : s >= 40 ? "var(--yellow)" : "var(--red)";
export const statusColor = (s) =>
  ({ online: "var(--green)", idle: "var(--yellow)", offline: "var(--text3)" })[
    s
  ] || "var(--text3)";
export const catBadge = (c) =>
  ({ productive: "green", distractive: "red", neutral: "blue" })[c] || "gray";
