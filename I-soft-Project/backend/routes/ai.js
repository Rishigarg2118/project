import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { OPENROUTER_API_KEY, JWT_SECRET } from '../config/env.js';
import logger from '../config/logger.js';

const router = express.Router();

// Optional authentication middleware: attaches user if token valid, but allows guest access
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && token !== 'null' && token !== 'undefined') {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Non-fatal for public chat
      logger.debug('Token invalid in AI chat, continuing as guest');
    }
  }
  next();
};

// POST /api/v1/ai/chat
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userName = req.user?.name || 'Portal User';
    const userRole = req.user?.role || 'Guest';

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

    const systemPrompt = `You are Rishi's Emp system AI Operations Agent, an intelligent assistant inside the Enterprise Employee Management Portal System.
You are assisting ${userName} (Role: ${userRole}).

System Context & Database Stats:
- Registered Employees: ${employeeCount}
- Departments: ${deptCount}
- Active Technical Skills: ${skillCount}
- Tracked Hardware Assets: ${assetCount}

Portal Features:
1. Employee Directory: Full employee profiles, skill assignments, document uploads.
2. Geofenced Attendance: Secure clock-in and clock-out with geolocation coordinates.
3. Hardware Asset Registry: Track and assign company laptops, monitors, accessories.
4. Leave Operations: Apply for sick/casual/earned leaves, manager approvals, audit trails.
5. Reports & Analytics: Export departmental, attendance, and leave reports.

Instructions:
- Be helpful, conversational, professional, and friendly.
- Keep answers concise and informative (2-4 paragraphs or bullet points).
- If asked for SQL queries, provide clean, idiomatic PostgreSQL queries using proper JOINs.
- If asked about company policies, explain portal features like clock-in, leave requests, and asset tracking.
`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((h) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text,
      })),
      { role: 'user', content: message.trim() },
    ];

    // Try calling OpenRouter AI with google/gemini-2.5-flash-lite
    if (OPENROUTER_API_KEY) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:4566',
            'X-Title': "Rishi's Emp system",
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: formattedMessages,
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim()) {
            return res.json({ reply: reply.trim() });
          }
        } else {
          const errText = await response.text();
          logger.warn(`OpenRouter returned status ${response.status}: ${errText}`);
        }
      } catch (aiErr) {
        logger.warn('OpenRouter request error, switching to fallback engine:', aiErr.message);
      }
    }

    // High quality intelligent fallback engine if external API is unreachable
    const lower = message.toLowerCase();
    let reply = '';

    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      reply = `Hello ${userName}! 👋 I am your Rishi's Emp system AI Operations Agent. Our system currently tracks **${employeeCount} employees** across **${deptCount} departments** with **${assetCount} assets**. How can I help you today? You can ask about clocking in, leave balances, or sample SQL reports.`;
    } else if (lower.includes('employee') || lower.includes('staff')) {
      reply = `There are currently **${employeeCount} active employees** registered in the system. You can view, search, and manage personnel profiles in the **Employee Directory** tab.`;
    } else if (lower.includes('department') || lower.includes('dept')) {
      reply = `The organization has **${deptCount} configured departments**. You can add new business units or modify existing departments in the **Department Master** section.`;
    } else if (lower.includes('asset') || lower.includes('hardware') || lower.includes('laptop')) {
      reply = `We are tracking **${assetCount} hardware assets** in the registry. Head to **Hardware Assets** to inspect allocation statuses, assign machines to developers, or log device returns.`;
    } else if (lower.includes('attendance') || lower.includes('clock')) {
      reply = `To record your attendance, navigate to **Clock In / Out**. The portal captures your geofenced coordinates to ensure compliance with company location policies.`;
    } else if (lower.includes('leave') || lower.includes('vacation')) {
      reply = `You can submit time-off applications under **Leave Balance**. Managers and HR administrators can review and approve submissions in the **Leave Review** portal.`;
    } else if (lower.includes('sql') || lower.includes('query')) {
      reply = `Here is a sample PostgreSQL query to list employees with their department and assigned skills:
\`\`\`sql
SELECT u.name, d.department_name, ep.designation, s.skill_name
FROM employees ep
JOIN users u ON ep.user_id = u.id
JOIN departments d ON ep.department_id = d.id
LEFT JOIN employee_skills es ON es.employee_id = ep.id
LEFT JOIN skills s ON es.skill_id = s.id;
\`\`\``;
    } else {
      reply = `Thank you for your question, ${userName}. As your Operations Assistant, I can help you with employee records (${employeeCount} active), departments (${deptCount}), hardware inventory (${assetCount} assets), or attendance rules. How would you like to proceed?`;
    }

    return res.json({ reply });
  } catch (error) {
    logger.error('Error in AI Chat handler:', error);
    return res.status(500).json({ error: 'Failed to process AI chat request: ' + error.message });
  }
});

export default router;
