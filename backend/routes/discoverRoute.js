const express = require("express");

const { discoverUsers } = require("../controllers/discoverController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, discoverUsers);

module.exports = router;