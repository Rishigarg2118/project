import { useState } from 'react'

const INITIAL_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'admin' },
]

const INITIAL_DEPTS = []

const INITIAL_SKILLS = []

const INITIAL_EMPLOYEES = []

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
