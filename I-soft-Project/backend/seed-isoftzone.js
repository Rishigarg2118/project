/**
 * i-SOFTZONE Technologies Pvt Ltd — Full Dataset Seeder
 * 
 * Maps the curriculum dataset to our actual DB schema:
 *   employee_profiles → employees
 *   leave_applications → leaves
 *   leave_balance (with leave_type_id) → leave_balances (flat columns)
 * 
 * Run: node seed-isoftzone.js
 */
import pool from './config/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  const client = await pool.connect();
  console.log('\n🌱 i-SOFTZONE Technologies Pvt Ltd — Seeding dataset...\n');

  try {
    await client.query('BEGIN');

    // ─── 1. CLEAR existing data (preserve table structure) ───────────────────
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM approval_history');
    await client.query('DELETE FROM leaves');
    await client.query('DELETE FROM leave_balances');
    await client.query('DELETE FROM attendance');
    await client.query('DELETE FROM asset_allocations');
    await client.query('DELETE FROM assets');
    await client.query('DELETE FROM employee_images');
    await client.query('DELETE FROM employee_skills');
    await client.query('DELETE FROM employees');
    await client.query('DELETE FROM skills');
    await client.query('DELETE FROM departments');
    await client.query('DELETE FROM users');
    // Reset all sequences
    await client.query(`SELECT setval('users_id_seq', 1, false)`);
    await client.query(`SELECT setval('departments_id_seq', 1, false)`);
    await client.query(`SELECT setval('skills_id_seq', 1, false)`);
    await client.query(`SELECT setval('employees_id_seq', 1, false)`);
    await client.query(`SELECT setval('leaves_id_seq', 1, false)`);
    await client.query(`SELECT setval('leave_balances_id_seq', 1, false)`);
    await client.query(`SELECT setval('approval_history_id_seq', 1, false)`);
    console.log('  ✅ Cleared all tables and reset sequences\n');

    // ─── 2. DEPARTMENTS ───────────────────────────────────────────────────────
    console.log('🏢 Inserting 8 departments...');
    const deptNames = [
      'Software Development',  // id: 1
      'Quality Assurance',     // id: 2
      'Human Resources',       // id: 3
      'Finance',               // id: 4
      'Digital Marketing',     // id: 5
      'Sales',                 // id: 6
      'Operations',            // id: 7
      'Technical Support'      // id: 8
    ];
    const deptRes = await client.query(
      `INSERT INTO departments (department_name)
       SELECT unnest($1::text[])
       RETURNING id, department_name`,
      [deptNames]
    );
    const dept = {};
    deptRes.rows.forEach(d => dept[d.department_name] = d.id);
    console.log('  ✅ Departments:', Object.keys(dept).join(', '));

    // ─── 3. SKILLS ────────────────────────────────────────────────────────────
    console.log('\n🛠️  Inserting 10 skills...');
    const skillNames = [
      'React',       // id: 1
      'NodeJS',      // id: 2
      'PostgreSQL',  // id: 3
      'JavaScript',  // id: 4
      'HTML',        // id: 5
      'CSS',         // id: 6
      'MongoDB',     // id: 7
      'Python',      // id: 8
      'Testing',     // id: 9
      'Salesforce'   // id: 10
    ];
    const skillRes = await client.query(
      `INSERT INTO skills (skill_name)
       SELECT unnest($1::text[])
       RETURNING id, skill_name`,
      [skillNames]
    );
    const skill = {};
    skillRes.rows.forEach(s => skill[s.skill_name] = s.id);
    console.log('  ✅ Skills:', Object.keys(skill).join(', '));

    // ─── 4. USERS (with bcrypt-hashed passwords) ─────────────────────────────
    console.log('\n👥 Inserting 10 users (hashing passwords with bcrypt)...');
    const usersData = [
      { name: 'Pranay Gupta',   email: 'pranay@isoftzone.com',  password: '123456', role: 'admin' },
      { name: 'Rahul Sharma',   email: 'rahul@isoftzone.com',   password: '123456', role: 'manager' },
      { name: 'Priya Verma',    email: 'priya@isoftzone.com',   password: '123456', role: 'hr' },
      { name: 'Amit Patel',     email: 'amit@isoftzone.com',    password: '123456', role: 'employee' },
      { name: 'Neha Jain',      email: 'neha@isoftzone.com',    password: '123456', role: 'employee' },
      { name: 'Rohit Singh',    email: 'rohit@isoftzone.com',   password: '123456', role: 'employee' },
      { name: 'Anjali Gupta',   email: 'anjali@isoftzone.com',  password: '123456', role: 'employee' },
      { name: 'Vikas Mehta',    email: 'vikas@isoftzone.com',   password: '123456', role: 'employee' },
      { name: 'Pooja Shah',     email: 'pooja@isoftzone.com',   password: '123456', role: 'employee' },
      { name: 'Sandeep Kumar',  email: 'sandeep@isoftzone.com', password: '123456', role: 'employee' },
    ];

    const hashedUsers = await Promise.all(
      usersData.map(async u => ({
        ...u,
        hash: await bcrypt.hash(u.password, 10)
      }))
    );

    const userRes = await client.query(
      `INSERT INTO users (name, email, password, role)
       SELECT name, email, password, role
       FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[])
         AS t(name, email, password, role)
       RETURNING id, email, name, role`,
      [
        hashedUsers.map(u => u.name),
        hashedUsers.map(u => u.email),
        hashedUsers.map(u => u.hash),
        hashedUsers.map(u => u.role),
      ]
    );
    const userByEmail = {};
    userRes.rows.forEach(u => userByEmail[u.email] = u.id);
    console.log('  ✅ Users inserted:', userRes.rows.map(u => `${u.name}(${u.role})`).join(', '));

    // ─── 5. EMPLOYEES (mapped from employee_profiles dataset) ────────────────
    console.log('\n👤 Inserting 10 employee profiles...');
    // user_id references, department_id references match dataset order
    const empData = [
      { email: 'pranay@isoftzone.com',  dept: 'Software Development', phone: '9876543210', address: 'Indore', designation: 'Director',            salary: 150000 },
      { email: 'rahul@isoftzone.com',   dept: 'Software Development', phone: '9876543211', address: 'Indore', designation: 'Project Manager',     salary: 85000  },
      { email: 'priya@isoftzone.com',   dept: 'Human Resources',      phone: '9876543212', address: 'Indore', designation: 'HR Manager',          salary: 70000  },
      { email: 'amit@isoftzone.com',    dept: 'Software Development', phone: '9876543213', address: 'Indore', designation: 'React Developer',     salary: 45000  },
      { email: 'neha@isoftzone.com',    dept: 'Software Development', phone: '9876543214', address: 'Indore', designation: 'Node Developer',      salary: 50000  },
      { email: 'rohit@isoftzone.com',   dept: 'Quality Assurance',    phone: '9876543215', address: 'Indore', designation: 'QA Engineer',         salary: 40000  },
      { email: 'anjali@isoftzone.com',  dept: 'Digital Marketing',    phone: '9876543216', address: 'Indore', designation: 'Marketing Executive', salary: 35000  },
      { email: 'vikas@isoftzone.com',   dept: 'Sales',                phone: '9876543217', address: 'Indore', designation: 'Sales Executive',     salary: 38000  },
      { email: 'pooja@isoftzone.com',   dept: 'Technical Support',    phone: '9876543218', address: 'Indore', designation: 'Support Engineer',    salary: 32000  },
      { email: 'sandeep@isoftzone.com', dept: 'Finance',              phone: '9876543219', address: 'Indore', designation: 'Accountant',          salary: 42000  },
    ];

    const empIds = {};  // empIds[email] = employee.id
    for (const e of empData) {
      const userId = userByEmail[e.email];
      const deptId = dept[e.dept];
      const res = await client.query(
        `INSERT INTO employees (user_id, department_id, phone, address, designation, salary)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, deptId, e.phone, e.address, e.designation, e.salary]
      );
      empIds[e.email] = res.rows[0].id;
    }
    console.log('  ✅ Employee profiles created:', Object.keys(empIds).length);

    // ─── 6. EMPLOYEE SKILLS ───────────────────────────────────────────────────
    console.log('\n🎯 Inserting employee skills...');
    // Dataset: (emp_seq_id, skill_id) — emp ids 4..10 map to our emails
    const empSkillMap = [
      { email: 'amit@isoftzone.com',    skillNames: ['React', 'JavaScript', 'HTML'] },
      { email: 'neha@isoftzone.com',    skillNames: ['NodeJS', 'PostgreSQL', 'JavaScript'] },
      { email: 'rohit@isoftzone.com',   skillNames: ['Testing'] },
      { email: 'anjali@isoftzone.com',  skillNames: ['JavaScript'] },
      { email: 'vikas@isoftzone.com',   skillNames: ['Salesforce'] },
      { email: 'pooja@isoftzone.com',   skillNames: ['NodeJS', 'PostgreSQL'] },
      { email: 'sandeep@isoftzone.com', skillNames: ['Python'] },
    ];

    for (const es of empSkillMap) {
      const empId = empIds[es.email];
      for (const sName of es.skillNames) {
        await client.query(
          `INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [empId, skill[sName]]
        );
      }
    }
    console.log('  ✅ Employee skills linked');

    // ─── 7. LEAVE BALANCES (flat columns — sick, casual, earned) ─────────────
    // Dataset uses leave_type_id 1=Casual(12), 2=Sick(10)
    // We map to our flat schema: casual_leaves, sick_leaves, earned_leaves
    console.log('\n🗓️  Inserting leave balances...');
    const leaveBalanceData = [
      { email: 'amit@isoftzone.com',   casual: 10, sick: 8,  earned: 15 },
      { email: 'neha@isoftzone.com',   casual: 12, sick: 10, earned: 15 },
      { email: 'rohit@isoftzone.com',  casual: 8,  sick: 6,  earned: 15 },
      { email: 'anjali@isoftzone.com', casual: 10, sick: 7,  earned: 15 },
      { email: 'vikas@isoftzone.com',  casual: 12, sick: 10, earned: 15 },
      // Give balances to all employees for completeness
      { email: 'pranay@isoftzone.com',  casual: 12, sick: 10, earned: 15 },
      { email: 'rahul@isoftzone.com',   casual: 12, sick: 10, earned: 15 },
      { email: 'priya@isoftzone.com',   casual: 12, sick: 10, earned: 15 },
      { email: 'pooja@isoftzone.com',   casual: 12, sick: 10, earned: 15 },
      { email: 'sandeep@isoftzone.com', casual: 12, sick: 10, earned: 15 },
    ];
    for (const lb of leaveBalanceData) {
      const empId = empIds[lb.email];
      await client.query(
        `INSERT INTO leave_balances (employee_id, casual_leaves, sick_leaves, earned_leaves)
         VALUES ($1, $2, $3, $4) ON CONFLICT (employee_id) DO UPDATE
         SET casual_leaves=$2, sick_leaves=$3, earned_leaves=$4`,
        [empId, lb.casual, lb.sick, lb.earned]
      );
    }
    console.log('  ✅ Leave balances set for all 10 employees');

    // ─── 8. LEAVES (leave_applications mapped to leaves table) ───────────────
    console.log('\n📋 Inserting leave applications...');
    // Dataset uses employee_id 4-8 (positional) → our emails map in same order
    // leave_type_id 1=Casual → 'casual', 2=Sick → 'sick'
    const leaveTypeMap = { 1: 'casual', 2: 'sick', 3: 'earned', 4: 'casual' };
    const leaveApps = [
      { email: 'amit@isoftzone.com',   type: 'casual', from: '2026-06-01', to: '2026-06-03', reason: 'Family Function', status: 'approved' },
      { email: 'neha@isoftzone.com',   type: 'sick',   from: '2026-06-10', to: '2026-06-11', reason: 'Fever',           status: 'pending'  },
      { email: 'rohit@isoftzone.com',  type: 'casual', from: '2026-05-20', to: '2026-05-21', reason: 'Personal Work',   status: 'approved' },
      { email: 'anjali@isoftzone.com', type: 'casual', from: '2026-06-15', to: '2026-06-17', reason: 'Travel',          status: 'pending'  },
      { email: 'vikas@isoftzone.com',  type: 'sick',   from: '2026-06-18', to: '2026-06-20', reason: 'Medical',         status: 'rejected' },
    ];

    // reviewer_id for approved/rejected = rahul (manager)
    const rahulId = userByEmail['rahul@isoftzone.com'];
    const leaveIds = [];

    for (const la of leaveApps) {
      const empId = empIds[la.email];
      const reviewedBy = la.status !== 'pending' ? rahulId : null;
      const reviewNotes = la.status === 'approved' ? 'Approved by manager' :
                          la.status === 'rejected' ? 'Insufficient reason' : null;

      const res = await client.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status, reviewed_by, review_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [empId, la.type, la.from, la.to, la.reason, la.status, reviewedBy, reviewNotes]
      );
      leaveIds.push({ leaveId: res.rows[0].id, ...la });
    }
    console.log('  ✅ Leave applications inserted:', leaveApps.length);

    // ─── 9. APPROVAL HISTORY ─────────────────────────────────────────────────
    console.log('\n📝 Inserting approval history (audit trail)...');
    // Dataset: leave 1 (Amit - approved), leave 3 (Rohit - approved), leave 5 (Vikas - rejected)
    const rahulUserId = userByEmail['rahul@isoftzone.com'];
    const priyaUserId = userByEmail['priya@isoftzone.com'];

    const approvedLeave1 = leaveIds.find(l => l.email === 'amit@isoftzone.com');
    const approvedLeave3 = leaveIds.find(l => l.email === 'rohit@isoftzone.com');
    const rejectedLeave5 = leaveIds.find(l => l.email === 'vikas@isoftzone.com');

    // Leave 1 — Amit: Manager Approved, then HR Approved
    await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, action, remarks, created_at)
       VALUES ($1, $2, 'approved', 'Manager Approved', NOW() - INTERVAL '9 days')`,
      [approvedLeave1.leaveId, rahulUserId]
    );
    await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, action, remarks, created_at)
       VALUES ($1, $2, 'approved', 'HR Approved', NOW() - INTERVAL '9 days' + INTERVAL '2 hours')`,
      [approvedLeave1.leaveId, priyaUserId]
    );

    // Leave 3 — Rohit: Manager Approved, then HR Approved
    await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, action, remarks, created_at)
       VALUES ($1, $2, 'approved', 'Manager Approved', NOW() - INTERVAL '21 days')`,
      [approvedLeave3.leaveId, rahulUserId]
    );
    await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, action, remarks, created_at)
       VALUES ($1, $2, 'approved', 'HR Approved', NOW() - INTERVAL '21 days' + INTERVAL '1 hour')`,
      [approvedLeave3.leaveId, priyaUserId]
    );

    // Leave 5 — Vikas: Rejected
    await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, action, remarks, created_at)
       VALUES ($1, $2, 'rejected', 'Insufficient Reason', NOW() - INTERVAL '1 day')`,
      [rejectedLeave5.leaveId, rahulUserId]
    );
    console.log('  ✅ Approval history (5 audit log entries) inserted');

    // ─── COMMIT ───────────────────────────────────────────────────────────────
    await client.query('COMMIT');

    console.log('\n' + '═'.repeat(55));
    console.log('  🎉 i-SOFTZONE Dataset Successfully Seeded!');
    console.log('═'.repeat(55));
    console.log('\n📊 Dashboard Expected Output:');
    console.log('  Total Employees      : 10');
    console.log('  Total Departments    : 8');
    console.log('  Total Skills         : 10');
    console.log('  Pending Leaves       : 2');
    console.log('  Approved Leaves      : 2');
    console.log('  Rejected Leaves      : 1');
    console.log('  Total Salary Expense : ₹5,87,000');
    console.log('\n🔑 Login Credentials (password: 123456 for all):');
    console.log('  Admin   → pranay@isoftzone.com');
    console.log('  Manager → rahul@isoftzone.com');
    console.log('  HR      → priya@isoftzone.com');
    console.log('  Employee→ amit@isoftzone.com (React Dev)');
    console.log('  Employee→ neha@isoftzone.com (Node Dev)');
    console.log('═'.repeat(55) + '\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seeding failed, rolled back:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
