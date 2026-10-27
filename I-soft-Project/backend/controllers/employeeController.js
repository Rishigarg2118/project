/**
 * Employee Controller
 * Binds employee routing actions to the employeeService methods with strict RBAC data sanitation.
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

    // RBAC Data Privacy: Confidential payroll details (salary) are strictly restricted to Admin & HR
    const isHrOrAdmin = req.user?.role === 'admin' || req.user?.role === 'hr';
    if (!isHrOrAdmin && result?.employees) {
      result.employees = result.employees.map((emp) => {
        const { salary, ...publicProfile } = emp;
        return publicProfile;
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const employee = await employeeService.getEmployeeById(id);
    const isHrOrAdmin = req.user?.role === 'admin' || req.user?.role === 'hr';
    const isSelf = req.user?.id === employee?.user_id;

    // Non-HR/Non-Admin users can only view their own salary, never other employees' compensation
    if (!isHrOrAdmin && !isSelf && employee) {
      delete employee.salary;
    }

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
