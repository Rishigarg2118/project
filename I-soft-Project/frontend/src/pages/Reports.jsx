import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Table from '../components/Table';
import axios from 'axios';

// ─── Micro Stat Card ─────────────────────────────────────────────────────────
function StatBadge({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}44`,
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '120px',
    }}>
      <span style={{ fontSize: '28px', fontWeight: '800', color, fontFamily: 'var(--font-head)' }}>
        {value}
      </span>
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{
        fontFamily: 'var(--font-head)',
        fontSize: '18px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '4px'
      }}>
        <span style={{ fontSize: '20px' }}>{icon}</span> {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '30px' }}>
          <code style={{ color: 'var(--secondary)', fontFamily: 'monospace', fontSize: '11px' }}>{subtitle}</code>
        </p>
      )}
    </div>
  );
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color = 'var(--primary)', height = 180 }) {
  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>No data available.</div>;
  }
  const maxVal = Math.max(...data.map(d => Number(d[valueKey] || 0)), 1);
  const barWidth = Math.min(48, Math.floor(460 / data.length) - 12);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 520 ${height + 60}`} style={{ width: '100%', minWidth: '360px' }}>
        <defs>
          <linearGradient id={`bGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = 20 + p * (height - 20);
          return (
            <g key={i}>
              <line x1="50" y1={y} x2="510" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <text x="42" y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end" fontFamily="var(--font-body)">
                {Math.round(maxVal - p * maxVal)}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((row, idx) => {
          const val = Number(row[valueKey] || 0);
          const bh = (val / maxVal) * (height - 30);
          const x = 60 + idx * (barWidth + 12);
          const y = height - bh;
          const label = String(row[labelKey] || '').slice(0, 10);
          return (
            <g key={idx}>
              <rect x={x} y={y} width={barWidth} height={bh} rx="4"
                fill="url(#bGrad-var(--primary))"
                style={{ transition: 'var(--transition-smooth)', opacity: 0.9 }} />
              <text x={x + barWidth / 2} y={y - 6} fill="var(--secondary)" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="var(--font-head)">{val}</text>
              <text x={x + barWidth / 2} y={height + 18} fill="var(--text-secondary)" fontSize="9" textAnchor="middle" fontFamily="var(--font-body)">{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── SVG Sparkline (Monthly Trend) ───────────────────────────────────────────
function Sparkline({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>No monthly data available yet.</div>;
  }
  const W = 500, H = 140;
  const maxVal = Math.max(...data.map(d => Number(d.applications || 0)), 1);
  const pts = data.map((d, i) => {
    const x = 40 + (i / Math.max(data.length - 1, 1)) * (W - 80);
    const y = 20 + (1 - Number(d.applications) / maxVal) * (H - 40);
    return { x, y, d };
  });
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${pts[pts.length - 1].x},${H - 10} L${pts[0].x},${H - 10} Z`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '340px' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Points */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="var(--primary)" stroke="var(--bg-card)" strokeWidth="2" />
            <text x={p.x} y={p.y - 10} fill="var(--secondary)" fontSize="10" textAnchor="middle" fontWeight="700">{p.d.applications}</text>
            <text x={p.x} y={H - 2} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">{p.d.month_label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────────────
export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/leaves/analytics');
      setAnalytics(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics statistics');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (rows, headers, filename) => {
    if (!rows || rows.length === 0) return;
    const headerRow = headers.map(h => h.label).join(',');
    const dataRows = rows.map(row => headers.map(h => `"${row[h.key] ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([headerRow + '\n' + dataRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loader message="Compiling analytical reports..." />;

  const overall = analytics?.overall || [];
  const totalApps  = overall.reduce((s, r) => s + parseInt(r.count || 0), 0);
  const pending    = overall.find(r => r.status === 'pending')?.count || 0;
  const approved   = overall.find(r => r.status === 'approved')?.count || 0;
  const rejected   = overall.find(r => r.status === 'rejected')?.count || 0;

  const tabs = [
    { id: 'overview',    label: '📊 Overview' },
    { id: 'department',  label: '🏢 By Department' },
    { id: 'monthly',     label: '📅 Monthly Trend' },
    { id: 'absent',      label: '🏖️ Most Absent' },
    { id: 'rank',        label: '🏆 Leave Rank' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-head)', fontSize: '32px', fontWeight: '800',
            background: 'linear-gradient(135deg, #fff 50%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px'
          }}>
            Analytics & Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Advanced HR analytics powered by SQL GROUP BY, Window Functions, and Subqueries
          </p>
        </div>
        <Button variant="secondary" onClick={fetchReportsData}>🔄 Refresh</Button>
      </div>

      {error && (
        <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--danger)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Summary Stat Cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatBadge label="Total Applications" value={totalApps}   color="var(--text-primary)" />
        <StatBadge label="Pending"            value={pending}     color="var(--warning)" />
        <StatBadge label="Approved"           value={approved}    color="var(--success)" />
        <StatBadge label="Rejected"           value={rejected}    color="var(--danger)" />
        <StatBadge label="Departments"        value={analytics?.departmentWise?.length || 0} color="var(--primary)" />
        <StatBadge label="Above Avg Takers"   value={analytics?.aboveAverage?.length || 0}  color="var(--secondary)" />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
              background: activeTab === tab.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '700' : '400',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ───────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <Card style={{ gridColumn: 'span 2' }}>
            <SectionHeader icon="📊" title="Leave Status Overview" subtitle="SELECT status, COUNT(*) FROM leaves GROUP BY status" />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {overall.length === 0
                ? <span style={{ color: 'var(--text-secondary)' }}>No leave applications found.</span>
                : overall.map((item, idx) => (
                    <div key={idx} style={{
                      flex: 1, minWidth: '120px',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${item.status === 'approved' ? 'var(--success)' : item.status === 'rejected' ? 'var(--danger)' : 'var(--warning)'}44`,
                      borderRadius: '12px', padding: '20px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'var(--font-head)',
                        color: item.status === 'approved' ? 'var(--success)' : item.status === 'rejected' ? 'var(--danger)' : 'var(--warning)'
                      }}>{item.count}</div>
                      <div style={{ textTransform: 'capitalize', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {item.status}
                      </div>
                    </div>
                  ))
              }
            </div>
          </Card>
          
          <Card>
            <SectionHeader icon="🔍" title="Above-Average Leave Takers" subtitle="WHERE days > (SELECT AVG(days) FROM ...)" />
            {analytics?.aboveAverage?.length === 0
              ? <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No employees exceed the average yet.</p>
              : (analytics?.aboveAverage || []).map((emp, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: '1px solid var(--border-glass)'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{emp.employee_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.department_name || 'N/A'}</div>
                    </div>
                    <span style={{
                      background: 'rgba(244,63,94,0.15)', color: 'var(--danger)',
                      border: '1px solid rgba(244,63,94,0.3)',
                      borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '700'
                    }}>
                      {emp.total_approved_days}d
                    </span>
                  </div>
                ))
            }
          </Card>
        </div>
      )}

      {/* ── Tab: Department ──────────────────────────────────────────────── */}
      {activeTab === 'department' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <SectionHeader icon="🏢" title="Department-wise Leave Analysis" subtitle="SELECT d.name, COUNT(l.id) FROM departments d LEFT JOIN leaves l ON ... GROUP BY d.id" />
            <Button variant="secondary" onClick={() => downloadCSV(
              analytics?.departmentWise,
              [{label:'Department',key:'department_name'},{label:'Total',key:'total_applications'},{label:'Approved',key:'approved_count'},{label:'Rejected',key:'rejected_count'},{label:'Pending',key:'pending_count'},{label:'Approved Days',key:'total_approved_days'}],
              'department_leave_report.csv'
            )}>📥 Export CSV</Button>
          </div>
          <BarChart data={analytics?.departmentWise} valueKey="total_applications" labelKey="department_name" />
          <Table
            headers={[
              {label:'Department'},{label:'Total Applications'},{label:'Approved'},{label:'Rejected'},{label:'Pending'},{label:'Approved Days'}
            ]}
            data={analytics?.departmentWise || []}
            emptyMessage="No department leave data found."
            renderRow={(row, idx) => (
              <tr key={idx}>
                <td style={{fontWeight:'600'}}>{row.department_name}</td>
                <td>{row.total_applications}</td>
                <td><span className="status-badge success">{row.approved_count}</span></td>
                <td><span className="status-badge danger">{row.rejected_count}</span></td>
                <td><span className="status-badge warning">{row.pending_count}</span></td>
                <td style={{fontWeight:'700', color:'var(--secondary)'}}>{row.total_approved_days} d</td>
              </tr>
            )}
          />
        </Card>
      )}

      {/* ── Tab: Monthly Trend ───────────────────────────────────────────── */}
      {activeTab === 'monthly' && (
        <Card>
          <SectionHeader icon="📅" title="Monthly Leave Trend — Last 6 Months" subtitle="SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) FROM leaves GROUP BY month" />
          <Sparkline data={analytics?.monthlyTrend} />
          <div style={{ marginTop: '24px' }}>
            <Table
              headers={[{label:'Month'},{label:'Total Applications'},{label:'Approved'},{label:'Rejected'}]}
              data={analytics?.monthlyTrend || []}
              emptyMessage="No monthly data yet — leave applications will appear here."
              renderRow={(row, idx) => (
                <tr key={idx}>
                  <td style={{fontWeight:'600'}}>{row.month_label}</td>
                  <td>{row.applications}</td>
                  <td><span className="status-badge success">{row.approved_count}</span></td>
                  <td><span className="status-badge danger">{row.rejected_count}</span></td>
                </tr>
              )}
            />
          </div>
        </Card>
      )}

      {/* ── Tab: Most Absent ─────────────────────────────────────────────── */}
      {activeTab === 'absent' && (
        <Card>
          <SectionHeader icon="🏖️" title="Top 5 Most Absent Employees" subtitle="SELECT employee_id, SUM(days) AS total_absent_days FROM leaves WHERE status='approved' GROUP BY employee_id ORDER BY total_absent_days DESC LIMIT 5" />
          <Table
            headers={[{label:'#'},{label:'Employee'},{label:'Department'},{label:'Designation'},{label:'Total Applications'},{label:'Approved Days'}]}
            data={analytics?.mostAbsent || []}
            emptyMessage="No approved leave data found yet."
            renderRow={(row, idx) => (
              <tr key={idx}>
                <td>
                  <span style={{
                    width:'28px', height:'28px', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center',
                    background: idx === 0 ? 'rgba(245,158,11,0.2)' : idx === 1 ? 'rgba(100,116,139,0.2)' : 'rgba(180,83,9,0.2)',
                    color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309',
                    fontWeight:'800', fontSize:'13px'
                  }}>
                    {idx + 1}
                  </span>
                </td>
                <td>
                  <div style={{fontWeight:'600'}}>{row.employee_name}</div>
                  <div style={{fontSize:'11px', color:'var(--text-secondary)'}}>{row.email}</div>
                </td>
                <td>{row.department_name || 'N/A'}</td>
                <td>{row.designation || 'N/A'}</td>
                <td>{row.total_applications}</td>
                <td>
                  <span style={{
                    background:'rgba(244,63,94,0.15)', color:'var(--danger)',
                    border:'1px solid rgba(244,63,94,0.3)',
                    borderRadius:'20px', padding:'3px 12px', fontWeight:'800', fontSize:'13px'
                  }}>
                    {row.total_absent_days} days
                  </span>
                </td>
              </tr>
            )}
          />
        </Card>
      )}

      {/* ── Tab: Leave Rank ──────────────────────────────────────────────── */}
      {activeTab === 'rank' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <SectionHeader icon="🏆" title="Employee Leave Ranking" subtitle="RANK() OVER (ORDER BY total_leave_days DESC) — Window Function" />
            <Button variant="secondary" onClick={() => downloadCSV(
              analytics?.rankAnalytics,
              [{label:'Employee',key:'employee_name'},{label:'Department',key:'department_name'},{label:'Designation',key:'designation'},{label:'Applied',key:'total_leaves_applied'},{label:'Approved',key:'approved_count'},{label:'Rejected',key:'rejected_count'},{label:'Total Days',key:'total_leave_days'},{label:'Rank',key:'leave_rank'},{label:'Dense Rank',key:'dense_rank'}],
              'employee_leave_rank_report.csv'
            )}>📥 Export CSV</Button>
          </div>
          <Table
            headers={[{label:'Rank'},{label:'Employee'},{label:'Department'},{label:'Applied'},{label:'Approved'},{label:'Rejected'},{label:'Total Days'}]}
            data={analytics?.rankAnalytics || []}
            emptyMessage="No employee leave data found."
            renderRow={(row, idx) => (
              <tr key={idx}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{
                      width:'32px', height:'32px', borderRadius:'50%', display:'inline-flex',
                      alignItems:'center', justifyContent:'center', fontWeight:'800', fontSize:'13px',
                      background: row.leave_rank === 1 ? 'rgba(245,158,11,0.25)' : row.leave_rank === 2 ? 'rgba(100,116,139,0.25)' : row.leave_rank === 3 ? 'rgba(180,83,9,0.2)' : 'rgba(255,255,255,0.06)',
                      color: row.leave_rank === 1 ? '#f59e0b' : row.leave_rank === 2 ? '#94a3b8' : row.leave_rank === 3 ? '#cd7c32' : 'var(--text-secondary)',
                      border: row.leave_rank <= 3 ? '1px solid currentColor' : 'none'
                    }}>
                      {row.leave_rank}
                    </span>
                    <span style={{fontSize:'10px', color:'var(--text-muted)'}}>DR:{row.dense_rank}</span>
                  </div>
                </td>
                <td style={{fontWeight:'600'}}>{row.employee_name}</td>
                <td>{row.department_name || 'N/A'}</td>
                <td>{row.total_leaves_applied}</td>
                <td><span className="status-badge success">{row.approved_count}</span></td>
                <td><span className="status-badge danger">{row.rejected_count}</span></td>
                <td style={{fontWeight:'700', color:'var(--secondary)'}}>{row.total_leave_days} d</td>
              </tr>
            )}
          />
        </Card>
      )}
    </div>
  );
}
