const express = require("express");

const {
  getPreferences,
  updatePreferences,
} = require("../controllers/preferenceController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getPreferences);

router.patch("/", protect, updatePreferences);

module.exports = router;