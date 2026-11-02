const Match = require("../models/Match");

const getMyMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      users: req.user._id,
    })
      .populate({
        path: "users",
        select: "name dateOfBirth gender bio interests profilePhoto isActive",
      })
      .sort({ matchedAt: -1 });

    const results = matches
      .filter((match) =>
        match.users.every(
          (user) => user && user.isActive
        )
      )
      .map((match) => {
        const otherUser = match.users.find(
          (user) =>
            user._id.toString() !== req.user._id.toString()
        );

        if (!otherUser) {
          return null;
        }

        return {
          matchId: match._id,
          matchedAt: match.matchedAt,
          user: {
            id: otherUser._id,
            name: otherUser.name,
            dateOfBirth: otherUser.dateOfBirth,
            gender: otherUser.gender,
            bio: otherUser.bio,
            interests: otherUser.interests,
            profilePhoto: otherUser.profilePhoto,
          },
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      total: results.length,
      matches: results,
    });
  } catch (error) {
    console.error("Get matches error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve matches.",
    });
  }
};

module.exports = { getMyMatches };