const mongoose = require("mongoose");

const interactionSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: ["like", "pass"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// A user can have only one current interaction with another user.
interactionSchema.index(
  { fromUser: 1, toUser: 1 },
  { unique: true }
);

interactionSchema.index({ toUser: 1, action: 1 });

module.exports = mongoose.model(
  "Interaction",
  interactionSchema
);