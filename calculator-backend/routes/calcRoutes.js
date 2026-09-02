const express = require("express");
const {
  calculate,
  getHistory,
  clearHistory,
} = require("../controllers/calcController");

const router = express.Router();

router.post("/calculate", calculate);
router.get("/history", getHistory);
router.delete("/history", clearHistory);

module.exports = router;
