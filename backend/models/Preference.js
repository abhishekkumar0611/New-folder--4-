const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    interestedIn: {
      type: [String],
      enum: ["male", "female", "non-binary", "other"],
      default: ["female"],
    },

    minAge: {
      type: Number,
      min: 18,
      max: 120,
      default: 18,
    },

    maxAge: {
      type: Number,
      min: 18,
      max: 120,
      default: 35,
    },

    maxDistance: {
      type: Number,
      default: 25, // Kilometers
      min: 1,
    },

    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

preferenceSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model(
  "Preference",
  preferenceSchema
);