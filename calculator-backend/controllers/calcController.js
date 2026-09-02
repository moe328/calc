const pool = require("../config/db");

const ALLOWED_OPERATORS = new Set(["+", "-", "*", "/"]);
const DECIMAL_SCALE = 4;
const DECIMAL_FACTOR = 10 ** DECIMAL_SCALE;
const MAX_DECIMAL_VALUE = 999999.9999;

function hasAtMostFourDecimalPlaces(value) {
  const scaledValue = value * DECIMAL_FACTOR;
  const tolerance =
    Number.EPSILON * Math.max(1, Math.abs(scaledValue)) * DECIMAL_SCALE;

  return Math.abs(scaledValue - Math.round(scaledValue)) <= tolerance;
}

function validateOperand(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return `${fieldName} must be a finite number.`;
  }

  if (Math.abs(value) > MAX_DECIMAL_VALUE) {
    return `${fieldName} must be between -${MAX_DECIMAL_VALUE} and ${MAX_DECIMAL_VALUE}.`;
  }

  if (!hasAtMostFourDecimalPlaces(value)) {
    return `${fieldName} must have no more than four decimal places.`;
  }

  return null;
}

function performCalculation(num1, num2, operator) {
  switch (operator) {
    case "+":
      return num1 + num2;
    case "-":
      return num1 - num2;
    case "*":
      return num1 * num2;
    case "/":
      return num1 / num2;
    default:
      return Number.NaN;
  }
}

function roundToFourDecimalPlaces(value) {
  const roundedValue = Number(value.toFixed(DECIMAL_SCALE));
  return Object.is(roundedValue, -0) ? 0 : roundedValue;
}

async function calculate(req, res, next) {
  try {
    const { num1, num2, operator } = req.body || {};
    const num1Error = validateOperand(num1, "num1");
    const num2Error = validateOperand(num2, "num2");

    if (num1Error || num2Error) {
      return res.status(400).json({
        success: false,
        error: num1Error || num2Error,
      });
    }

    if (!ALLOWED_OPERATORS.has(operator)) {
      return res.status(400).json({
        success: false,
        error: 'operator must be one of "+", "-", "*", or "/".',
      });
    }

    if (operator === "/" && num2 === 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot divide by zero.",
      });
    }

    const rawResult = performCalculation(num1, num2, operator);

    if (!Number.isFinite(rawResult)) {
      return res.status(400).json({
        success: false,
        error: "The calculation did not produce a finite result.",
      });
    }

    const result = roundToFourDecimalPlaces(rawResult);

    if (Math.abs(result) > MAX_DECIMAL_VALUE) {
      return res.status(400).json({
        success: false,
        error: "The result is outside the supported DECIMAL(10,4) range.",
      });
    }

    const [insertResult] = await pool.execute(
      `INSERT INTO calculations_history (num1, num2, operator, result)
       VALUES (?, ?, ?, ?)`,
      [
        num1.toFixed(DECIMAL_SCALE),
        num2.toFixed(DECIMAL_SCALE),
        operator,
        result.toFixed(DECIMAL_SCALE),
      ]
    );

    return res.status(201).json({
      success: true,
      result,
      id: insertResult.insertId,
    });
  } catch (error) {
    return next(error);
  }
}

async function getHistory(_req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, num1, num2, operator, result, created_at
       FROM calculations_history
       ORDER BY created_at DESC, id DESC
       LIMIT 20`
    );

    const history = rows.map((row) => ({
      id: row.id,
      num1: Number(row.num1),
      num2: Number(row.num2),
      operator: row.operator,
      result: Number(row.result),
      created_at: row.created_at,
    }));

    return res.json(history);
  } catch (error) {
    return next(error);
  }
}

async function clearHistory(_req, res, next) {
  try {
    const [deleteResult] = await pool.execute(
      "DELETE FROM calculations_history"
    );

    return res.json({
      success: true,
      message: "Calculation history cleared.",
      deletedCount: deleteResult.affectedRows,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  calculate,
  getHistory,
  clearHistory,
};
