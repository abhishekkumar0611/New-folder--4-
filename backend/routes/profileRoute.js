const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
} = require("../controllers/profileController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Authenticated user's own profile
router.get("/me", protect, getMyProfile);
router.patch("/me", protect, updateMyProfile);

// Another user's public profile
router.get("/:userId", protect, getPublicProfile);

module.exports = router;