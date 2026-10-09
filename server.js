const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Home route
app.get("/", (req, res) => {
    res.send("Employee Management System is Running!");
});

// 1. Get all employees
app.get("/api/employees", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM employees");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Add employee
app.post("/api/employees", async (req, res) => {
    try {
        const { name, department, role, salary, join_date } = req.body;

        if (!name || !department || !role || salary === undefined || salary === "" || !join_date) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (Number(salary) < 0 || !Number.isFinite(Number(salary))) {
            return res.status(400).json({
                message: "Salary must be a valid non-negative number"
            });
        }

        const [result] = await db.query(
            `INSERT INTO employees (name, department, role, salary, join_date)
             VALUES (?, ?, ?, ?, ?)`,
            [name, department, role, Number(salary), join_date]
        );

        res.status(201).json({
            message: "Employee added successfully",
            id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update employee
app.put("/api/employees/:id", async (req, res) => {
    try {
        const { name, department, role, salary, join_date } = req.body;
        const { id } = req.params;

        if (!name || !department || !role || salary === undefined || salary === "" || !join_date) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (Number(salary) < 0 || !Number.isFinite(Number(salary))) {
            return res.status(400).json({
                message: "Salary must be a valid non-negative number"
            });
        }

        const [result] = await db.query(
            `UPDATE employees
             SET name = ?, department = ?, role = ?, salary = ?, join_date = ?
             WHERE id = ?`,
            [name, department, role, Number(salary), join_date, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json({ message: "Employee updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Delete employee
app.delete("/api/employees/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM employees WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
async function startServer() {
    try {
        const connection = await db.getConnection();
        console.log("MySQL Connected Successfully!");
        connection.release();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MySQL Connection Failed:", error.message);
    }
}

startServer();
      