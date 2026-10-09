# 👥 Employee Management System

> Week 2 — Task 2 | Full-Stack CRUD Application

A complete **HR Employee Management System** built with a plain HTML/CSS/JavaScript frontend, a Node.js/Express REST API backend, and a MySQL database. HR administrators can add, view, search, sort, edit, and delete employee records through a professional, responsive dashboard.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Add Employee** | Form with full client-side and server-side validation |
| **View Employees** | Responsive table with all employee details |
| **Search** | Live search by name, department, or role |
| **Sort** | Sort by ID, name, department, role, salary, or join date (ASC/DESC) |
| **Edit Employee** | Pre-filled modal with PUT API integration |
| **Delete Employee** | Confirmation modal before permanent deletion |
| **Loading States** | Spinner while fetching/saving/deleting |
| **Success/Error Messages** | Toast notifications for all operations |
| **Empty State** | Friendly message when no records exist |
| **Responsive Design** | Works on desktop, tablet, and mobile |
| **Salary Display** | Formatted in Indian Rupees (₹) using `Intl.NumberFormat` with `en-IN` locale |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Node.js 16+, Express.js 4 |
| Database | MySQL 8+ |
| API Style | REST (JSON) |
| HTTP Client | Fetch API (browser built-in) |
| API Testing | Postman |

---

## 📁 Project Structure

```
employee-management-system/
│
├── frontend/
│   ├── index.html          ← Dashboard UI
│   ├── style.css           ← Styles (no frameworks)
│   └── script.js           ← All frontend logic
│
├── backend/
│   ├── server.js           ← Express app entry point
│   ├── package.json        ← Node dependencies
│   ├── .env                ← Local environment variables (git-ignored)
│   ├── .env.example        ← Template for .env
│   ├── config/
│   │   └── db.js           ← MySQL connection pool
│   ├── routes/
│   │   └── employeeRoutes.js
│   └── controllers/
│       └── employeeController.js
│
├── database/
│   └── schema.sql          ← Create DB, table, and seed data
│
├── postman/
│   └── Employee-Management-API.postman_collection.json
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Setup

### Prerequisites

- MySQL 8.0 or newer installed and running.

### Steps

1. Open a MySQL client (MySQL Workbench, DBeaver, or the CLI).
2. Run the schema file:

```sql
SOURCE path/to/employee-management-system/database/schema.sql;
```

Or via the CLI:

```bash
mysql -u root -p < database/schema.sql
```

This will:
- Create the `employee_management` database.
- Create the `employees` table.
- Insert 8 sample employees as seed data.

### employees table schema

| Column | Type | Notes |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary key |
| name | VARCHAR(150) | Required |
| department | VARCHAR(100) | Required |
| role | VARCHAR(100) | Required |
| salary | DECIMAL(12,2) | Required, ≥ 0 — displayed as ₹ (INR) in the UI |
| join_date | DATE | Required |
| created_at | TIMESTAMP | Auto-set on insert |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=employee_management

# Server
PORT=5000
```

> ⚠️ Never commit `.env` to version control. It is already listed in `.gitignore`.

---

## 🚀 Backend Installation & Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
# Copy the example and set your database password
cp .env.example .env
```

Edit `.env` with your MySQL credentials.

### 3. Start the server

```bash
# Production (Node)
npm start

# Development (auto-restart with nodemon)
npm run dev
```

Expected output:

```
✅  MySQL connected  →  localhost:3306/employee_management
🚀  Server running on http://localhost:5000
📋  API base URL : http://localhost:5000/api/employees
```

---

## 🌐 Running the Frontend

The frontend is a static site — no build step required.

**Option A — Open directly:**

Navigate to `frontend/index.html` and open it in a browser.

**Option B — VS Code Live Server:**

Right-click `frontend/index.html` → *Open with Live Server*.

> The frontend calls `http://localhost:5000` — make sure the backend is running first.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/employees` | Get all employees |
| `GET` | `/api/employees?search=X` | Search by name/dept/role |
| `GET` | `/api/employees?sortBy=salary&order=DESC` | Sort |
| `GET` | `/api/employees/:id` | Get one employee |
| `POST` | `/api/employees` | Create employee |
| `PUT` | `/api/employees/:id` | Update employee |
| `DELETE` | `/api/employees/:id` | Delete employee |

### Request body (POST / PUT)

```json
{
  "name": "Jane Smith",
  "department": "Engineering",
  "role": "Full Stack Developer",
  "salary": 92000,
  "join_date": "2024-01-15"
}
```

### Success response (POST 201)

```json
{
  "success": true,
  "message": "Employee created successfully.",
  "data": {
    "id": 9,
    "name": "Jane Smith",
    "department": "Engineering",
    "role": "Full Stack Developer",
    "salary": 92000,
    "join_date": "2024-01-15T00:00:00.000Z",
    "created_at": "2024-10-07T12:00:00.000Z"
  }
}
```

### Error response (422)

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    "Name is required.",
    "Salary must be a valid non-negative number."
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (invalid ID) |
| 404 | Not Found |
| 422 | Unprocessable Entity (validation) |
| 500 | Internal Server Error |

---

## 🧪 Postman Testing

1. Open Postman.
2. Click **Import** → select `postman/Employee-Management-API.postman_collection.json`.
3. Set the collection variable `baseUrl` to `http://localhost:5000` (already set).
4. Run requests in order:
   - **Create** (POST) — saves the new `employeeId` to collection variable automatically.
   - **Get All** — returns all employees.
   - **Search / Sort** — uses query parameters.
   - **Get by ID** — uses `{{employeeId}}`.
   - **Update** (PUT) — updates the created employee.
   - **Delete** — removes the employee.

Each request includes built-in test scripts that verify status codes and response structure.

---

## 🔄 CRUD Operations

| Operation | Frontend | API |
|---|---|---|
| **Create** | Fill form → Add Employee | POST /api/employees |
| **Read** | Table auto-loads on page open | GET /api/employees |
| **Update** | Click Edit → Modify → Save | PUT /api/employees/:id |
| **Delete** | Click Delete → Confirm | DELETE /api/employees/:id |

---

## ✅ Validation & Error Handling

### Client-side (frontend/script.js)

- All fields validated before submission.
- Inline error messages per field.
- Invalid fields highlighted in red.
- Form will not submit if any validation fails.

### Server-side (employeeController.js)

- All fields re-validated independently of the client.
- Salary checked for numeric type and non-negative value.
- Date validated with regex and `Date` constructor.
- String length limits enforced.
- SQL injection prevented via parameterised queries.
- Sort column and direction validated against whitelists.

---

## 📸 Screenshots

> *(Add screenshots here after running the application)*

- [ ] Dashboard — full view
- [ ] Add Employee form
- [ ] Employee table with records
- [ ] Edit modal pre-filled
- [ ] Delete confirmation modal
- [ ] Search results
- [ ] Mobile view

---

## 👤 Author

Built as part of an internship assignment — Week 2, Task 2.
