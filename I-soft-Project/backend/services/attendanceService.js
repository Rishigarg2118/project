/**
 * Attendance Service Layer — business flows for daily clock-ins
 * Utilizes attendanceRepository for DB lookups.
 */
import * as repo from '../repositories/attendanceRepository.js';

export const checkIn = async (employeeId, location, notes) => {
  const activeRecord = await repo.findActiveCheckIn(employeeId);
  if (activeRecord) {
    throw new Error('Employee is already checked in.');
  }
  return await repo.createCheckIn(employeeId, location, notes);
};

export const checkOut = async (employeeId, notes) => {
  const activeRecord = await repo.findActiveCheckIn(employeeId);
  if (!activeRecord) {
    throw new Error('No active check-in found for this employee.');
  }

  const checkInTime = new Date(activeRecord.check_in_time);
  const checkOutTime = new Date();
  
  // Calculate worked hours (rounded to 2 decimal places)
  const diffMs = checkOutTime - checkInTime;
  const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  return await repo.updateCheckOut(activeRecord.id, hours, notes);
};

export const getAttendanceLog = async (employeeId, filters) => {
  return await repo.getLogs(employeeId, filters);
};

export const getTodayStatus = async (employeeId) => {
  const record = await repo.getTodayStatus(employeeId);
  if (!record) {
    return { checkedIn: false, record: null };
  }
  return {
    checkedIn: record.check_out_time === null,
    record,
  };
};
export default { checkIn, checkOut, getAttendanceLog, getTodayStatus };
