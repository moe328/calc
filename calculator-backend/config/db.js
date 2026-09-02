const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config({ quiet: true });

const requiredVariables = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingVariables = requiredVariables.filter(
  (variableName) => !process.env[variableName]
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingVariables.join(
      ", "
    )}`
  );
}

const databasePort = Number(process.env.DB_PORT || 3306);

if (!Number.isInteger(databasePort) || databasePort < 1 || databasePort > 65535) {
  throw new Error("DB_PORT must be a valid TCP port number.");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: databasePort,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "local",
});

module.exports = pool;
