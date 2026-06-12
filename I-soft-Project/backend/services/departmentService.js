/**
 * Department Service with Cache-Aside Pattern
 * Uses node-cache to cache stable master lists of departments for 5 minutes.
 */
import NodeCache from 'node-cache';
import * as repo from '../repositories/departmentRepository.js';
import logger from '../config/logger.js';

// Cache instance — TTL = 5 mins, checks expiry every 60s
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const CACHE_KEY = 'departments_list';

export const getDepartments = async () => {
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    logger.info('Cache HIT: Serving departments list from Node-Cache');
    return cached;
  }

  logger.info('Cache MISS: Fetching departments list from Database');
  const departments = await repo.findAll();
  cache.set(CACHE_KEY, departments);
  return departments;
};

export const getDepartmentById = async (id) => {
  return await repo.findById(id);
};

export const createDepartment = async (departmentName) => {
  const department = await repo.create(departmentName);
  invalidateCache();
  return department;
};

export const updateDepartment = async (id, departmentName) => {
  const department = await repo.update(id, departmentName);
  invalidateCache();
  return department;
};

export const deleteDepartment = async (id) => {
  const department = await repo.remove(id);
  invalidateCache();
  return department;
};

const invalidateCache = () => {
  cache.del(CACHE_KEY);
  logger.info('Cache INVALIDATED: Purged departments_list key from Node-Cache');
};
export default { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment };
