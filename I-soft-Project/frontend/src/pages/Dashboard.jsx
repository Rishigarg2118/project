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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <Card onClick={onClick} style={{
      position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
      borderTop: `3px solid ${color}`, transition: 'transform 0.18s, box-shadow 0.18s',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '900', margin: '10px 0 4px', fontFamily: 'var(--font-head)', color }}>{value}</div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</span>
      <div style={{ position: 'absolute', right: '14px', bottom: '10px', fontSize: '32px', opacity: 0.12 }}>{icon}</div>
    </Card>
  );
}

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

// ─── Main Dashboard Component ────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  // ── Admin States ──
  const [stats, setStats] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [attendancePieMetric, setAttendancePieMetric] = useState('workHours');
  const [monitorStats, setMonitorStats] = useState(null);

  // ── Employee Personal States ──
  const [leaveBalances, setLeaveBalances] = useState({ sick_leaves: 0, casual_leaves: 0, earned_leaves: 0 });
  const [myLeaves, setMyLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [myAttendanceLogs, setMyAttendanceLogs] = useState([]);
  const [myAssets, setMyAssets] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  // Live polling for server infrastructure stats ONLY for Admin/HR/Manager
  useEffect(() => {
    if (!isAdminOrManager) return;

    let active = true;
    const fetchMonitorStats = async () => {
      try {
        const res = await axios.get('/api/v1/monitoring/stats');
        if (active) setMonitorStats(res.data);
      } catch (err) {
        // Silently skip if not permitted or offline
      }
    };
    fetchMonitorStats();
    const interval = setInterval(fetchMonitorStats, 6000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdminOrManager]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdminOrManager) {
        // ── Admin / Executive Fetch ──
        const [empRes, deptRes, skillRes, analyticsRes, attendanceRes] = await Promise.all([
          axios.get('/api/employees?limit=100').catch(() => ({ data: { employees: [] } })),
          axios.get('/api/departments').catch(() => ({ data: { departments: [] } })),
          axios.get('/api/skills').catch(() => ({ data: { skills: [] } })),
          axios.get('/api/leaves/analytics').catch(() => ({ data: { overall: [], departmentWise: [], monthlyTrend: [], rankAnalytics: [] } })),
          axios.get('/api/attendance/analytics').catch(() => ({ data: [] }))
        ]);

        const employees = empRes.data.employees || [];
        const departments = deptRes.data.departments || [];
        const skills = skillRes.data.skills || [];
        const overall = analyticsRes.data.overall || [];
        const trend = analyticsRes.data.monthlyTrend || [];
        const rankAnalytics = analyticsRes.data.rankAnalytics || [];
        const attRawData = attendanceRes.data || [];

        const pending = overall.find(r => r.status === 'pending')?.count || 0;
        const approved = overall.find(r => r.status === 'approved')?.count || 0;
        const rejected = overall.find(r => r.status === 'rejected')?.count || 0;
        const totalSalary = employees.reduce((s, e) => s + (parseFloat(e.salary) || 0), 0);

        // Department-wise distribution
        const deptEmpCount = {};
        employees.forEach(e => {
          const d = e.department_name || 'General';
          deptEmpCount[d] = (deptEmpCount[d] || 0) + 1;
        });
        const deptChartData = Object.entries(deptEmpCount)
          .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 12) + '…' : name, employees: count }))
          .sort((a, b) => b.employees - a.employees);

        // Leave status distribution
        const leaveChartData = [
          { name: 'Approved', value: parseInt(approved), color: '#10b981' },
          { name: 'Pending', value: parseInt(pending), color: '#f59e0b' },
          { name: 'Rejected', value: parseInt(rejected), color: '#f43f5e' },
        ].filter(d => d.value > 0);

        // Attendance data
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

        // Employee leaves ranking
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
      } else {
        // ── Regular Employee Fetch (Personal Workspace Only) ──
        const [balancesRes, myLeavesRes, todayStatusRes, myLogsRes, assetsRes] = await Promise.all([
          axios.get('/api/leaves/balances').catch(() => ({ data: { balances: { sick_leaves: 0, casual_leaves: 0, earned_leaves: 0 } } })),
          axios.get('/api/leaves/my').catch(() => ({ data: { leaves: [] } })),
          axios.get('/api/attendance/today-status').catch(() => ({ data: null })),
          axios.get('/api/attendance/my-logs?limit=5').catch(() => ({ data: { logs: [] } })),
          axios.get('/api/assets').catch(() => ({ data: { assets: [] } })),
        ]);

        if (balancesRes.data?.balances) {
          setLeaveBalances(balancesRes.data.balances);
        }
        setMyLeaves(myLeavesRes.data?.leaves || []);
        setTodayAttendance(todayStatusRes.data);
        setMyAttendanceLogs(myLogsRes.data?.logs || []);

        const allAssets = assetsRes.data?.assets || [];
        const allocatedToMe = allAssets.filter(
          (a) => a.employee_user_id === user?.id || (user?.name && a.allocated_to === user.name)
        );
        setMyAssets(allocatedToMe);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader message="Loading workspace..." />;

  const fmtCurrency = (n) => '₹' + Number(n).toLocaleString('en-IN');

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. REGULAR EMPLOYEE PERSONAL WORKSPACE DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════════
  if (!isAdminOrManager) {
    const totalLeaveDays =
      (Number(leaveBalances.sick_leaves) || 0) +
      (Number(leaveBalances.casual_leaves) || 0) +
      (Number(leaveBalances.earned_leaves) || 0);

    const pendingRequests = myLeaves.filter((l) => l.status === 'pending');

    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Personalized Welcome Header */}
        <header style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
              ● Personal Workspace
            </div>
            <h1 style={{
              fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: '800',
              background: 'linear-gradient(135deg, var(--text-primary) 50%, var(--text-secondary))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Welcome back, {user?.name} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
              Standard Employee Portal • Track your leave requests, attendance logs, and assigned assets
            </p>
          </div>
          <Button variant="ghost" onClick={fetchDashboardData}>🔄 Refresh Data</Button>
        </header>

        {/* 4 Focused Personal Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Card 1: Leave Balance */}
          <StatCard
            icon="🌴"
            label="Available Leaves"
            value={`${totalLeaveDays} Days`}
            sub={`Sick: ${leaveBalances.sick_leaves}d • Casual: ${leaveBalances.casual_leaves}d • Earned: ${leaveBalances.earned_leaves}d`}
            color="var(--success)"
            onClick={() => navigate('/leaves')}
          />

          {/* Card 2: Today's Attendance */}
          <StatCard
            icon="⏰"
            label="Today's Shift"
            value={todayAttendance?.checkedIn ? 'Clocked In' : 'Not Clocked In'}
            sub={todayAttendance?.checkedIn 
              ? `Check-In: ${new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Tap to punch in for today'}
            color={todayAttendance?.checkedIn ? 'var(--primary)' : '#f59e0b'}
            onClick={() => navigate('/attendance')}
          />

          {/* Card 3: Assigned Hardware */}
          <StatCard
            icon="💻"
            label="Assigned Assets"
            value={`${myAssets.length} Device${myAssets.length !== 1 ? 's' : ''}`}
            sub="Company laptops & hardware assigned to you"
            color="#6366f1"
            onClick={() => navigate('/assets')}
          />

          {/* Card 4: Pending Requests */}
          <StatCard
            icon="📋"
            label="Active Requests"
            value={`${pendingRequests.length} Pending`}
            sub={`${myLeaves.length} total leave requests submitted`}
            color="#f59e0b"
            onClick={() => navigate('/leaves')}
          />
        </div>

        {/* Quick Operations Bar */}
        <Card style={{ marginBottom: '28px', padding: '20px' }}>
          <SectionTitle>⚡ Quick Workplace Actions</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <Button variant="primary" onClick={() => navigate('/attendance')}>
              ⏰ {todayAttendance?.checkedIn ? 'Clock Out Shift' : 'Clock In Now'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/leaves')}>
              🌴 Request Time Off
            </Button>
            <Button variant="ghost" onClick={() => navigate('/assets')}>
              💻 View My Hardware Assets
            </Button>
            <Button variant="ghost" onClick={() => navigate('/profile')}>
              👤 Edit Profile & Documents
            </Button>
          </div>
        </Card>

        {/* Recent Personal Activity Rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Panel 1: My Recent Attendance Punches */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <SectionTitle>⏰ My Recent Clock In/Out Logs</SectionTitle>
              <Button small variant="ghost" onClick={() => navigate('/attendance')}>View All →</Button>
            </div>
            {myAttendanceLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                No attendance punches recorded yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase' }}>In Time</th>
                      <th style={{ padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase' }}>Out Time</th>
                      <th style={{ padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase' }}>Worked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAttendanceLogs.slice(0, 5).map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '10px', fontWeight: '600' }}>
                          {new Date(log.check_in_time).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px', color: 'var(--success)' }}>
                          {new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '10px', color: log.check_out_time ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '10px', fontWeight: '700' }}>
                          {log.worked_hours ? `${Number(log.worked_hours).toFixed(1)} hrs` : 'In progress'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Panel 2: My Leave Applications History */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <SectionTitle>🌴 My Leave Applications</SectionTitle>
              <Button small variant="ghost" onClick={() => navigate('/leaves')}>Apply New →</Button>
            </div>
            {myLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                You have not submitted any leave applications yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase' }}>Dates</th>
                      <th style={{ padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase' }}>Days</th>
                      <th style={{ padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeaves.slice(0, 5).map((leave) => {
                      const statusColor = leave.status === 'approved' ? 'var(--success)' : leave.status === 'pending' ? '#f59e0b' : 'var(--danger)';
                      return (
                        <tr key={leave.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '10px', fontWeight: '700', textTransform: 'capitalize' }}>
                            {leave.leave_type}
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                            {new Date(leave.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(leave.end_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </td>
                          <td style={{ padding: '10px', fontWeight: '600' }}>
                            {leave.days_count || 1}d
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              background: `${statusColor}18`,
                              color: statusColor,
                              border: `1px solid ${statusColor}40`
                            }}>
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. ADMIN / EXECUTIVE PORTAL ANALYTICS DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* ── Admin Header ──────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            ● Executive Administration
          </div>
          <h1 style={{
            fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: '800',
            background: 'linear-gradient(135deg, var(--text-primary) 50%, var(--text-secondary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Company Portal Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Administrator Access: <strong style={{ color: 'var(--primary)' }}>{user?.name}</strong> • Enterprise Management & Real-time Metrics
          </p>
        </div>
        <Button variant="ghost" onClick={fetchDashboardData}>🔄 Refresh</Button>
      </header>

      {/* ── 7 KPI Cards (Only for Admin / HR) ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        <StatCard icon="👥" label="Employees"        value={stats?.employees || 0}      color="var(--primary)"   sub="Active profiles"    onClick={() => navigate('/employees')} />
        <StatCard icon="🏢" label="Departments"      value={stats?.departments || 0}    color="var(--secondary)" sub="Company divisions"   onClick={() => navigate('/departments')} />
        <StatCard icon="🛠️" label="Skills"           value={stats?.skills || 0}         color="var(--warning)"   sub="Unique skill tags"  onClick={() => navigate('/skills')} />
        <StatCard icon="⏳" label="Pending Leaves"   value={stats?.pending || 0}        color="#f59e0b"          sub="Awaiting approval"  onClick={() => navigate('/approvals')} />
        <StatCard icon="✅" label="Approved Leaves"  value={stats?.approved || 0}       color="var(--success)"   sub="Sanctioned"         onClick={() => navigate('/approvals')} />
        <StatCard icon="❌" label="Rejected Leaves"  value={stats?.rejected || 0}       color="var(--danger)"    sub="Declined"           onClick={() => navigate('/approvals')} />
        <StatCard icon="💰" label="Monthly Payroll"  value={fmtCurrency(stats?.totalSalary || 0)} color="var(--primary)" sub="Total salary" />
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

      {/* ── Charts Row 2: Monthly Trends & Admin Quick Actions ────────────────── */}
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

        {/* Admin Quick Actions */}
        <Card>
          <SectionTitle>⚡ Admin Quick Actions</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button variant="primary"   onClick={() => navigate('/employees')}>👥 Employee Directory</Button>
            <Button variant="secondary" onClick={() => navigate('/approvals')}>✅ Leave Review & Approvals</Button>
            <Button variant="ghost"     onClick={() => navigate('/reports')}>📊 Executive Reports</Button>
            <Button variant="ghost"     onClick={() => navigate('/assets')}>💻 Hardware Asset Registry</Button>
            <Button variant="ghost"     onClick={() => navigate('/attendance')}>⏰ Attendance Logs</Button>
          </div>
        </Card>
      </div>

      {/* ── System Health Monitoring (Only Admin / HR / Manager) ──────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <Card style={{ borderTop: '3px solid var(--secondary)', transition: 'transform 0.18s, box-shadow 0.18s' }}>
          <SectionTitle>🖥️ System Health & Infrastructure Monitoring</SectionTitle>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'monospace' }}>
            Live status polling /api/v1/monitoring/stats • Active Engine: Node.js V8 (Restricted to Administrators)
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
