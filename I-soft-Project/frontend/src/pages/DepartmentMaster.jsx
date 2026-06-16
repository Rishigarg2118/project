import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Loader from '../components/Loader';

export default function DepartmentMaster() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newDeptName, setNewDeptName] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/departments');
      setDepartments(res.data.departments || []);
    } catch (err) {
      setError('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDept = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newDeptName.trim()) {
      setError('Department name cannot be empty.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await axios.post('/api/departments', { department_name: newDeptName.trim() });
      setSuccess('Department added successfully!');
      setNewDeptName('');
      setDepartments((prev) => [...prev, res.data.department].sort((a, b) => a.department_name.localeCompare(b.department_name)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create department.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? Employees assigned to it will be set to NULL.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/departments/${id}`);
      setSuccess('Department deleted successfully.');
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete department.');
    }
  };

  if (loading) {
    return <Loader message="Loading department configurations..." />;
  }

  const tableHeaders = [
    { label: 'ID', style: { width: '80px' } },
    { label: 'Department Name' },
    { label: 'Actions', style: { width: '120px', textAlign: 'right' } }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '36px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--text-primary) 50%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}
        >
          Department Master
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Configure, add, or remove company departments
        </p>
      </header>

      {/* Notifications */}
      {error && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--danger)',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '24px'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '24px'
          }}
        >
          ✅ {success}
        </div>
      )}

      <div className="layout-grid-1fr2fr" style={{ alignItems: 'start' }}>
        {/* Add Department Form */}
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            Add Department
          </h3>
          <form onSubmit={handleAddDept} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="deptName">Department Name</label>
              <input
                id="deptName"
                type="text"
                placeholder="e.g. Sales, Operations"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                disabled={submitLoading}
              />
            </div>
            <Button type="submit" variant="primary" disabled={submitLoading} style={{ width: '100%' }}>
              {submitLoading ? 'Creating...' : 'Add Department'}
            </Button>
          </form>
        </Card>

        {/* Departments Table */}
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            Departments Directory
          </h3>
          <Table
            headers={tableHeaders}
            data={departments}
            emptyMessage="No departments configured yet."
            renderRow={(dept) => (
              <tr key={dept.id}>
                <td style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>#{dept.id}</td>
                <td style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{dept.department_name}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleDeleteDept(dept.id)}
                    style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      color: 'var(--danger)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
