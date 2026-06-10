import { useState } from 'react'

const INITIAL_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@demo.com', password: 'jane123', role: 'user' },
]

const INITIAL_DEPTS = [
  { id: 1, department_name: 'IT' },
  { id: 2, department_name: 'HR' },
  { id: 3, department_name: 'Finance' },
  { id: 4, department_name: 'Marketing' },
]

const INITIAL_SKILLS = [
  { id: 1, skill_name: 'React' },
  { id: 2, skill_name: 'NodeJS' },
  { id: 3, skill_name: 'PostgreSQL' },
  { id: 4, skill_name: 'Python' },
  { id: 5, skill_name: 'Java' },
]

const INITIAL_EMPLOYEES = [
  {
    id: 1,
    user_id: 2,
    department_id: 1,
    phone: '9876543210',
    address: '123 MG Road, Gwalior',
    designation: 'Senior Developer',
    salary: 85000,
    created_at: '2024-01-15T10:00:00',
    images: [
      { id: 1, label: 'Profile Photo', url: 'https://i.pravatar.cc/150?img=47' },
      { id: 2, label: 'Aadhar Card', url: 'https://i.pravatar.cc/150?img=48' },
    ],
    skill_ids: [1, 2, 3],
  },
]

export function useStore() {
  const [users, setUsers] = useState(INITIAL_USERS)
  const [depts, setDepts] = useState(INITIAL_DEPTS)
  const [skills, setSkills] = useState(INITIAL_SKILLS)
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES)

  const addUser = (u) => setUsers((p) => [...p, { ...u, id: Date.now() }])
  const addDept = (d) => setDepts((p) => [...p, { id: Date.now(), department_name: d }])
  const addSkill = (s) => setSkills((p) => [...p, { id: Date.now(), skill_name: s }])
  const deleteDept = (id) => setDepts((p) => p.filter((d) => d.id !== id))
  const deleteSkill = (id) => setSkills((p) => p.filter((s) => s.id !== id))

  const addEmployee = (e) =>
    setEmployees((p) => [...p, { ...e, id: Date.now(), created_at: new Date().toISOString() }])
  const updateEmployee = (id, data) =>
    setEmployees((p) => p.map((e) => (e.id === id ? { ...e, ...data } : e)))
  const deleteEmployee = (id) => setEmployees((p) => p.filter((e) => e.id !== id))

  const stats = {
    employees: employees.length,
    departments: depts.length,
    skills: skills.length,
    images: employees.reduce((a, e) => a + (e.images?.length || 0), 0),
  }

  return {
    users, depts, skills, employees, stats,
    addUser, addDept, addSkill, deleteDept, deleteSkill,
    addEmployee, updateEmployee, deleteEmployee,
  }
}
