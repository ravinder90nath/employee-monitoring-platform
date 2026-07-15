import React, { useState, useRef, useEffect } from "react";
import { authService } from "../../services/auth.service";
import { staffService } from "../../services/staff.service";
import useFetch from "../../hooks/useFetch";
import useDeptTitles from "../../hooks/useDeptTitles";
import { Avatar, LoadingCenter, EmptyState, Confirm, Alert } from "../../components/common";

const UserManagement = () => {
  const [dept, setDept] = useState("");
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState(null);
  const menuRef = useRef(null);
  const { deptTitles } = useDeptTitles();
  const titles = deptTitles.find((d) => d.department === dept)?.titles || [];

  const {
    data: employees,
    loading,
    refetch,
  } = useFetch(
    () => authService.getStaff({ department: dept, title }),
    [dept, title],
  );

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const empList = Array.isArray(employees) ? employees : [];
  const filtered = empList.filter(
    (e) =>
      !search ||
      (e.empName || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.empEmail || "").toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = async (email, service, value) => {
    try {
      await staffService.toggleService({
        empEmail: email,
        service,
        value: value ? 1 : 0,
      });
      refetch();
    } catch (e) {
      setAlertMsg("Toggle failed: " + e.message);
    }
    setMenu(null);
  };

  const [confirm, setConfirm] = useState({ open:false, message:'', onConfirm:null });
  const [alertMsg, setAlertMsg] = useState(null);

  const del = async (email) => {
    setConfirm({ open:true, message:`Delete ${email}?`, onConfirm: async () => {
      try { await staffService.deleteEmployee(email); refetch(); } catch(e) { setAlertMsg(e.message); }
      setMenu(null);
    } });
  };

  const StatusBadge = ({ status }) => {
    const cfg = {
      online: { c: "var(--green)", l: "Online" },
      idle: { c: "var(--yellow)", l: "Idle" },
      offline: { c: "var(--text3)", l: "Offline" },
    };
    const { c, l } = cfg[status] || cfg.offline;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          color: c,
          background: `${c}1a`,
          padding: "3px 10px",
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: c,
            boxShadow: `0 0 4px ${c}`,
          }}
        />
        {l}
      </span>
    );
  };

  const getActions = (e) => [
    {
      label: e.isTracking !== false ? 'Disable All Tracking' : 'Enable All Tracking',
      icon: e.isTracking !== false ? '🔴' : '🟢',
      color: e.isTracking !== false ? 'var(--red)' : 'var(--green)',
      fn: () => toggle(e.empEmail, 'is_tracking_enabled', e.isTracking === false),
    },
    {
      label: e.isScreenShotDisable ? 'Enable Screenshot' : 'Disable Screenshot',
      icon: '📷',
      color: e.isScreenShotDisable ? 'var(--green)' : 'var(--text)',
      fn: () => toggle(e.empEmail, 'is_screenshot_enabled', e.isScreenShotDisable),
    },
    {
      label: e.isApplogDisable ? 'Enable App Logging' : 'Disable App Logging',
      icon: '📋',
      color: e.isApplogDisable ? 'var(--green)' : 'var(--text)',
      fn: () => toggle(e.empEmail, 'is_app_log_enabled', e.isApplogDisable),
    },
    {
      label: e.isIdleDisable ? 'Enable Idle Tracking' : 'Disable Idle Tracking',
      icon: '⏸',
      color: e.isIdleDisable ? 'var(--green)' : 'var(--text)',
      fn: () => toggle(e.empEmail, 'is_idle_enabled', e.isIdleDisable),
    },
    {
      label: e.isGeolocationDisable ? 'Enable Location' : 'Disable Location',
      icon: '📍',
      color: e.isGeolocationDisable ? 'var(--green)' : 'var(--text)',
      fn: () => toggle(e.empEmail, 'is_geolocation_enabled', e.isGeolocationDisable),
    },
    {
      label: 'Delete Employee',
      icon: '🗑',
      color: 'var(--red)',
      fn: () => del(e.empEmail),
    },
  ];

  return (
    <>
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <select
          className="form-input form-select"
          style={{ width: 180 }}
          value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            setTitle("");
          }}
        >
          <option value="">All Departments</option>
          {deptTitles.map((d) => (
            <option key={d.department} value={d.department}>
              {d.department}
            </option>
          ))}
        </select>
        <select
          className="form-input form-select"
          style={{ width: 140 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        >
          <option value="">All Titles</option>
          {titles.map((t) => (
            <option key={t.title} value={t.title}>
              {t.title}
            </option>
          ))}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input
            className="form-input"
            style={{ width: 200 }}
            placeholder="🔍 Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={refetch}
            style={{
              width: 34,
              height: 34,
              background: "var(--primary)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ⟳
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 13 }}>
        <span>
          Total: <strong>{filtered.length}</strong>
        </span>
        <span style={{ color: "var(--green)" }}>
          ● Online:{" "}
          <strong>
            {filtered.filter((e) => e.status === "online").length}
          </strong>
        </span>
        <span style={{ color: "var(--yellow)" }}>
          ● Idle:{" "}
          <strong>{filtered.filter((e) => e.status === "idle").length}</strong>
        </span>
        <span style={{ color: "var(--text2)" }}>
          ● Offline:{" "}
          <strong>
            {filtered.filter((e) => !e.status || e.status === "offline").length}
          </strong>
        </span>
      </div>

      <div className="card">
        {loading ? (
          <LoadingCenter />
        ) : !filtered.length ? (
          <EmptyState
            icon="👥"
            title="No employees found"
            sub="Adjust filters or wait for agent heartbeat"
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Last Signal</th>
                  <th>Working Shift</th>
                  <th>Computer</th>
                  <th>IP</th>
                  <th>Tracking</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={i}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Avatar name={e.empName || e.empEmail} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {e.empName || "—"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text2)" }}>
                            {e.empEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                    
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            e.status === "online"
                              ? "var(--green)"
                              : e.status === "idle"
                                ? "var(--yellow)"
                                : "var(--text2)",
                        }}
                      >
                        {e.lastSignal || "Never"}
                      </span>
                    </td>
                    <td>
                      {e.shiftName && e.shiftName !== "Default Shift" ? (
                        <span style={{ fontSize: 12 }}>{e.shiftName}</span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--yellow)",
                            background: "var(--yellow-dim)",
                            padding: "2px 8px",
                            borderRadius: 10,
                          }}
                        >
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td>
                      {e.computerName ? (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>
                            🖥 {e.computerName}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text3)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {e.ipAddress ? (
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text2)" }}>
                            {e.ipAddress || "—"}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text3)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color:
                            e.isTracking !== false
                              ? "var(--green)"
                              : "var(--red)",
                        }}
                      >
                        {e.isTracking !== false ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{ position: "relative" }}
                        ref={menu === e.empEmail ? menuRef : null}
                      >
                        <button
                          onClick={() =>
                            setMenu(menu === e.empEmail ? null : e.empEmail)
                          }
                          style={{
                            background: "none",
                            border: "1px solid var(--border2)",
                            borderRadius: 6,
                            color: "var(--text2)",
                            cursor: "pointer",
                            padding: "4px 12px",
                            fontSize: 16,
                            letterSpacing: 2,
                          }}
                        >
                          •••
                        </button>
                        {menu === e.empEmail && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "110%",
                              background: "var(--bg2)",
                              border: "1px solid var(--border2)",
                              borderRadius: 8,
                              minWidth: 200,
                              zIndex: 200,
                              boxShadow: "var(--shadow)",
                              overflow: "hidden",
                            }}
                          >
                            {getActions(e).map((a, idx) => (
                              <div
                                key={idx}
                                onClick={a.fn}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "10px 14px",
                                  cursor: "pointer",
                                  color: a.color,
                                  fontSize: 12,
                                  borderBottom:
                                    idx < getActions(e).length - 1
                                      ? "1px solid var(--border)"
                                      : "none",
                                }}
                                onMouseOver={(ev) =>
                                  (ev.currentTarget.style.background =
                                    "var(--bg3)")
                                }
                                onMouseOut={(ev) =>
                                  (ev.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                <span>{a.icon}</span>
                                {a.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    <Confirm open={confirm.open} message={confirm.message} onClose={() => setConfirm({open:false})} onConfirm={confirm.onConfirm} />
    <Alert open={!!alertMsg} message={alertMsg||''} onClose={() => setAlertMsg(null)} />
    </>
  );
};

export default UserManagement;
