const User = require("../models/User");
const Interaction = require("../models/Interaction");
const Match = require("../models/Match");

const createPairKey = (userId1, userId2) => {
  return [userId1.toString(), userId2.toString()]
    .sort()
    .join("_");
};

const interactWithUser = async (req, res) => {
  try {
    const { targetUserId, action } = req.body;

    if (
      typeof targetUserId !== "string" ||
      !["like", "pass"].includes(action)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid targetUserId and action.",
      });
    }

    const currentUserId = req.user._id;

    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot interact with your own profile.",
      });
    }

    if (!/^[a-f\d]{24}$/i.test(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target user ID.",
      });
    }

    const targetUser = await User.findOne({
      _id: targetUserId,
      isActive: true,
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found.",
      });
    }

    // Save or update the interaction.
    const interaction = await Interaction.findOneAndUpdate(
      {
        fromUser: currentUserId,
        toUser: targetUserId,
      },
      {
        $set: { action },
        $setOnInsert: {
          fromUser: currentUserId,
          toUser: targetUserId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // A pass must never create a match.
    if (action === "pass") {
      return res.status(200).json({
        success: true,
        message: "Profile passed successfully.",
        action: "pass",
        matched: false,
      });
    }

    // Check whether the target user already liked the current user.
    const reciprocalLike = await Interaction.findOne({
      fromUser: targetUserId,
      toUser: currentUserId,
      action: "like",
    });

    if (!reciprocalLike) {
      return res.status(200).json({
        success: true,
        message: "Like recorded successfully.",
        action: interaction.action,
        matched: false,
      });
    }

    // Both users have liked each other.
    const pairKey = createPairKey(
      currentUserId,
      targetUserId
    );

    const sortedUserIds = [
      currentUserId.toString(),
      targetUserId,
    ].sort();

    // Upsert avoids creating duplicate matches for the same pair.
    const match = await Match.findOneAndUpdate(
      { pairKey },
      {
        $setOnInsert: {
          users: sortedUserIds,
          pairKey,
          matchedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "It's a match!",
      action: interaction.action,
      matched: true,
      matchId: match._id,
    });
  } catch (error) {
    // A concurrent duplicate interaction can hit the unique index.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A duplicate interaction was detected. Please retry.",
      });
    }

    console.error("Interaction error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process interaction.",
    });
  }
};


const getReceivedLikes = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find likes sent TO the currently logged-in user.
    const likes = await Interaction.find({
      toUser: currentUserId,
      action: "like",
    })
      .populate({
        path: "fromUser",
        select: "name dateOfBirth gender bio interests profilePhoto isActive",
      })
      .sort({ createdAt: -1 });

    // Exclude deleted or inactive senders.
    const receivedLikes = likes
      .filter((like) => like.fromUser && like.fromUser.isActive)
      .map((like) => ({
        interactionId: like._id,
        likedAt: like.createdAt,
        user: {
          id: like.fromUser._id,
          name: like.fromUser.name,
          dateOfBirth: like.fromUser.dateOfBirth,
          gender: like.fromUser.gender,
          bio: like.fromUser.bio,
          interests: like.fromUser.interests,
          profilePhoto: like.fromUser.profilePhoto,
        },
      }));

    return res.status(200).json({
      success: true,
      total: receivedLikes.length,
      likes: receivedLikes,
    });
  } catch (error) {
    console.error("Get received likes error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve received likes.",
    });
  }
};



module.exports = { interactWithUser, getReceivedLikes };