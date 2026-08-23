import express from 'express';
import pool from '../config/db.js';
import { OPENROUTER_API_KEY } from '../config/env.js';
import logger from '../config/logger.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/ai/chat
router.post('/chat', verifyToken, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Query database metrics for real-time AI context
    let employeeCount = 0;
    let deptCount = 0;
    let skillCount = 0;
    let assetCount = 0;

    try {
      const [empRes, deptRes, skillRes, assetRes] = await Promise.all([
        pool.query('SELECT COUNT(*)::INT AS count FROM employees'),
        pool.query('SELECT COUNT(*)::INT AS count FROM departments'),
        pool.query('SELECT COUNT(*)::INT AS count FROM skills'),
        pool.query('SELECT COUNT(*)::INT AS count FROM assets'),
      ]);

      employeeCount = empRes.rows[0]?.count || 0;
      deptCount = deptRes.rows[0]?.count || 0;
      skillCount = skillRes.rows[0]?.count || 0;
      assetCount = assetRes.rows[0]?.count || 0;
    } catch (dbErr) {
      logger.error('Failed to query stats for AI prompt context:', dbErr);
    }

    const systemPrompt = `You are the Rishi's Emp system AI Operations Agent, an intelligent assistant embedded in the Rishi's Emp system Enterprise Portal.
You help employees, HR, managers, and system administrators navigate and manage the portal.

Here is the database schema context of the system:
- users: Stores account credentials and roles (admin, hr, manager, user).
- departments: Department names (e.g. IT, HR, Finance, Marketing).
- skills: Skill listings (e.g. React, NodeJS, PostgreSQL).
- employees: Employee profiles linked to users and departments, tracking designation, phone, address, salary, and created_at.
- leave_balances: Tracks available leaves (sick, casual, earned) for each employee.
- leaves: Submissions for time off, status (pending, approved, rejected), and review notes.
- approval_history: Audit history trail of leave reviews.
- attendance: Clock-in/out logs, worked hours, geofenced location, and notes.
- assets: Hardware inventory (laptops, monitors, devices) and their status.
- asset_allocations: Tracks which hardware asset is assigned to which employee.

Here are the standard demo login credentials (password is '123456' for all except admin which is 'admin123'):
- Admin (Super User): rishigarg1290@gmail.com (pwd: admin123) or pranay@rishis-emp-system.com (pwd: 123456)
- Manager: rahul@rishis-emp-system.com
- HR: priya@rishis-emp-system.com
- Normal Employee: amit@rishis-emp-system.com

Real-time Database Status:
- Total Employees: ${employeeCount}
- Total Departments: ${deptCount}
- Total Skills: ${skillCount}
- Total Hardware Assets: ${assetCount}

Instructions:
- Provide assistance with clocking in/out, requesting leaves, allocating assets, managing employee profiles, or running SQL reports.
- Answer user queries in their preferred language (English, Hindi, or Hinglish).
- Keep answers professional, friendly, concise, and accurate.
- If the user asks for SQL queries, show clean Postgres SQL code using INNER JOINs and proper schema references.
`;

    // Structure messages for OpenRouter (OpenAI format)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text,
      })),
      { role: 'user', content: message },
    ];

    if (!OPENROUTER_API_KEY) {
      logger.warn('OPENROUTER_API_KEY is not configured. Falling back to Mock responses.');
      return res.json({
        reply: `[MOCK MODE] Hello! I received your message: "${message}". Please configure the OPENROUTER_API_KEY in the .env file to enable live AI responses.`,
      });
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:4566',
        'X-Title': "Rishi's Emp system",
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Using Gemini 2.5 Flash as requested / recommended
        messages,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I did not receive a response from the AI model.';

    return res.json({ reply });
  } catch (error) {
    logger.error('Error in AI Chat handler:', error);
    return res.status(500).json({ error: 'Failed to process AI chat request: ' + error.message });
  }
});

export default router;
