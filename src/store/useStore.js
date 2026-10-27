import { useState } from 'react'

const STORAGE_KEY = 'ems_data_store_v1'

const INITIAL_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@demo.com', password: 'jane123', role: 'user' },
  { id: 3, name: 'Rahul Sharma', email: 'rahul@demo.com', password: 'user123', role: 'user' },
  { id: 4, name: 'Priya Verma', email: 'priya@demo.com', password: 'user123', role: 'user' },
]

const INITIAL_DEPTS = [
  { id: 1, department_name: 'Engineering & Tech' },
  { id: 2, department_name: 'Human Resources' },
  { id: 3, department_name: 'Product & Design' },
  { id: 4, department_name: 'Finance & Accounts' },
  { id: 5, department_name: 'Marketing & Sales' },
]

const INITIAL_SKILLS = [
  { id: 1, skill_name: 'React.js' },
  { id: 2, skill_name: 'Node.js' },
  { id: 3, skill_name: 'PostgreSQL' },
  { id: 4, skill_name: 'Python' },
  { id: 5, skill_name: 'UI/UX Design' },
  { id: 6, skill_name: 'TypeScript' },
  { id: 7, skill_name: 'DevOps & Docker' },
]

const INITIAL_EMPLOYEES = [
  {
    id: 1,
    user_id: 2,
    department_id: 1,
    phone: '9876543210',
    address: '42 Silicon Enclave, Tech Park',
    designation: 'Senior Frontend Engineer',
    salary: 95000,
    created_at: '2024-01-15T10:00:00',
    images: [
      { id: 1, label: 'Profile Photo', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
      { id: 2, label: 'Certificate', url: 'https://images.unsplash.com/photo-1589330694653-dad6d3240e2b?w=150' },
    ],
    skill_ids: [1, 2, 6],
  },
  {
    id: 2,
    user_id: 3,
    department_id: 1,
    phone: '9823456789',
    address: '15 Innovation Hub, Cyber City',
    designation: 'Lead Backend Developer',
    salary: 90000,
    created_at: '2024-02-10T11:30:00',
    images: [
      { id: 3, label: 'Profile Photo', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    ],
    skill_ids: [2, 3, 4],
  },
  {
    id: 3,
    user_id: 4,
    department_id: 2,
    phone: '9912345678',
    address: '88 Green Avenue, Central City',
    designation: 'HR & Talent Partner',
    salary: 75000,
    created_at: '2024-03-01T09:15:00',
    images: [
      { id: 4, label: 'Profile Photo', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    ],
    skill_ids: [5],
  },
]

function getInitialData() {
  if (typeof window === 'undefined') {
    return { users: INITIAL_USERS, depts: INITIAL_DEPTS, skills: INITIAL_SKILLS, employees: INITIAL_EMPLOYEES }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        users: parsed.users || INITIAL_USERS,
        depts: parsed.depts || INITIAL_DEPTS,
        skills: parsed.skills || INITIAL_SKILLS,
        employees: parsed.employees || INITIAL_EMPLOYEES,
      }
    }
  } catch (_) {}
  return { users: INITIAL_USERS, depts: INITIAL_DEPTS, skills: INITIAL_SKILLS, employees: INITIAL_EMPLOYEES }
}

function persistData(data) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (_) {}
}

export function useStore() {
  const initial = getInitialData()
  const [users, setUsers] = useState(initial.users)
  const [depts, setDepts] = useState(initial.depts)
  const [skills, setSkills] = useState(initial.skills)
  const [employees, setEmployees] = useState(initial.employees)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const saveAll = (u, d, s, e) => {
    persistData({ users: u, depts: d, skills: s, employees: e })
  }

  const loadData = () => {
    try {
      const saved = getInitialData()
      setUsers(saved.users)
      setDepts(saved.depts)
      setSkills(saved.skills)
      setEmployees(saved.employees)
    } catch (_) {}
  }

  const resetToDemoData = () => {
    setUsers(INITIAL_USERS)
    setDepts(INITIAL_DEPTS)
    setSkills(INITIAL_SKILLS)
    setEmployees(INITIAL_EMPLOYEES)
    saveAll(INITIAL_USERS, INITIAL_DEPTS, INITIAL_SKILLS, INITIAL_EMPLOYEES)
  }

  const addUser = (u) => {
    const nextUser = { ...u, id: u.id || Date.now() }
    setUsers((prev) => {
      const next = [...prev, nextUser]
      saveAll(next, depts, skills, employees)
      return next
    })
    return nextUser
  }

  const addDept = (deptName) => {
    setDepts((prev) => {
      const next = [...prev, { id: Date.now(), department_name: deptName }]
      saveAll(users, next, skills, employees)
      return next
    })
  }

  const deleteDept = (id) => {
    setDepts((prev) => {
      const next = prev.filter((d) => d.id !== id)
      saveAll(users, next, skills, employees)
      return next
    })
  }

  const addSkill = (skillName) => {
    setSkills((prev) => {
      const next = [...prev, { id: Date.now(), skill_name: skillName }]
      saveAll(users, depts, next, employees)
      return next
    })
  }

  const deleteSkill = (id) => {
    setSkills((prev) => {
      const next = prev.filter((s) => s.id !== id)
      saveAll(users, depts, next, employees)
      return next
    })
  }

  const addEmployee = (emp) => {
    setEmployees((prev) => {
      const next = [
        ...prev,
        {
          ...emp,
          id: Date.now(),
          created_at: new Date().toISOString(),
          salary: Number(emp.salary) || 0,
        },
      ]
      saveAll(users, depts, skills, next)
      return next
    })
  }

  const updateEmployee = (id, data) => {
    setEmployees((prev) => {
      const next = prev.map((e) =>
        e.id === id ? { ...e, ...data, salary: Number(data.salary ?? e.salary) || 0 } : e
      )
      saveAll(users, depts, skills, next)
      return next
    })
  }

  const deleteEmployee = (id) => {
    setEmployees((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveAll(users, depts, skills, next)
      return next
    })
  }

  const stats = {
    employees: employees.length,
    departments: depts.length,
    skills: skills.length,
    images: employees.reduce((a, e) => a + (e.images?.length || 0), 0),
  }

  return {
    users,
    depts,
    skills,
    employees,
    stats,
    loading,
    error,
    loadData,
    resetToDemoData,
    addUser,
    addDept,
    deleteDept,
    addSkill,
    deleteSkill,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  }
}
