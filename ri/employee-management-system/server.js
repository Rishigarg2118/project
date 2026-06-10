import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pg from 'pg'

const { Pool } = pg
const app = express()
const port = process.env.PORT || 4000
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/employee_db'

const databaseUrl = new URL(DATABASE_URL)
const DATABASE_NAME = databaseUrl.pathname?.replace('/', '') || 'employee_db'
const ADMIN_DATABASE_URL = new URL(DATABASE_URL)
ADMIN_DATABASE_URL.pathname = '/postgres'

async function ensureDatabaseExists() {
  if (!DATABASE_NAME) return

  const adminPool = new Pool({ connectionString: ADMIN_DATABASE_URL.toString() })
  try {
    await adminPool.query(`CREATE DATABASE "${DATABASE_NAME}"`)
  } catch (err) {
    if (err.code !== '42P04') {
      throw err
    }
  } finally {
    await adminPool.end()
  }
}

await ensureDatabaseExists()
const pool = new Pool({ connectionString: DATABASE_URL })

app.use(cors({ origin: 'http://localhost:5174' }))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Backend is running. Use /api/* endpoints for requests.')
})

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      department_name TEXT NOT NULL UNIQUE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      skill_name TEXT NOT NULL UNIQUE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      department_id INTEGER REFERENCES departments(id),
      phone TEXT,
      address TEXT,
      designation TEXT,
      salary NUMERIC(12,2),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_images (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      label TEXT,
      url TEXT
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_skills (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE
    )
  `)

  await pool.query(`
    INSERT INTO users (name, email, password, role)
    VALUES
      ('Admin User', 'admin@demo.com', 'admin123', 'admin'),
      ('Jane Smith', 'jane@demo.com', 'jane123', 'user')
    ON CONFLICT (email) DO NOTHING
  `)

  await pool.query(`
    INSERT INTO departments (department_name)
    VALUES
      ('IT'),
      ('HR'),
      ('Finance'),
      ('Marketing')
    ON CONFLICT (department_name) DO NOTHING
  `)

  await pool.query(`
    INSERT INTO skills (skill_name)
    VALUES
      ('React'),
      ('NodeJS'),
      ('PostgreSQL'),
      ('Python'),
      ('Java')
    ON CONFLICT (skill_name) DO NOTHING
  `)

  const existingEmployees = await pool.query('SELECT id FROM employees LIMIT 1')
  if (existingEmployees.rowCount === 0) {
    const userRows = await pool.query('SELECT id, email FROM users WHERE email = ANY($1)', [[ 'admin@demo.com', 'jane@demo.com' ]])
    const deptRows = await pool.query('SELECT id, department_name FROM departments WHERE department_name = ANY($1)', [[ 'IT', 'HR' ]])
    const skillsRows = await pool.query('SELECT id, skill_name FROM skills WHERE skill_name = ANY($1)', [[ 'React', 'NodeJS', 'PostgreSQL', 'Python', 'Java' ]])

    const admin = userRows.rows.find((u) => u.email === 'admin@demo.com')
    const jane = userRows.rows.find((u) => u.email === 'jane@demo.com')
    const it = deptRows.rows.find((d) => d.department_name === 'IT')
    const hr = deptRows.rows.find((d) => d.department_name === 'HR')
    const reactSkill = skillsRows.rows.find((s) => s.skill_name === 'React')
    const nodeSkill = skillsRows.rows.find((s) => s.skill_name === 'NodeJS')
    const pgSkill = skillsRows.rows.find((s) => s.skill_name === 'PostgreSQL')
    const pySkill = skillsRows.rows.find((s) => s.skill_name === 'Python')
    const javaSkill = skillsRows.rows.find((s) => s.skill_name === 'Java')

    const employee1 = await pool.query(
      `INSERT INTO employees (user_id, department_id, phone, address, designation, salary, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [jane.id, it.id, '9876543210', '123 MG Road, Gwalior', 'Senior Developer', 85000, '2024-01-15T10:00:00']
    )

    const employee2 = await pool.query(
      `INSERT INTO employees (user_id, department_id, phone, address, designation, salary, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [admin.id, hr.id, '9123456780', '45 Nehru Nagar, Delhi', 'HR Manager', 68000, '2023-11-06T12:30:00']
    )

    await pool.query(
      `INSERT INTO employee_images (employee_id, label, url)
       VALUES
         ($1, 'Profile Photo', 'https://i.pravatar.cc/150?img=47'),
         ($1, 'Aadhar Card', 'https://i.pravatar.cc/150?img=48')`,
      [employee1.rows[0].id]
    )

    await pool.query(
      `INSERT INTO employee_images (employee_id, label, url)
       VALUES ($1, 'Profile Photo', 'https://i.pravatar.cc/150?img=32')`,
      [employee2.rows[0].id]
    )

    await pool.query(
      `INSERT INTO employee_skills (employee_id, skill_id)
       VALUES
         ($1, $2),
         ($1, $3),
         ($1, $4)`,
      [employee1.rows[0].id, reactSkill.id, nodeSkill.id, pgSkill.id]
    )

    await pool.query(
      `INSERT INTO employee_skills (employee_id, skill_id)
       VALUES ($1, $2), ($1, $3)`,
      [employee2.rows[0].id, pySkill.id, javaSkill.id]
    )
  }
}

async function getEmployees() {
  const employeesRes = await pool.query('SELECT * FROM employees ORDER BY id')

  const employees = []
  for (const emp of employeesRes.rows) {
    const imagesRes = await pool.query(
      'SELECT id, label, url FROM employee_images WHERE employee_id = $1 ORDER BY id',
      [emp.id]
    )

    const skillRows = await pool.query(
      'SELECT skill_id FROM employee_skills WHERE employee_id = $1 ORDER BY id',
      [emp.id]
    )

    employees.push({
      ...emp,
      salary: Number(emp.salary),
      images: imagesRes.rows,
      skill_ids: skillRows.rows.map((row) => row.skill_id),
    })
  }

  return employees
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: true })
  } catch (err) {
    res.status(500).json({ status: 'error', database: false, message: err.message })
  }
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  const result = await pool.query(
    'SELECT id, name, email, role FROM users WHERE email = $1 AND password = $2 LIMIT 1',
    [email, password]
  )

  const user = result.rows[0]
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  return res.json({ role: user.role, token: 'demo-token', user })
})

app.get('/api/users', async (req, res) => {
  const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY id')
  res.json({ users: result.rows })
})

app.get('/api/departments', async (req, res) => {
  const result = await pool.query('SELECT id, department_name FROM departments ORDER BY id')
  res.json({ departments: result.rows })
})

app.get('/api/skills', async (req, res) => {
  const result = await pool.query('SELECT id, skill_name FROM skills ORDER BY id')
  res.json({ skills: result.rows })
})

app.get('/api/employees', async (req, res) => {
  const employees = await getEmployees()
  res.json({ employees })
})

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })
