import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import pool from '../config/db.js';

describe('🌴 Leaves API Endpoints', () => {
  beforeEach(() => {
    pool.query = jest.fn();
  });

  describe('POST /api/v1/leaves/apply', () => {
    it('should block leave applications when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/apply')
        .send({
          leave_type: 'sick',
          start_date: '2026-06-20',
          end_date: '2026-06-22',
          reason: 'Medical recovery'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/leaves/balances', () => {
    it('should block balances lookups when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/leaves/balances');
      expect(res.statusCode).toBe(401);
    });
  });
});
