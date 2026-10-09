/**
 * employeeController.js
 * Business logic for all employee CRUD operations.
 */

const pool = require('../config/db');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Allowed column names for sorting (whitelist — prevents SQL injection) */
const SORT_COLUMNS = new Set(['id', 'name', 'department', 'role', 'salary', 'join_date', 'created_at']);
const SORT_DIRS    = new Set(['ASC', 'DESC']);

/** ISO date string validation (YYYY-MM-DD) */
const isValidDate = (str) => {
  if (typeof str !== 'string') return false;
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d.getTime());
};

/** Validate & sanitise a create/update payload; returns { errors, data } */
const validatePayload = (body) => {
  const errors = [];
  const { name, department, role, salary, join_date } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0)
    errors.push('Name is required.');
  else if (name.trim().length > 150)
    errors.push('Name must be 150 characters or fewer.');

  if (!department || typeof department !== 'string' || department.trim().length === 0)
    errors.push('Department is required.');
  else if (department.trim().length > 100)
    errors.push('Department must be 100 characters or fewer.');

  if (!role || typeof role !== 'string' || role.trim().length === 0)
    errors.push('Role is required.');
  else if (role.trim().length > 100)
    errors.push('Role must be 100 characters or fewer.');

  const salaryNum = parseFloat(salary);
  if (salary === undefined || salary === null || salary === '')
    errors.push('Salary is required.');
  else if (isNaN(salaryNum) || salaryNum < 0)
    errors.push('Salary must be a valid non-negative number.');
  else if (salaryNum > 9999999999.99)
    errors.push('Salary value is too large.');

  if (!join_date)
    errors.push('Join date is required.');
  else if (!isValidDate(join_date))
    errors.push('Join date must be a valid date in YYYY-MM-DD format.');

  const data = errors.length === 0 ? {
    name:       name.trim(),
    department: department.trim(),
    role:       role.trim(),
    salary:     salaryNum,
    join_date,
  } : null;

  return { errors, data };
};

// ─────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────

/**
 * GET /api/employees
 * Query params: search, sortBy, order
 */
const getAllEmployees = async (req, res) => {
  try {
    let { search = '', sortBy = 'id', order = 'ASC' } = req.query;

    // Sanitise sort parameters against whitelists
    sortBy = SORT_COLUMNS.has(sortBy) ? sortBy : 'id';
    order  = SORT_DIRS.has(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

    let sql    = 'SELECT * FROM employees';
    const params = [];

    if (search.trim()) {
      sql += ' WHERE name LIKE ? OR department LIKE ? OR role LIKE ?';
      const like = `%${search.trim()}%`;
      params.push(like, like, like);
    }

    sql += ` ORDER BY ${sortBy} ${order}`;

    const [rows] = await pool.execute(sql, params);

    res.status(200).json({
      success: true,
      count:   rows.length,
      data:    rows,
    });
  } catch (err) {
    console.error('getAllEmployees error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching employees.' });
  }
};

/**
 * GET /api/employees/:id
 */
const getEmployeeById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0)
      return res.status(400).json({ success: false, message: 'Invalid employee ID.' });

    const [rows] = await pool.execute('SELECT * FROM employees WHERE id = ?', [id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: `Employee with ID ${id} not found.` });

    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getEmployeeById error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching employee.' });
  }
};

/**
 * POST /api/employees
 */
const createEmployee = async (req, res) => {
  try {
    const { errors, data } = validatePayload(req.body);
    if (errors.length > 0)
      return res.status(422).json({ success: false, message: 'Validation failed.', errors });

    const sql = `
      INSERT INTO employees (name, department, role, salary, join_date)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      data.name, data.department, data.role, data.salary, data.join_date,
    ]);

    const [rows] = await pool.execute('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Employee created successfully.', data: rows[0] });
  } catch (err) {
    console.error('createEmployee error:', err);
    res.status(500).json({ success: false, message: 'Server error while creating employee.' });
  }
};

/**
 * PUT /api/employees/:id
 */
const updateEmployee = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0)
      return res.status(400).json({ success: false, message: 'Invalid employee ID.' });

    // Check employee exists
    const [existing] = await pool.execute('SELECT id FROM employees WHERE id = ?', [id]);
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: `Employee with ID ${id} not found.` });

    const { errors, data } = validatePayload(req.body);
    if (errors.length > 0)
      return res.status(422).json({ success: false, message: 'Validation failed.', errors });

    const sql = `
      UPDATE employees
         SET name = ?, department = ?, role = ?, salary = ?, join_date = ?
       WHERE id = ?
    `;
    await pool.execute(sql, [
      data.name, data.department, data.role, data.salary, data.join_date, id,
    ]);

    const [rows] = await pool.execute('SELECT * FROM employees WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Employee updated successfully.', data: rows[0] });
  } catch (err) {
    console.error('updateEmployee error:', err);
    res.status(500).json({ success: false, message: 'Server error while updating employee.' });
  }
};

/**
 * DELETE /api/employees/:id
 */
const deleteEmployee = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0)
      return res.status(400).json({ success: false, message: 'Invalid employee ID.' });

    const [existing] = await pool.execute('SELECT id, name FROM employees WHERE id = ?', [id]);
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: `Employee with ID ${id} not found.` });

    await pool.execute('DELETE FROM employees WHERE id = ?', [id]);
    res.status(200).json({
      success: true,
      message: `Employee "${existing[0].name}" deleted successfully.`,
    });
  } catch (err) {
    console.error('deleteEmployee error:', err);
    res.status(500).json({ success: false, message: 'Server error while deleting employee.' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
