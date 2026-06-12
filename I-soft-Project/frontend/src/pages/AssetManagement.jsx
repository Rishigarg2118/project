import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Loader from '../components/Loader';
import axios from 'axios';

export default function AssetManagement() {
  const { user } = useAuth();
  
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Forms fields
  const [assetForm, setAssetForm] = useState({
    name: '',
    serial_number: '',
    status: 'available',
    description: ''
  });
  const [allocateForm, setAllocateForm] = useState({
    employee_id: '',
    notes: ''
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/assets');
      setAssets(res.data.assets || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch hardware assets list');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error('Failed to fetch employees list for allocations dropdown');
    }
  };

  const handleOpenCreateAsset = () => {
    setSelectedAsset(null);
    setFormError('');
    setAssetForm({
      name: '',
      serial_number: '',
      status: 'available',
      description: ''
    });
    setIsAssetModalOpen(true);
  };

  const handleOpenEditAsset = (asset) => {
    setSelectedAsset(asset);
    setFormError('');
    setAssetForm({
      name: asset.name,
      serial_number: asset.serial_number,
      status: asset.status,
      description: asset.description || ''
    });
    setIsAssetModalOpen(true);
  };

  const handleOpenAllocate = (asset) => {
    setSelectedAsset(asset);
    setFormError('');
    setAllocateForm({
      employee_id: employees[0]?.id || '',
      notes: ''
    });
    setIsAllocateModalOpen(true);
  };

  const handleOpenHistory = async (asset) => {
    setSelectedAsset(asset);
    try {
      const res = await axios.get(`/api/assets/${asset.id}`);
      setAllocationHistory(res.data.history || []);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (selectedAsset) {
        await axios.put(`/api/assets/${selectedAsset.id}`, assetForm);
      } else {
        await axios.post('/api/assets', assetForm);
      }
      setIsAssetModalOpen(false);
      fetchAssets();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save asset details');
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!allocateForm.employee_id) {
      setFormError('Please select an employee');
      return;
    }

    try {
      await axios.post('/api/assets/allocate', {
        asset_id: selectedAsset.id,
        employee_id: parseInt(allocateForm.employee_id),
        notes: allocateForm.notes
      });
      setIsAllocateModalOpen(false);
      fetchAssets();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Allocation process failed');
    }
  };

  const handleReturnAsset = async (asset) => {
    if (window.confirm(`Are you sure you want to log return of ${asset.name}?`)) {
      try {
        await axios.put(`/api/assets/return/${asset.id}`, { notes: 'Returned to storage' });
        fetchAssets();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Return request failed');
      }
    }
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm('Delete this asset from inventory permanently?')) {
      try {
        await axios.delete(`/api/assets/${id}`);
        fetchAssets();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isHrOrAdmin = user.role === 'admin' || user.role === 'hr';
  const isManager = user.role === 'manager';

  const headers = [
    { label: 'Device Name' },
    { label: 'Serial Number' },
    { label: 'Status' },
    { label: 'Current Allocation' },
    { label: 'Description' },
    { label: 'Actions', style: { textAlign: 'right' } }
  ];

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
              background: 'linear-gradient(135deg, var(--text-primary) 50%, var(--text-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}
          >
            Hardware Inventory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Track IT hardware allocation log records, device assignments, and maintenance.
          </p>
        </div>

        {isHrOrAdmin && (
          <Button variant="primary" onClick={handleOpenCreateAsset}>
            ➕ Add Device
          </Button>
        )}
      </div>

      {/* Filter search */}
      <Card style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by device name or serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '4px' }}
          />
        </div>
      </Card>

      {/* Main inventory list */}
      <Table
        headers={headers}
        data={filteredAssets}
        loading={loading}
        emptyMessage="No hardware devices found."
        renderRow={(asset) => (
          <tr key={asset.id}>
            <td style={{ fontWeight: '600' }}>💻 {asset.name}</td>
            <td><code>{asset.serial_number}</code></td>
            <td>
              <span
                className={`status-badge ${
                  asset.status === 'available' ? 'success' : asset.status === 'allocated' ? 'secondary' : 'warning'
                }`}
                style={{
                  background: asset.status === 'allocated' ? 'rgba(6, 182, 212, 0.12)' : undefined,
                  color: asset.status === 'allocated' ? 'var(--secondary)' : undefined,
                  borderColor: asset.status === 'allocated' ? 'rgba(6, 182, 212, 0.3)' : undefined
                }}
              >
                {asset.status}
              </span>
            </td>
            <td>
              {asset.status === 'allocated' && asset.allocated_to ? (
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>👤 {asset.allocated_to}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Since {new Date(asset.allocated_at).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
              )}
            </td>
            <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {asset.description || 'No description.'}
            </td>
            <td style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                <Button size="small" variant="ghost" onClick={() => handleOpenHistory(asset)}>
                  Log History
                </Button>

                {asset.status === 'available' && (isHrOrAdmin || isManager) && (
                  <Button size="small" variant="secondary" onClick={() => handleOpenAllocate(asset)}>
                    Allocate
                  </Button>
                )}

                {asset.status === 'allocated' && (isHrOrAdmin || isManager) && (
                  <Button size="small" variant="primary" onClick={() => handleReturnAsset(asset)}>
                    Log Return
                  </Button>
                )}

                {isHrOrAdmin && (
                  <>
                    <Button size="small" variant="ghost" onClick={() => handleOpenEditAsset(asset)}>
                      Edit
                    </Button>
                    <Button size="small" variant="danger" onClick={() => handleDeleteAsset(asset.id)}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      {/* Asset Form Modal */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title={selectedAsset ? 'Edit Inventory Details' : 'Add Hardware Device'}
        footer={null}
      >
        <form onSubmit={handleAssetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {formError && (
            <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--danger)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
              ⚠️ {formError}
            </div>
          )}

          <div className="form-group">
            <label>Device / Hardware Name</label>
            <input
              type="text"
              placeholder="MacBook Pro 16"
              value={assetForm.name}
              onChange={(e) => setAssetForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Serial Number (Unique)</label>
            <input
              type="text"
              placeholder="MAC-16-98210"
              value={assetForm.serial_number}
              onChange={(e) => setAssetForm(p => ({ ...p, serial_number: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Inventory Status</label>
            <select
              value={assetForm.status}
              onChange={(e) => setAssetForm(p => ({ ...p, status: e.target.value }))}
            >
              <option value="available">Available (In Storage)</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description / Technical Specifications</label>
            <textarea
              placeholder="Processor, RAM, configuration details..."
              value={assetForm.description}
              onChange={(e) => setAssetForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setIsAssetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Device
            </Button>
          </div>
        </form>
      </Modal>

      {/* Allocation Modal */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title={`Allocate "${selectedAsset?.name}" to Employee`}
        footer={null}
      >
        <form onSubmit={handleAllocateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {formError && (
            <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--danger)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
              ⚠️ {formError}
            </div>
          )}

          <div className="form-group">
            <label>Assign to Employee</label>
            <select
              value={allocateForm.employee_id}
              onChange={(e) => setAllocateForm(p => ({ ...p, employee_id: e.target.value }))}
              required
            >
              <option value="">-- Select Employee Profile --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.designation} - {emp.department_name})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Allocation Notes</label>
            <textarea
              placeholder="Workstation setups, tracking parameters, accessories included..."
              value={allocateForm.notes}
              onChange={(e) => setAllocateForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setIsAllocateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Allocate Device
            </Button>
          </div>
        </form>
      </Modal>

      {/* Allocation History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Allocation Log History: "${selectedAsset?.name}"`}
        footer={
          <Button variant="ghost" onClick={() => setIsHistoryModalOpen(false)}>
            Close Logs
          </Button>
        }
        size="large"
      >
        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Allocated At</th>
                <th>Returned At</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {allocationHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No allocation logs recorded for this device.
                  </td>
                </tr>
              ) : (
                allocationHistory.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{log.employee_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.employee_email}</div>
                    </td>
                    <td>{new Date(log.allocated_at).toLocaleString()}</td>
                    <td>
                      {log.returned_at ? (
                        <span className="status-badge success" style={{ fontSize: '11px' }}>
                          {new Date(log.returned_at).toLocaleString()}
                        </span>
                      ) : (
                        <span className="status-badge warning" style={{ fontSize: '11px' }}>
                          Active Assignment
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px' }}>{log.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
