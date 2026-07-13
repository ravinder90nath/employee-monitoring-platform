import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { authFetch } from '../../../../services/api';
import { LoadingCenter } from '../../../../components/common';
import { fmt } from '../../../../utils/helpers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TIP = { background:'#1c2128', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, fontSize:11 };
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const WeeklyView = ({ email, from, to }) => {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    authFetch(`${API_URL}/admin/getsessionlist?email=${email}&from=${from}&to=${to}`)
      .then(d => setSessions(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email, from, to]);

  const dailyStats = useMemo(() => DAYS.map((day, i) => {
    const d = new Date(from); d.setDate(d.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => s.session_start?.startsWith(ds));
    const loginTime  = daySessions[0]?.session_start ? new Date(daySessions[0].session_start).toTimeString().slice(0,5) : '00:00';
    const logoutTime = daySessions[daySessions.length-1]?.session_end ? new Date(daySessions[daySessions.length-1].session_end).toTimeString().slice(0,5) : '00:00';
    const workedMins = daySessions.reduce((s, sess) => {
      if (!sess.session_start) return s;
      const end = sess.session_end ? new Date(sess.session_end) : new Date();
      return s + (end - new Date(sess.session_start)) / 60000;
    }, 0);
    return { day, date:ds, startTime:loginTime, endTime:logoutTime, workedMins, noActMins:Math.max(0, 540 - workedMins) };
  }), [sessions, from]);

  const chartData = dailyStats.map(d => ({ day:d.day.slice(0,3), hours:Math.round(d.workedMins/60*100)/100 }));

  if (loading) return <LoadingCenter msg="Loading weekly data..."/>;

  return (
    <div>
      <div style={{ fontSize:12, color:'var(--text2)', fontWeight:500, marginBottom:8 }}>Weekly Productive Hours</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
          <XAxis dataKey="day" tick={{ fill:'#7d8590', fontSize:11 }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fill:'#7d8590', fontSize:10 }} axisLine={false} tickLine={false} unit="h"/>
          <Tooltip contentStyle={TIP} formatter={v => [`${v}h`, 'Hours']}/>
          <Line type="monotone" dataKey="hours" stroke="#2d8cf0" strokeWidth={2.5} dot={{ fill:'#2d8cf0', r:4 }} activeDot={{ r:6 }}/>
        </LineChart>
      </ResponsiveContainer>
      <div className="table-wrap" style={{ marginTop:16 }}>
        <table>
          <thead>
            <tr><th>Day</th><th>Start</th><th>End</th><th>Total Hrs</th><th>Productive</th><th>Distracting</th><th>No Activity</th><th>Internet</th></tr>
          </thead>
          <tbody>
            {dailyStats.map((d, i) => (
              <tr key={i}>
                <td style={{ fontWeight:600 }}>{d.day}</td>
                <td style={{ color: d.startTime > '09:30' && d.startTime !== '00:00' ? 'var(--red)' : 'var(--green)' }}>{d.startTime}</td>
                <td>{d.endTime}</td>
                <td>9 hrs</td>
                <td style={{ color:'var(--green)', fontWeight:600 }}>0h 00m</td>
                <td style={{ color:'var(--red)',   fontWeight:600 }}>0h 00m</td>
                <td style={{ color:'var(--yellow)' }}>{fmt.hhmm(d.noActMins)}</td>
                <td>0.00 GB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyView;
