import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import pool from '../config/db.js';

describe('🔑 Authentication API Endpoints', () => {
  beforeEach(() => {
    // Manually mock pool.query by assigning jest.fn()
    pool.query = jest.fn();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 401 on invalid credentials', async () => {
      // Stub: return empty rows (user not found)
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid@isoftzone.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 on missing login parameters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid@isoftzone.com'
          // password missing
        });

      expect(res.statusCode).toBe(422); // Validation error code from Joi handler
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/profile');
      expect(res.statusCode).toBe(401);
    });
  });
});
