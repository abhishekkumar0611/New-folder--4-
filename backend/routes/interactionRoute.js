const express = require("express");

const {
  interactWithUser,
} = require("../controllers/interactionController");

const { getReceivedLikes } = require("../controllers/interactionController")

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, interactWithUser);
router.get("/received", protect, getReceivedLikes);


module.exports = router;