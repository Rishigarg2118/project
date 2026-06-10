import { useState } from 'react';
import axios from 'axios';

export default function useEmployee() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data.employees);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch employees list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeById = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/employees/${id}`);
      return res.data.employee;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch employee details.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (employeeData) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/employees', employeeData);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create employee profile.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (id, employeeData) => {
    setLoading(true);
    try {
      const res = await axios.put(`/api/employees/${id}`, employeeData);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to update employee profile.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id) => {
    setLoading(true);
    try {
      const res = await axios.delete(`/api/employees/${id}`);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to delete employee profile.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await axios.post('/api/employees/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data.url; // Returns the uploaded file URL
    } catch (err) {
      const errMsg = err.response?.data?.error || 'File upload failed.';
      throw new Error(errMsg);
    }
  };

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    fetchEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    uploadDocument,
  };
}
