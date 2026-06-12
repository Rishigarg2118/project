import React, { useState, useEffect } from 'react';
import useEmployee from '../hooks/useEmployee';
import useAuth from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Loader from '../components/Loader';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import FormTable from '../components/FormTable';
import axios from 'axios';

export default function EmployeeList() {
  const { user } = useAuth();
  const {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    uploadDocument
  } = useEmployee();

  // Master databases lists
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    user_id: '',
    department_id: '',
    phone: '',
    address: '',
    designation: '',
    salary: '',
    skill_ids: [],
    images: [], // { label: '', url: '' }
    role: 'user'
  });
  
  const [imageLabel, setImageLabel] = useState('Profile Photo');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const [deptRes, skillRes, userRes] = await Promise.all([
        axios.get('/api/departments'),
        axios.get('/api/skills'),
        axios.get('/api/auth/profile').then(() => axios.get('/api/users')).catch(() => ({ data: { users: [] } }))
      ]);
      setDepartments(deptRes.data.departments || []);
      setSkills(skillRes.data.skills || []);
      setUsersList(userRes.data.users || []);
    } catch (err) {
      console.error('Failed to load metadata lists:', err);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormError('');
    setFormData({
      user_id: usersList[0]?.id || '',
      department_id: departments[0]?.id || '',
      phone: '',
      address: '',
      designation: '',
      salary: '',
      skill_ids: [],
      images: [],
      role: 'user'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingId(emp.id);
    setFormError('');
    setFormData({
      user_id: emp.user_id,
      department_id: emp.department_id || '',
      phone: emp.phone || '',
      address: emp.address || '',
      designation: emp.designation || '',
      salary: emp.salary || '',
      skill_ids: emp.skill_ids || [],
      images: emp.images || [],
      role: emp.role || 'user'
    });
    setIsFormOpen(true);
  };

  const handleOpenDetails = async (empId) => {
    try {
      const empDetails = await axios.get(`/api/employees/${empId}`);
      setSelectedEmployee(empDetails.data.employee);
      setIsDetailOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError('');
    try {
      const url = await uploadDocument(file);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, { label: imageLabel, url }]
      }));
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSkillToggle = (skillId) => {
    setFormData((prev) => {
      const exists = prev.skill_ids.includes(skillId);
      if (exists) {
        return { ...prev, skill_ids: prev.skill_ids.filter(id => id !== skillId) };
      } else {
        return { ...prev, skill_ids: [...prev.skill_ids, skillId] };
      }
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      ...formData,
      user_id: parseInt(formData.user_id),
      department_id: formData.department_id ? parseInt(formData.department_id) : null,
      salary: formData.salary ? parseFloat(formData.salary) : null
    };

    // If not admin, omit role from payload
    if (user.role !== 'admin') {
      delete payload.role;
    }

    try {
      if (editingId) {
        await updateEmployee(editingId, payload);
      } else {
        await createEmployee(payload);
      }
      setIsFormOpen(false);
      fetchEmployees();
    } catch (err) {
      setFormError(err.message || 'Failed to save profile');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee profile?')) {
      try {
        await deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const headers = [
    { label: 'Employee' },
    { label: 'Designation' },
    { label: 'Department' },
    { label: 'Phone' },
    { label: 'Skills' },
    { label: 'Documents' },
    { label: 'Actions', style: { textAlign: 'right' } }
  ];

  const isHrOrAdmin = user.role === 'admin' || user.role === 'hr';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '36px'
        }}
      >
        <div>
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
            Employee Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Manage and view company employee records, attachments, and skills.
          </p>
        </div>

        {isHrOrAdmin && (
          <Button variant="primary" onClick={handleOpenCreate}>
            ➕ Add Employee Profile
          </Button>
        )}
      </div>

      {/* Search Filter Card */}
      <Card style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '4px' }}
          />
        </div>
      </Card>

      {/* Main Datatable */}
      <Table
        headers={headers}
        data={filteredEmployees}
        loading={loading}
        emptyMessage="No matching employee profiles found."
        renderRow={(emp) => (
          <tr key={emp.id}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    border: '1.5px solid var(--border-glass-active)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    color: 'var(--secondary)',
                    overflow: 'hidden'
                  }}
                >
                  {emp.images?.find(i => i.label === 'Profile Photo') ? (
                    <img 
                      src={emp.images.find(i => i.label === 'Profile Photo').url} 
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    emp.name.charAt(0)
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{emp.email}</div>
                </div>
              </div>
            </td>
            <td>{emp.designation || 'N/A'}</td>
            <td>
              <span className="status-badge success" style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--secondary)', borderColor: 'rgba(6,182,212,0.3)' }}>
                {emp.department_name || 'Unassigned'}
              </span>
            </td>
            <td>{emp.phone || 'N/A'}</td>
            <td>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                {emp.skill_ids && emp.skill_ids.length > 0 ? (
                  emp.skill_ids.map(sid => {
                    const skillName = skills.find(s => s.id === sid)?.skill_name || `Skill #${sid}`;
                    return (
                      <span key={sid} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}>
                        {skillName}
                      </span>
                    );
                  })
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None</span>
                )}
              </div>
            </td>
            <td>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                📂 {emp.images?.length || 0} File(s)
              </span>
            </td>
            <td style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                <Button size="small" variant="ghost" onClick={() => handleOpenDetails(emp.id)}>
                  View Profile
                </Button>
                {isHrOrAdmin && (
                  <>
                    <Button size="small" variant="ghost" onClick={() => handleOpenEdit(emp)}>
                      Edit
                    </Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete(emp.id)}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Employee Record' : 'Add New Employee Record'}
        footer={null}
        size="large"
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {formError && (
            <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--danger)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
              ⚠️ {formError}
            </div>
          )}

          <div className="form-grid">
            {/* User Account Link (Only on Create) */}
            {!editingId ? (
              <FormSelect
                label="Link to User Account"
                value={formData.user_id}
                onChange={(e) => setFormData(p => ({ ...p, user_id: e.target.value }))}
                required
                emptyOptionLabel="-- Select Registered User --"
                options={usersList.map(u => ({ value: u.id, label: `${u.name} (${u.email} - Role: ${u.role})` }))}
              />
            ) : (
              <FormInput
                label="User Account"
                value={usersList.find(u => u.id === formData.user_id)?.name || ''}
                disabled
              />
            )}

            {/* System Account Role (Admin Only) */}
            {user.role === 'admin' && (
              <FormSelect
                label="System Account Role"
                value={formData.role}
                onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                required
                emptyOptionLabel={null}
                options={[
                  { value: 'user', label: 'User (Standard Employee)' },
                  { value: 'manager', label: 'Manager (Leave Reviewer)' },
                  { value: 'hr', label: 'HR Representative' },
                  { value: 'admin', label: 'System Administrator' }
                ]}
              />
            )}

            {/* Department */}
            <FormSelect
              label="Department"
              value={formData.department_id}
              onChange={(e) => setFormData(p => ({ ...p, department_id: e.target.value }))}
              required
              emptyOptionLabel="-- Select Department --"
              options={departments.map(d => ({ value: d.id, label: d.department_name }))}
            />

            {/* Designation */}
            <FormInput
              label="Job Designation"
              placeholder="Senior Engineer"
              value={formData.designation}
              onChange={(e) => setFormData(p => ({ ...p, designation: e.target.value }))}
              required
            />

            {/* Phone */}
            <FormInput
              label="Contact Phone"
              placeholder="9876543210"
              value={formData.phone}
              onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
            />

            {/* Salary */}
            <FormInput
              label="Salary (monthly)"
              type="number"
              placeholder="85000"
              value={formData.salary}
              onChange={(e) => setFormData(p => ({ ...p, salary: e.target.value }))}
              required
            />

            {/* Address */}
            <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Address Details</label>
              <textarea
                placeholder="Full address details..."
                value={formData.address}
                onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

          {/* Skills Master Checks */}
          <div className="form-group">
            <label style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Assign Technical Skills</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {skills.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={formData.skill_ids.includes(s.id)}
                    onChange={() => handleSkillToggle(s.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  {s.skill_name}
                </label>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

          {/* Files/Images Upload (limit 5) */}
          <div className="form-group">
            <label style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Documents & Photos (Max 5)</label>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ width: '180px' }}>
                <FormSelect
                  label="File Label Type"
                  value={imageLabel}
                  onChange={(e) => setImageLabel(e.target.value)}
                  emptyOptionLabel={null}
                  options={[
                    'Profile Photo',
                    'Aadhar Card',
                    'PAN Card',
                    'Resume',
                    'Certificate'
                  ]}
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Select Document File</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile || formData.images.length >= 5}
                  style={{ border: '1px dashed var(--border-glass)', padding: '8px' }}
                />
              </div>
            </div>

            {uploadingFile && <div style={{ color: 'var(--secondary)', fontSize: '13px' }}>Uploading file to server...</div>}
            {uploadError && <div style={{ color: 'var(--danger)', fontSize: '13px' }}>⚠️ {uploadError}</div>}

            {/* Current uploads list via FormTable */}
            <div style={{ marginTop: '12px' }}>
              <FormTable
                headers={['Document Name', 'Link']}
                items={formData.images}
                onRemove={handleRemoveImage}
                emptyText="No documents uploaded yet."
                renderRow={(img, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>📁 {img.label}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <a href={img.url} target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>
                        View Document
                      </a>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          background: 'transparent',
                          color: 'var(--danger)',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '15px'
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={uploadingFile}>
              {editingId ? 'Save Changes' : 'Create Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Employee Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Employee Detailed Profile"
        footer={
          <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>
            Close Profile
          </Button>
        }
        size="medium"
      >
        {selectedEmployee && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header profile block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  border: '2px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'var(--secondary)',
                  overflow: 'hidden',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
                }}
              >
                {selectedEmployee.images?.find(i => i.label === 'Profile Photo') ? (
                  <img 
                    src={selectedEmployee.images.find(i => i.label === 'Profile Photo').url} 
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  selectedEmployee.name.charAt(0)
                )}
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: '700' }}>
                  {selectedEmployee.name}
                </h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{selectedEmployee.email}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginTop: '4px' }}>
                  {selectedEmployee.role} account
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

            {/* Profile fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>DESIGNATION</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedEmployee.designation || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>DEPARTMENT</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedEmployee.department_name || 'Unassigned'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>MONTHLY SALARY</span>
                <strong style={{ color: 'var(--text-primary)' }}>₹{Number(selectedEmployee.salary).toLocaleString('en-IN') || '0'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>CONTACT PHONE</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedEmployee.phone || 'N/A'}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>RESIDENTIAL ADDRESS</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedEmployee.address || 'No address details listed.'}</span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

            {/* Skills */}
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '8px' }}>TECHNICAL SKILLS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedEmployee.skills && selectedEmployee.skills.length > 0 ? (
                  selectedEmployee.skills.map(s => (
                    <span key={s.id} className="status-badge success" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)', textTransform: 'none', fontSize: '12px' }}>
                      {s.skill_name}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No skills assigned.</span>
                )}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

            {/* Documents */}
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '8px' }}>UPLOADED DOCUMENTS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedEmployee.images && selectedEmployee.images.length > 0 ? (
                  selectedEmployee.images.map(img => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'var(--secondary)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        transition: 'var(--transition-smooth)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    >
                      <span>📁 {img.label}</span>
                      <span style={{ fontSize: '11px', textDecoration: 'underline' }}>View File ↗</span>
                    </a>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No documents uploaded.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
