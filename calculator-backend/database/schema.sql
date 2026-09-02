CREATE DATABASE IF NOT EXISTS calculator_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE calculator_db;

CREATE TABLE IF NOT EXISTS calculations_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  num1 DECIMAL(10,4) NOT NULL,
  num2 DECIMAL(10,4) NOT NULL,
  operator VARCHAR(5) NOT NULL,
  result DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_calculations_operator
    CHECK (operator IN ('+', '-', '*', '/')),
  INDEX idx_calculations_history_created_at (created_at, id)
) ENGINE=InnoDB;
