/**
 * employeeRoutes.js
 * Maps HTTP verbs + paths to controller functions.
 */

const express    = require('express');
const router     = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');

// GET  /api/employees        — list all (with optional search & sort)
router.get('/',    getAllEmployees);

// GET  /api/employees/:id    — get one employee
router.get('/:id', getEmployeeById);

// POST /api/employees        — create a new employee
router.post('/',   createEmployee);

// PUT  /api/employees/:id    — update an existing employee
router.put('/:id', updateEmployee);

// DELETE /api/employees/:id  — delete an employee
router.delete('/:id', deleteEmployee);

module.exports = router;
