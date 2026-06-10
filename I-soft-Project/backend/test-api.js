import axios from 'axios';

const BASE = 'http://localhost:4000';

try {
  const loginRes = await axios.post(`${BASE}/api/auth/login`, {
    email: 'admin@demo.com',
    password: 'admin123'
  });

  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  const [depts, skills, emps] = await Promise.all([
    axios.get(`${BASE}/api/departments`, { headers }),
    axios.get(`${BASE}/api/skills`, { headers }),
    axios.get(`${BASE}/api/employees`, { headers })
  ]);

  console.log('✅ Departments:', depts.data.departments.length, depts.data.departments.map(d => d.department_name).join(', '));
  console.log('✅ Skills:', skills.data.skills.length, skills.data.skills.map(s => s.skill_name).join(', '));
  console.log('✅ Employees:', emps.data.employees.length);
  
  let totalImages = 0;
  emps.data.employees.forEach(e => { if (Array.isArray(e.images)) totalImages += e.images.length; });
  console.log('✅ Total Images:', totalImages);

  console.log('\n🎉 All API endpoints verified successfully!');
} catch (err) {
  console.error('❌ API test failed:', err.response?.data || err.message);
}
