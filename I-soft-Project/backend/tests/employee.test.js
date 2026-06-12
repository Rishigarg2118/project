import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import pool from '../config/db.js';

describe('👥 Employee API Endpoints', () => {
  beforeEach(() => {
    pool.query = jest.fn();
  });

  describe('GET /api/v1/employees', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/employees');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/employees/:id', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/employees/1');
      expect(res.statusCode).toBe(401);
    });
  });
});
