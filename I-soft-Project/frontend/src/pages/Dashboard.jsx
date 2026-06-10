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

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
    }}>
      {label && <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff', fontWeight: '700' }}>
          {p.name}: {p.value}
        </div>
      ))}
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [stats,    setStats]    = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [leaveData,setLeaveData]= useState([]);
  const [monthly,  setMonthly]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, skillRes, analyticsRes] = await Promise.all([
        axios.get('/api/employees?limit=100'),
        axios.get('/api/departments'),
        axios.get('/api/skills'),
        axios.get('/api/leaves/analytics').catch(() => ({ data: { overall: [], departmentWise: [], monthlyTrend: [] } }))
      ]);

      const employees   = empRes.data.employees    || [];
      const departments = deptRes.data.departments || [];
      const skills      = skillRes.data.skills     || [];
      const overall     = analyticsRes.data.overall         || [];
      const deptLeave   = analyticsRes.data.departmentWise  || [];
      const trend       = analyticsRes.data.monthlyTrend    || [];

      const pending  = overall.find(r => r.status === 'pending')?.count  || 0;
      const approved = overall.find(r => r.status === 'approved')?.count || 0;
      const rejected = overall.find(r => r.status === 'rejected')?.count || 0;
      const totalSalary = employees.reduce((s, e) => s + (parseFloat(e.salary) || 0), 0);

      // Department-wise employee count (for bar chart)
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

      setStats({ employees: employees.length, departments: departments.length, skills: skills.length, pending, approved, rejected, totalSalary });
      setDeptData(deptChartData);
      setLeaveData(leaveChartData);
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
            background: 'linear-gradient(135deg, #fff 50%, var(--text-secondary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            i-SOFTZONE Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Welcome, <strong style={{ color: '#fff' }}>{user?.name?.split(' ')[0]}</strong> — {user?.role?.toUpperCase()} • Live Data Dashboard
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

      {/* ── Charts Row 1 ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Bar Chart — Dept-wise employee count */}
        <Card style={{ gridColumn: 'span 2' }}>
          <SectionTitle>📊 Department-wise Employee Count</SectionTitle>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'monospace' }}>
            SELECT d.department_name, COUNT(*) FROM employees e JOIN departments d ... GROUP BY d.department_name
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="employees" name="Employees" radius={[4, 4, 0, 0]}>
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart — Leave status */}
        <Card>
          <SectionTitle>🥧 Leave Status Distribution</SectionTitle>
          {leaveData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>No leave data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={leaveData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" nameKey="name" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  style={{ fontSize: '11px', fill: 'var(--text-secondary)' }}>
                  {leaveData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────────────────────── */}
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
    </div>
  );
}
