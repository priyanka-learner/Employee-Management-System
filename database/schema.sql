-- ============================================================
-- Employee Management System - Database Schema
-- ============================================================

-- Create the database
CREATE DATABASE IF NOT EXISTS employee_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Use the database
USE employee_management;

-- Drop table if it already exists (for clean re-runs)
DROP TABLE IF EXISTS employees;

-- Create employees table
CREATE TABLE employees (
  id          INT           NOT NULL AUTO_INCREMENT,
  name        VARCHAR(150)  NOT NULL,
  department  VARCHAR(100)  NOT NULL,
  role        VARCHAR(100)  NOT NULL,
  salary      DECIMAL(12,2) NOT NULL CHECK (salary >= 0),
  join_date   DATE          NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- Seed data — remove or modify as needed
-- ---------------------------------------------------------------
INSERT INTO employees (name, department, role, salary, join_date) VALUES
  ('Alice Johnson',   'Engineering',      'Senior Software Engineer', 95000.00, '2021-03-15'),
  ('Bob Martinez',    'Human Resources',  'HR Manager',               72000.00, '2019-07-01'),
  ('Carol Williams',  'Finance',          'Financial Analyst',         68000.00, '2022-01-10'),
  ('David Lee',       'Engineering',      'DevOps Engineer',           88000.00, '2020-11-20'),
  ('Eva Chen',        'Marketing',        'Marketing Specialist',      62000.00, '2023-04-05'),
  ('Frank Davis',     'Sales',            'Sales Executive',           58000.00, '2021-09-18'),
  ('Grace Kim',       'Engineering',      'Frontend Developer',        82000.00, '2022-06-30'),
  ('Henry Wilson',    'Operations',       'Operations Manager',        75000.00, '2018-12-01');
