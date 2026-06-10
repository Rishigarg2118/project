import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Loader from '../components/Loader';

export default function SkillsMaster() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newSkillName, setNewSkillName] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSkills = async () => {
    try {
      const res = await axios.get('/api/skills');
      setSkills(res.data.skills || []);
    } catch (err) {
      setError('Failed to fetch skills list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newSkillName.trim()) {
      setError('Skill name cannot be empty.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await axios.post('/api/skills', { skill_name: newSkillName.trim() });
      setSuccess('Skill added successfully!');
      setNewSkillName('');
      setSkills((prev) => [...prev, res.data.skill].sort((a, b) => a.skill_name.localeCompare(b.skill_name)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create skill.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this skill? It will be unlinked from all employee profiles.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/skills/${id}`);
      setSuccess('Skill deleted successfully.');
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete skill.');
    }
  };

  if (loading) {
    return <Loader message="Loading skills configurations..." />;
  }

  const tableHeaders = [
    { label: 'ID', style: { width: '80px' } },
    { label: 'Skill Name' },
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
            background: 'linear-gradient(135deg, #fff 50%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}
        >
          Skills Master
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Configure, add, or remove technologies and organizational skills
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>
        {/* Add Skill Form */}
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            Add Skill
          </h3>
          <form onSubmit={handleAddSkill} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="skillName">Skill Name</label>
              <input
                id="skillName"
                type="text"
                placeholder="e.g. React Native, Docker"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                disabled={submitLoading}
              />
            </div>
            <Button type="submit" variant="primary" disabled={submitLoading} style={{ width: '100%' }}>
              {submitLoading ? 'Creating...' : 'Add Skill'}
            </Button>
          </form>
        </Card>

        {/* Skills Table */}
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            Skills Inventory Directory
          </h3>
          <Table
            headers={tableHeaders}
            data={skills}
            emptyMessage="No skills configured yet."
            renderRow={(skill) => (
              <tr key={skill.id}>
                <td style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>#{skill.id}</td>
                <td style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{skill.skill_name}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleDeleteSkill(skill.id)}
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
