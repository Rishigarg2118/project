/**
 * Employee Service — Business Logic Layer for Profiles
 */
import * as repo from '../repositories/employeeRepository.js';
import * as userRepo from '../repositories/userRepository.js';
import { auditLog } from './auditService.js';
import pool from '../config/db.js';

export const getEmployees = async (filters) => {
  return await repo.findAll(filters);
};

export const getEmployeeById = async (id) => {
  const employee = await repo.findById(id);
  if (!employee) {
    const error = new Error('Employee profile not found');
    error.statusCode = 404;
    throw error;
  }
  return employee;
};

export const createEmployee = async (employeeData, performedBy) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Link user and update their role if provided
    if (employeeData.role) {
      await client.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        [employeeData.role, employeeData.user_id]
      );
    }

    const employee = await repo.create(employeeData);

    // Save linked skill mappings
    if (employeeData.skill_ids && employeeData.skill_ids.length > 0) {
      for (const sId of employeeData.skill_ids) {
        await client.query(
          'INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [employee.id, sId]
        );
      }
    }

    // Save uploaded images
    if (employeeData.images && employeeData.images.length > 0) {
      for (const img of employeeData.images) {
        await client.query(
          'INSERT INTO employee_images (employee_id, label, url) VALUES ($1, $2, $3)',
          [employee.id, img.label, img.url]
        );
      }
    }

    await auditLog(client, 'employees', 'INSERT', employee.id, null, employee, performedBy);
    
    await client.query('COMMIT');
    return employee;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateEmployee = async (id, employeeData, performedBy) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const oldEmployee = await repo.findById(id);
    if (!oldEmployee) {
      const error = new Error('Employee profile not found');
      error.statusCode = 404;
      throw error;
    }

    // Update user role if changed by admin
    if (employeeData.role) {
      await client.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        [employeeData.role, oldEmployee.user_id]
      );
    }

    const updated = await repo.update(id, employeeData);

    // Update skill links (remove old, write new)
    await client.query('DELETE FROM employee_skills WHERE employee_id = $1', [id]);
    if (employeeData.skill_ids && employeeData.skill_ids.length > 0) {
      for (const sId of employeeData.skill_ids) {
        await client.query(
          'INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, sId]
        );
      }
    }

    // Update images
    await client.query('DELETE FROM employee_images WHERE employee_id = $1', [id]);
    if (employeeData.images && employeeData.images.length > 0) {
      for (const img of employeeData.images) {
        await client.query(
          'INSERT INTO employee_images (employee_id, label, url) VALUES ($1, $2, $3)',
          [id, img.label, img.url]
        );
      }
    }

    const newEmployee = await repo.findById(id);
    await auditLog(client, 'employees', 'UPDATE', id, oldEmployee, newEmployee, performedBy);

    await client.query('COMMIT');
    return newEmployee;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const deleteEmployee = async (id, performedBy) => {
  const oldEmployee = await repo.findById(id);
  if (!oldEmployee) {
    const error = new Error('Employee profile not found');
    error.statusCode = 404;
    throw error;
  }

  const deleted = await repo.remove(id);
  await auditLog(null, 'employees', 'DELETE', id, oldEmployee, null, performedBy);
  return deleted;
};
