import { useState } from 'react';
import axios from 'axios';

export default function useLeave() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/leaves/my');
      setLeaves(res.data.leaves);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBalances = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/leaves/balances');
      setBalances(res.data.balances);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load leave balances');
    } finally {
      setLoading(false);
    }
  };

  const applyLeave = async (leaveData) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/leaves/apply', leaveData);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to apply for leave';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveQueue = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/leaves/queue');
      return res.data.leaves;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load leave queue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reviewLeave = async (leaveId, reviewData) => {
    setLoading(true);
    try {
      const res = await axios.put(`/api/leaves/review/${leaveId}`, reviewData);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to review leave application';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    leaves,
    balances,
    loading,
    error,
    fetchMyLeaves,
    fetchMyBalances,
    applyLeave,
    fetchLeaveQueue,
    reviewLeave,
  };
}
