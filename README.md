# 🏥 Hospital Ward Management System

A full-stack web application for managing hospital wards, patient admissions, bed allocation, transfers, equipment, and staff — built as a Final Year Project.

> 🎓 **Beginner-Friendly Codebase** — Every file in this project is written to be readable by a first or second year CS student. All logic is clearly commented, variable names are descriptive, and no advanced tricks are used.

---

## 🛠️ Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Frontend   | React (Vite)        |
| Backend    | Node.js + Express   |
| Database   | MySQL               |
| Auth       | JWT                 |

---

## 📁 Project Structure

```
WartManagementSysytem/
├── client/          # React frontend (Vite)
├── server/          # Node.js + Express backend
├── docs/            # Requirements, schema, and spec documents
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# In /server, copy the example and fill in your values
cp .env.example .env
```

### 3. Set Up Database

```bash
# Run the SQL schema against your MySQL instance
mysql -u root -p ward_management_db < server/database/schema.sql
```

### 4. Run Development Servers

```bash
# Start backend (from /server)
npm run dev

# Start frontend (from /client)
npm run dev
```

---

## 👥 Roles

| Role       | Access Level                          |
|------------|---------------------------------------|
| `admin`    | Full system access                    |
| `wardAdmin`| Manage assigned ward, staff, beds     |
| `staff`    | Admit, transfer, discharge patients   |
| `doctor`   | View patients and log vitals          |
