import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

// ─── Colour Palette ───────────────────────────────────────────────────────────
const COLORS = ['#6366f1','#22d3ee','#10b981','#f59e0b','#f43f5e','#a78bfa','#34d399','#fb923c'];

// ─── Custom Hour Formatter ───────────────────────────────────────────────────
const formatHourDecimal = (val) => {
  if (val === undefined || val === null) return '';
  const num = parseFloat(val);
  const hours = Math.floor(num);
  const mins = Math.round((num - hours) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = mins < 10 ? '0' + mins : mins;
  return `${displayHours}:${displayMins} ${ampm}`;
};

const formatYAxisHour = (hour) => {
  const h = Math.floor(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour} ${ampm}`;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
    }}>
      {label && <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>}
      {payload.map((p, i) => {
        const isTimeValue = p.name.toLowerCase().includes('clock') || p.name.toLowerCase().includes('in') || p.name.toLowerCase().includes('out');
        const formattedValue = isTimeValue ? formatHourDecimal(p.value) : p.value;
        return (
          <div key={i} style={{ color: p.color || '#fff', fontWeight: '700' }}>
            {p.name}: {formattedValue}
          </div>
        );
      })}
    </div>
  );
};

// ─── Custom Pie Value Formatter ──────────────────────────────────────────────
const formatPieValue = (val, metric) => {
  if (metric === 'workHours') {
    return `${val} Hrs`;
  }
  return formatHourDecimal(val);
};

// ─── Attendance Pie Tooltip ──────────────────────────────────────────────────
const AttendancePieTooltip = ({ active, payload, metric }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const formattedValue = metric === 'workHours'
    ? `${p.value} Hrs`
    : formatHourDecimal(p.value);
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{p.name}</div>
      <div style={{ color: p.color || '#fff', fontWeight: '700' }}>
        {metric === 'workHours' ? 'Avg Work Hours' : metric === 'clockIn' ? 'Avg Clock In' : 'Avg Clock Out'}: {formattedValue}
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <Card onClick={onClick} style={{
      position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
      borderTop: `3px solid ${color}`, transition: 'transform 0.18s, box-shadow 0.18s',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: '900', margin: '10px 0 4px', fontFamily: 'var(--font-head)', color }}>{value}</div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</span>
      <div style={{ position: 'absolute', right: '14px', bottom: '10px', fontSize: '34px', opacity: 0.12 }}>{icon}</div>
    </Card>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {children}
    </h3>
  );
}

const formatUptime = (seconds) => {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 MB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [stats,    setStats]    = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [leaveData,setLeaveData]= useState([]);
  const [monthly,  setMonthly]  = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [attendancePieMetric, setAttendancePieMetric] = useState('workHours');
  const [loading,  setLoading]  = useState(true);
  const [monitorStats, setMonitorStats] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let active = true;
    const fetchMonitorStats = async () => {
      try {
        const res = await axios.get('/api/v1/monitoring/stats');
        if (active) {
          setMonitorStats(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch system monitoring stats:', err);
      }
    };
    fetchMonitorStats();
    const interval = setInterval(fetchMonitorStats, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, skillRes, analyticsRes, attendanceRes] = await Promise.all([
        axios.get('/api/employees?limit=100'),
        axios.get('/api/departments'),
        axios.get('/api/skills'),
        axios.get('/api/leaves/analytics').catch(() => ({ data: { overall: [], departmentWise: [], monthlyTrend: [], rankAnalytics: [] } })),
        axios.get('/api/attendance/analytics').catch(() => ({ data: [] }))
      ]);

      const employees   = empRes.data.employees    || [];
      const departments = deptRes.data.departments || [];
      const skills      = skillRes.data.skills     || [];
      const overall     = analyticsRes.data.overall         || [];
      const deptLeave   = analyticsRes.data.departmentWise  || [];
      const trend       = analyticsRes.data.monthlyTrend    || [];
      const rankAnalytics = analyticsRes.data.rankAnalytics || [];
      const attRawData  = attendanceRes.data                || [];

      const pending  = overall.find(r => r.status === 'pending')?.count  || 0;
      const approved = overall.find(r => r.status === 'approved')?.count || 0;
      const rejected = overall.find(r => r.status === 'rejected')?.count || 0;
      const totalSalary = employees.reduce((s, e) => s + (parseFloat(e.salary) || 0), 0);

      // Department-wise employee count (for bar and donut charts)
      const deptEmpCount = {};
      employees.forEach(e => {
        const d = e.department_name || 'Unknown';
        deptEmpCount[d] = (deptEmpCount[d] || 0) + 1;
      });
      const deptChartData = Object.entries(deptEmpCount)
        .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 12) + '…' : name, employees: count }))
        .sort((a, b) => b.employees - a.employees);

      // Leave status pie data
      const leaveChartData = [
        { name: 'Approved', value: parseInt(approved), color: '#10b981' },
        { name: 'Pending',  value: parseInt(pending),  color: '#f59e0b' },
        { name: 'Rejected', value: parseInt(rejected), color: '#f43f5e' },
      ].filter(d => d.value > 0);

      // Attendance data mapping
      const mappedAttData = attRawData.map(r => {
        const inHr = parseFloat(r.avg_check_in_hour) || 0;
        const outHr = parseFloat(r.avg_check_out_hour) || 0;
        const diff = outHr - inHr;
        return {
          name: r.employee_name,
          avgClockIn: inHr,
          avgClockOut: outHr,
          avgWorkHours: diff > 0 ? parseFloat(diff.toFixed(2)) : 0
        };
      });

      // Employee leaves mapping
      const mappedLeaveData = rankAnalytics
        .map(r => ({
          name: r.employee_name,
          leaves: parseInt(r.total_leave_days) || 0,
          applications: parseInt(r.approved_count) || 0
        }))
        .sort((a, b) => b.leaves - a.leaves);

      setStats({ employees: employees.length, departments: departments.length, skills: skills.length, pending, approved, rejected, totalSalary });
      setDeptData(deptChartData);
      setLeaveData(leaveChartData);
      setAttendanceData(mappedAttData);
      setEmployeeLeaves(mappedLeaveData);
      setMonthly(trend.map(t => ({ name: t.month_label, applications: parseInt(t.applications), approved: parseInt(t.approved_count) })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader message="Loading dashboard..." />;

  const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: '800',
            background: 'linear-gradient(135deg, var(--text-primary) 50%, var(--text-secondary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            i-SOFTZONE Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Welcome, <strong style={{ color: 'var(--primary)' }}>{user?.name?.split(' ')[0]}</strong> — {user?.role?.toUpperCase()} • Live Data Dashboard
          </p>
        </div>
        <Button variant="ghost" onClick={fetchAll}>🔄 Refresh</Button>
      </header>

      {/* ── 7 KPI Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        <StatCard icon="👥" label="Employees"        value={stats.employees}      color="var(--primary)"   sub="Active profiles"    onClick={() => navigate('/employees')} />
        <StatCard icon="🏢" label="Departments"      value={stats.departments}    color="var(--secondary)" sub="Company divisions"   onClick={() => navigate('/departments')} />
        <StatCard icon="🛠️" label="Skills"           value={stats.skills}         color="var(--warning)"   sub="Unique skill tags"  onClick={() => navigate('/skills')} />
        <StatCard icon="⏳" label="Pending Leaves"   value={stats.pending}        color="#f59e0b"          sub="Awaiting approval"  onClick={() => navigate('/leave-approval')} />
        <StatCard icon="✅" label="Approved Leaves"  value={stats.approved}       color="var(--success)"   sub="Sanctioned"         onClick={() => navigate('/leave-approval')} />
        <StatCard icon="❌" label="Rejected Leaves"  value={stats.rejected}       color="var(--danger)"    sub="Declined"           onClick={() => navigate('/leave-approval')} />
        <StatCard icon="💰" label="Monthly Payroll"  value={fmt(stats.totalSalary)} color="#a78bfa"        sub="Total salary" />
      </div>

      {/* ── Charts Row 1: Attendance & Department Distribution ──────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Employee Average Clock-In / Clock-Out Time */}
        <Card style={{ gridColumn: 'span 2' }}>
          <SectionTitle>⏰ Employee Average Clock-In / Clock-Out Time</SectionTitle>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'monospace' }}>
            AVG(EXTRACT(HOUR/MINUTE FROM check_in_time)) GROUP BY employee_id
          </div>
          {attendanceData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>No clock-in/out data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]} tickFormatter={formatYAxisHour} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgClockIn" name="Average Clock In" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgClockOut" name="Average Clock Out" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Employee Distribution by Department */}
        <Card>
          <SectionTitle>🏢 Employee Department Distribution</SectionTitle>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'monospace' }}>
            Headcount breakdown across company divisions
          </div>
          {deptData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>No department data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                  dataKey="employees" nameKey="name" paddingAngle={3} label={({ name, employees }) => `${name}: ${employees}`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  style={{ fontSize: '10px', fill: 'var(--text-secondary)' }}>
                  {deptData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-primary)" style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'var(--font-head)' }}>
                  {stats?.employees || 0}
                </text>
                <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>
                  Staff
                </text>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Charts Row 2: Monthly Trends & Quick Actions ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Area Chart — Monthly leave trend */}
        <Card style={{ gridColumn: 'span 2' }}>
          <SectionTitle>📈 Monthly Leave Trend — Area Chart</SectionTitle>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'monospace' }}>
            SELECT DATE_TRUNC('month', created_at), COUNT(*) FROM leaves GROUP BY month
          </div>
          {monthly.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>No monthly data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="applications" name="Applied"  stroke="#6366f1" fill="url(#colorApps)"     strokeWidth={2} />
                <Area type="monotone" dataKey="approved"     name="Approved" stroke="#10b981" fill="url(#colorApproved)" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <SectionTitle>⚡ Quick Actions</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button variant="primary"   onClick={() => navigate('/attendance')}>⏰ Clock In / Clock Out</Button>
            <Button variant="secondary" onClick={() => navigate('/leaves')}>🌴 Apply for Leave</Button>
            <Button variant="ghost"     onClick={() => navigate('/employees')}>👥 Employee Directory</Button>
            <Button variant="ghost"     onClick={() => navigate('/reports')}>📊 Analytics & Reports</Button>
            <Button variant="ghost"     onClick={() => navigate('/assets')}>💻 Asset Tracker</Button>
          </div>
        </Card>
      </div>

      {/* ── Charts Row 3: Leaves Breakdown & Leave Status Distribution ────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Leaves Taken by Employee */}
        <Card style={{ gridColumn: 'span 2' }}>
          <SectionTitle>🌴 Leaves Taken by Employee (Approved Days)</SectionTitle>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'monospace' }}>
            SUM(end_date - start_date + 1) WHERE status = 'approved' GROUP BY employee_id
          </div>
          {employeeLeaves.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>No leave applications approved yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={employeeLeaves} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="leaves" name="Approved Days" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="applications" name="Approved Requests" fill="#fb923c" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Leave Status Distribution */}
        <Card>
          <SectionTitle>🥧 Leave Status Distribution</SectionTitle>
          {leaveData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>No leave data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={leaveData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                  dataKey="value" nameKey="name" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  style={{ fontSize: '10px', fill: 'var(--text-secondary)' }}>
                  {leaveData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── System Health & Attendance Pie Chart Row ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Attendance Pie Chart */}
        <Card>
          <SectionTitle>🥧 Staff Attendance Averages Breakdown</SectionTitle>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'monospace' }}>
            Average clock-in, clock-out, or work hours per employee
          </div>
          
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', background: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <button 
              onClick={() => setAttendancePieMetric('workHours')}
              style={{
                flex: 1,
                background: attendancePieMetric === 'workHours' ? 'var(--primary)' : 'transparent',
                border: 'none',
                color: attendancePieMetric === 'workHours' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Work Hours
            </button>
            <button 
              onClick={() => setAttendancePieMetric('clockIn')}
              style={{
                flex: 1,
                background: attendancePieMetric === 'clockIn' ? 'var(--primary)' : 'transparent',
                border: 'none',
                color: attendancePieMetric === 'clockIn' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Clock In
            </button>
            <button 
              onClick={() => setAttendancePieMetric('clockOut')}
              style={{
                flex: 1,
                background: attendancePieMetric === 'clockOut' ? 'var(--primary)' : 'transparent',
                border: 'none',
                color: attendancePieMetric === 'clockOut' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Clock Out
            </button>
          </div>

          {attendanceData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>No attendance data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie 
                  data={attendanceData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50} 
                  outerRadius={70}
                  dataKey={
                    attendancePieMetric === 'workHours' ? 'avgWorkHours' : 
                    attendancePieMetric === 'clockIn' ? 'avgClockIn' : 'avgClockOut'
                  } 
                  nameKey="name" 
                  paddingAngle={3} 
                  label={({ name, value }) => `${name.split(' ')[0]}: ${formatPieValue(value, attendancePieMetric)}`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  style={{ fontSize: '9px', fill: 'var(--text-secondary)' }}
                >
                  {attendanceData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<AttendancePieTooltip metric={attendancePieMetric} />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* System Health */}
        <Card style={{ gridColumn: 'span 2', borderTop: '3px solid var(--secondary)', transition: 'transform 0.18s, box-shadow 0.18s' }}>
          <SectionTitle>🖥️ System Health & Infrastructure Monitoring</SectionTitle>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'monospace' }}>
            Live status polling /api/v1/monitoring/stats • Active Engine: Node.js V8
          </div>
          {monitorStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Database Connection</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: monitorStats.dbStatus === 'CONNECTED' ? 'var(--success)' : 'var(--danger)',
                    boxShadow: monitorStats.dbStatus === 'CONNECTED' ? '0 0 10px var(--success)' : '0 0 10px var(--danger)',
                    display: 'inline-block'
                  }}></span>
                  <strong style={{ fontSize: '15px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {monitorStats.dbStatus}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Requests</span>
                <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-head)', color: 'var(--secondary)' }}>
                  {monitorStats.apiRequests?.toLocaleString() || 0}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Failed Logins</span>
                <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-head)', color: monitorStats.failedLogins > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {monitorStats.failedLogins}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Server Uptime</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '4px' }}>
                  {formatUptime(monitorStats.uptime)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Memory Footprint (RSS / Heap)</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '4px' }}>
                  RSS: <strong style={{ color: 'var(--primary)' }}>{formatBytes(monitorStats.memory?.rss)}</strong> • 
                  Heap: <strong style={{ color: 'var(--warning)' }}>{formatBytes(monitorStats.memory?.heapUsed)}</strong> / {formatBytes(monitorStats.memory?.heapTotal)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '10px 0' }}>Connecting to system monitor...</div>
          )}
        </Card>
      </div>
    </div>
  );
}
