const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    users: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],
      required: true,
      validate: {
        validator: function (users) {
          return (
            users.length === 2 &&
            users[0].toString() !== users[1].toString()
          );
        },
        message: "A match must contain two different users.",
      },
    },

    pairKey: {
      type: String,
      required: true,
      unique: true,
    },

    matchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Match", matchSchema);