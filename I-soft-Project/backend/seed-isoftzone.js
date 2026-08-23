/**
 * Rishi's Emp system Technologies Pvt Ltd — Full Dataset Seeder
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
  console.log('\n🌱 Rishi's Emp system Technologies Pvt Ltd — Seeding dataset...\n');

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
      { name: 'Rishi Garg',     email: 'rishigarg1290@gmail.com', password: 'admin123', role: 'admin' },
      { name: 'Pranay Gupta',   email: 'pranay@rishis-emp-system.com',  password: '123456', role: 'admin' },
      { name: 'Rahul Sharma',   email: 'rahul@rishis-emp-system.com',   password: '123456', role: 'manager' },
      { name: 'Priya Verma',    email: 'priya@rishis-emp-system.com',   password: '123456', role: 'hr' },
      { name: 'Amit Patel',     email: 'amit@rishis-emp-system.com',    password: '123456', role: 'employee' },
      { name: 'Neha Jain',      email: 'neha@rishis-emp-system.com',    password: '123456', role: 'employee' },
      { name: 'Rohit Singh',    email: 'rohit@rishis-emp-system.com',   password: '123456', role: 'employee' },
      { name: 'Anjali Gupta',   email: 'anjali@rishis-emp-system.com',  password: '123456', role: 'employee' },
      { name: 'Vikas Mehta',    email: 'vikas@rishis-emp-system.com',   password: '123456', role: 'employee' },
      { name: 'Pooja Shah',     email: 'pooja@rishis-emp-system.com',   password: '123456', role: 'employee' },
      { name: 'Sandeep Kumar',  email: 'sandeep@rishis-emp-system.com', password: '123456', role: 'employee' },
    ];

    const hashedUsers = await Promise.all(
      usersData.map(async u => ({
        ...u,
        hash: await bcrypt.hash(u.password, 12)
      }))
    );

    const userRes = await client.query(
      `INSERT INTO users (name, email, password, role, requires_password_reset)
       SELECT name, email, password, role, TRUE
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
      { email: 'rishigarg1290@gmail.com', dept: 'Software Development', phone: '9876543220', address: 'Gwalior', designation: 'Engineering Lead',   salary: 160000 },
      { email: 'pranay@rishis-emp-system.com',  dept: 'Software Development', phone: '9876543210', address: 'Indore', designation: 'Director',            salary: 150000 },
      { email: 'rahul@rishis-emp-system.com',   dept: 'Software Development', phone: '9876543211', address: 'Indore', designation: 'Project Manager',     salary: 85000  },
      { email: 'priya@rishis-emp-system.com',   dept: 'Human Resources',      phone: '9876543212', address: 'Indore', designation: 'HR Manager',          salary: 70000  },
      { email: 'amit@rishis-emp-system.com',    dept: 'Software Development', phone: '9876543213', address: 'Indore', designation: 'React Developer',     salary: 45000  },
      { email: 'neha@rishis-emp-system.com',    dept: 'Software Development', phone: '9876543214', address: 'Indore', designation: 'Node Developer',      salary: 50000  },
      { email: 'rohit@rishis-emp-system.com',   dept: 'Quality Assurance',    phone: '9876543215', address: 'Indore', designation: 'QA Engineer',         salary: 40000  },
      { email: 'anjali@rishis-emp-system.com',  dept: 'Digital Marketing',    phone: '9876543216', address: 'Indore', designation: 'Marketing Executive', salary: 35000  },
      { email: 'vikas@rishis-emp-system.com',   dept: 'Sales',                phone: '9876543217', address: 'Indore', designation: 'Sales Executive',     salary: 38000  },
      { email: 'pooja@rishis-emp-system.com',   dept: 'Technical Support',    phone: '9876543218', address: 'Indore', designation: 'Support Engineer',    salary: 32000  },
      { email: 'sandeep@rishis-emp-system.com', dept: 'Finance',              phone: '9876543219', address: 'Indore', designation: 'Accountant',          salary: 42000  },
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
      { email: 'amit@rishis-emp-system.com',    skillNames: ['React', 'JavaScript', 'HTML'] },
      { email: 'neha@rishis-emp-system.com',    skillNames: ['NodeJS', 'PostgreSQL', 'JavaScript'] },
      { email: 'rohit@rishis-emp-system.com',   skillNames: ['Testing'] },
      { email: 'anjali@rishis-emp-system.com',  skillNames: ['JavaScript'] },
      { email: 'vikas@rishis-emp-system.com',   skillNames: ['Salesforce'] },
      { email: 'pooja@rishis-emp-system.com',   skillNames: ['NodeJS', 'PostgreSQL'] },
      { email: 'sandeep@rishis-emp-system.com', skillNames: ['Python'] },
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
      { email: 'rishigarg1290@gmail.com', casual: 12, sick: 10, earned: 15 },
      { email: 'amit@rishis-emp-system.com',   casual: 10, sick: 8,  earned: 15 },
      { email: 'neha@rishis-emp-system.com',   casual: 12, sick: 10, earned: 15 },
      { email: 'rohit@rishis-emp-system.com',  casual: 8,  sick: 6,  earned: 15 },
      { email: 'anjali@rishis-emp-system.com', casual: 10, sick: 7,  earned: 15 },
      { email: 'vikas@rishis-emp-system.com',  casual: 12, sick: 10, earned: 15 },
      // Give balances to all employees for completeness
      { email: 'pranay@rishis-emp-system.com',  casual: 12, sick: 10, earned: 15 },
      { email: 'rahul@rishis-emp-system.com',   casual: 12, sick: 10, earned: 15 },
      { email: 'priya@rishis-emp-system.com',   casual: 12, sick: 10, earned: 15 },
      { email: 'pooja@rishis-emp-system.com',   casual: 12, sick: 10, earned: 15 },
      { email: 'sandeep@rishis-emp-system.com', casual: 12, sick: 10, earned: 15 },
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
      { email: 'amit@rishis-emp-system.com',   type: 'casual', from: '2026-06-01', to: '2026-06-03', reason: 'Family Function', status: 'approved' },
      { email: 'neha@rishis-emp-system.com',   type: 'sick',   from: '2026-06-10', to: '2026-06-11', reason: 'Fever',           status: 'pending'  },
      { email: 'rohit@rishis-emp-system.com',  type: 'casual', from: '2026-05-20', to: '2026-05-21', reason: 'Personal Work',   status: 'approved' },
      { email: 'anjali@rishis-emp-system.com', type: 'casual', from: '2026-06-15', to: '2026-06-17', reason: 'Travel',          status: 'pending'  },
      { email: 'vikas@rishis-emp-system.com',  type: 'sick',   from: '2026-06-18', to: '2026-06-20', reason: 'Medical',         status: 'rejected' },
    ];

    // reviewer_id for approved/rejected = rahul (manager)
    const rahulId = userByEmail['rahul@rishis-emp-system.com'];
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
    const rahulUserId = userByEmail['rahul@rishis-emp-system.com'];
    const priyaUserId = userByEmail['priya@rishis-emp-system.com'];

    const approvedLeave1 = leaveIds.find(l => l.email === 'amit@rishis-emp-system.com');
    const approvedLeave3 = leaveIds.find(l => l.email === 'rohit@rishis-emp-system.com');
    const rejectedLeave5 = leaveIds.find(l => l.email === 'vikas@rishis-emp-system.com');

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

    // ─── 10. HARDWARE INVENTORY (Assets & Allocations) ────────────────────────
    console.log('\n💻 Seeding hardware assets and allocations...');
    
    // Define 10 assets
    const assetsData = [
      { name: 'MacBook Pro 16', serial: 'MAC-16-11001', status: 'allocated', desc: 'Apple M3 Max, 36GB RAM, 1TB SSD', email: 'rishigarg1290@gmail.com', notes: 'Engineering Lead setup' },
      { name: 'MacBook Air 15', serial: 'MAC-15-11002', status: 'allocated', desc: 'Apple M3, 16GB RAM, 512GB SSD', email: 'amit@rishis-emp-system.com', notes: 'React Developer setup' },
      { name: 'ThinkPad X1 Carbon', serial: 'LEN-TP-11003', status: 'allocated', desc: 'Intel Core Ultra 7, 32GB RAM, 1TB SSD', email: 'rahul@rishis-emp-system.com', notes: 'Project Manager setup' },
      { name: 'Dell Latitude 5440', serial: 'DEL-LT-11004', status: 'allocated', desc: 'Intel Core i5, 16GB RAM, 512GB SSD', email: 'priya@rishis-emp-system.com', notes: 'HR Laptop' },
      { name: 'ThinkPad E16', serial: 'LEN-TP-11005', status: 'allocated', desc: 'AMD Ryzen 5, 16GB RAM, 512GB SSD', email: 'neha@rishis-emp-system.com', notes: 'Node Developer setup' },
      { name: 'Dell UltraSharp 27 Monitor', serial: 'DEL-MON-11006', status: 'available', desc: '4K USB-C Hub Monitor', email: null, notes: null },
      { name: 'iPad Pro 11', serial: 'APL-IPD-11007', status: 'available', desc: 'Apple M2 chip, 256GB WiFi', email: null, notes: null },
      { name: 'Logitech MX Master 3S', serial: 'LOG-MS-11008', status: 'available', desc: 'Ergonomic Wireless Mouse', email: null, notes: null },
      { name: 'ThinkPad T14 Gen 4', serial: 'LEN-TP-11009', status: 'maintenance', desc: 'Broken screen panel replacement pending', email: null, notes: null },
      { name: 'Dell Thunderbolt Dock WD22TB4', serial: 'DEL-DCK-11010', status: 'available', desc: 'Thunderbolt 4 Docking Station', email: null, notes: null }
    ];

    for (const a of assetsData) {
      const res = await client.query(
        `INSERT INTO assets (name, serial_number, status, description)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [a.name, a.serial, a.status, a.desc]
      );
      const assetId = res.rows[0].id;
      
      if (a.status === 'allocated' && a.email) {
        const empId = empIds[a.email];
        if (empId) {
          await client.query(
            `INSERT INTO asset_allocations (asset_id, employee_id, notes, allocated_at)
             VALUES ($1, $2, $3, NOW() - INTERVAL '30 days')`,
            [assetId, empId, a.notes]
          );
        }
      }
    }
    console.log('  ✅ Seeded 10 hardware assets and active allocations successfully');

    // ─── 11. ATTENDANCE SEEDING ───────────────────────────────────────────────
    console.log('\n⏰ Seeding realistic attendance logs...');
    // Seed attendance records for the last 7 days for all employees
    const today = new Date();
    for (const email of Object.keys(empIds)) {
      const empId = empIds[email];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        // Skip weekends for realistic data
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        // Randomize check-in time: between 08:30 and 10:15
        const checkInHour = 8.5 + Math.random() * 1.75; // 8.50 to 10.25
        const checkInMin = Math.floor((checkInHour % 1) * 60);
        const checkInHr = Math.floor(checkInHour);
        
        const checkInDate = new Date(date);
        checkInDate.setHours(checkInHr, checkInMin, 0, 0);
        
        // Randomize check-out time: between 17:00 and 19:30
        const checkOutHour = 17.0 + Math.random() * 2.5; // 17.00 to 19.50
        const checkOutMin = Math.floor((checkOutHour % 1) * 60);
        const checkOutHr = Math.floor(checkOutHour);
        
        const checkOutDate = new Date(date);
        checkOutDate.setHours(checkOutHr, checkOutMin, 0, 0);
        
        const workedHours = parseFloat((checkOutHour - checkInHour).toFixed(2));
        const location = Math.random() > 0.3 ? 'Office - Noida' : 'Remote - Home';
        const notes = 'Daily check-in/out';
        
        await client.query(
          `INSERT INTO attendance (employee_id, check_in_time, check_out_time, location, notes, worked_hours)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [empId, checkInDate, checkOutDate, location, notes, workedHours]
        );
      }
    }
    console.log('  ✅ Seeding of attendance records completed successfully');

    // ─── COMMIT ───────────────────────────────────────────────────────────────
    await client.query('COMMIT');

    console.log('\n' + '═'.repeat(55));
    console.log('  🎉 Rishi's Emp system Dataset Successfully Seeded!');
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
    console.log('  Admin   → pranay@rishis-emp-system.com');
    console.log('  Manager → rahul@rishis-emp-system.com');
    console.log('  HR      → priya@rishis-emp-system.com');
    console.log('  Employee→ amit@rishis-emp-system.com (React Dev)');
    console.log('  Employee→ neha@rishis-emp-system.com (Node Dev)');
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
