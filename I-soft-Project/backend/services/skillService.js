/**
 * Skill Service with Cache-Aside Pattern
 * Uses node-cache to cache stable master lists of skills for 5 minutes.
 */
import NodeCache from 'node-cache';
import * as repo from '../repositories/skillRepository.js';
import logger from '../config/logger.js';

// Cache instance — TTL = 5 mins, checks expiry every 60s
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const CACHE_KEY = 'skills_list';

export const getSkills = async () => {
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    logger.info('Cache HIT: Serving skills list from Node-Cache');
    return cached;
  }

  logger.info('Cache MISS: Fetching skills list from Database');
  const skills = await repo.findAll();
  cache.set(CACHE_KEY, skills);
  return skills;
};

export const getSkillById = async (id) => {
  return await repo.findById(id);
};

export const createSkill = async (skillName) => {
  const skill = await repo.create(skillName);
  invalidateCache();
  return skill;
};

export const updateSkill = async (id, skillName) => {
  const skill = await repo.update(id, skillName);
  invalidateCache();
  return skill;
};

export const deleteSkill = async (id) => {
  const skill = await repo.remove(id);
  invalidateCache();
  return skill;
};

const invalidateCache = () => {
  cache.del(CACHE_KEY);
  logger.info('Cache INVALIDATED: Purged skills_list key from Node-Cache');
};
export default { getSkills, getSkillById, createSkill, updateSkill, deleteSkill };
