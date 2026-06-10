# Employee Profile Management System

A full-featured React + Vite frontend for managing employee profiles, departments, skills, and document uploads.

## Features

- **Login / Signup** with role-based access (admin / user)
- **Dashboard** with stat cards and SQL JOIN query reference
- **Employee CRUD** — Create, Read, Update, Delete employees
- **Multi-Image Upload** — Up to 5 images per employee (Profile Photo, Aadhar Card, Resume, Certificate)
- **Department Master** — Add / remove departments
- **Skills Master** — Add / remove skills (Many-to-Many assignment)
- **My Profile** — View your own employee record

## Tech Stack

- React 18
- Vite 5
- Pure CSS-in-JS (no external UI library)

## Getting Started

### 1. Clone / open the folder in VS Code

```bash
cd employee-management-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Demo Credentials

| Role  | Email            | Password  |
|-------|------------------|-----------|
| Admin | admin@demo.com   | admin123  |
| User  | jane@demo.com    | jane123   |

## Project Structure

```
employee-management-system/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx          # Entry point
    ├── App.jsx           # Root component + routing
    ├── index.css         # Global styles & CSS variables
    ├── store/
    │   └── useStore.js   # In-memory data store (replace with API calls)
    ├── components/
    │   ├── UI.jsx        # Btn, Card, Tag
    │   └── Sidebar.jsx   # Navigation sidebar
    └── pages/
        ├── AuthPage.jsx
        ├── Dashboard.jsx
        ├── EmployeeList.jsx
        ├── EmployeeForm.jsx
        ├── DepartmentPage.jsx
        ├── SkillsPage.jsx
        └── ProfilePage.jsx
```

## Database Schema (Backend Reference)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(100)
);

CREATE TABLE employee_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    department_id INT REFERENCES departments(id),
    phone VARCHAR(20),
    address TEXT,
    designation VARCHAR(100),
    salary NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_images (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employee_profiles(id),
    image_url TEXT
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100)
);

CREATE TABLE employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employee_profiles(id),
    skill_id INT REFERENCES skills(id)
);
```

## Deployment

- **Backend**: Render (Node/Express + PostgreSQL on Neon)
- **Frontend**: Vercel (import this repo, framework = React/Vite)
