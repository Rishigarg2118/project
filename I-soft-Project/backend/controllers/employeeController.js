/**
 * Employee Controller
 * Binds employee routing actions to the employeeService methods.
 */
import * as employeeService from '../services/employeeService.js';

export const getEmployees = async (req, res, next) => {
  try {
    const { search, department_id, page, limit, sort_by, sort_order } = req.query;
    const result = await employeeService.getEmployees({
      search,
      department_id,
      page,
      limit,
      sort_by,
      sort_order
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const employee = await employeeService.getEmployeeById(id);
    res.json({ employee });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body, req.user.id);
    res.status(201).json({ employee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  const { id } = req.params;
  try {
    const employee = await employeeService.updateEmployee(id, req.body, req.user.id);
    res.json({ employee });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  const { id } = req.params;
  try {
    await employeeService.deleteEmployee(id, req.user.id);
    res.json({ message: 'Employee profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};
