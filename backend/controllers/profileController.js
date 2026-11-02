const User = require("../models/User");

// GET MY PROFILE
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        bio: user.bio,
        interests: user.interests,
        profilePhoto: user.profilePhoto,
        location: user.location,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve profile.",
    });
  }
};

// UPDATE MY PROFILE
const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "bio",
      "interests",
      "profilePhoto",
      "location",
    ];

    const updates = {};

    // Accept only explicitly permitted fields.
    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided.",
      });
    }

    // Validate name.
    if (Object.hasOwn(updates, "name")) {
      if (typeof updates.name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Name must be a string.",
        });
      }

      updates.name = updates.name.trim();

      if (updates.name.length < 2 || updates.name.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Name must contain 2 to 50 characters.",
        });
      }
    }

    // Validate bio.
    if (Object.hasOwn(updates, "bio")) {
      if (
        typeof updates.bio !== "string" ||
        updates.bio.length > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Bio must be a string of at most 500 characters.",
        });
      }

      updates.bio = updates.bio.trim();
    }

    // Validate interests.
    if (Object.hasOwn(updates, "interests")) {
      if (
        !Array.isArray(updates.interests) ||
        updates.interests.length > 20 ||
        !updates.interests.every(
          (interest) =>
            typeof interest === "string" &&
            interest.trim().length > 0 &&
            interest.trim().length <= 40
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide up to 20 valid interests.",
        });
      }

      updates.interests = [
        ...new Set(
          updates.interests.map((interest) => interest.trim())
        ),
      ];
    }

    // Validate profile photo URL.
    if (Object.hasOwn(updates, "profilePhoto")) {
      if (typeof updates.profilePhoto !== "string") {
        return res.status(400).json({
          success: false,
          message: "Profile photo must be a URL string.",
        });
      }

      const photo = updates.profilePhoto.trim();

      if (photo.length > 2048) {
        return res.status(400).json({
          success: false,
          message: "Profile photo URL is too long.",
        });
      }

      if (photo !== "") {
        try {
          const url = new URL(photo);

          if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
          ) {
            throw new Error("Unsupported protocol");
          }

          updates.profilePhoto = url.toString();
        } catch {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid photo URL.",
          });
        }
      } else {
        updates.profilePhoto = "";
      }
    }

    // Validate GeoJSON location.
    // Coordinates must be [longitude, latitude].
    if (Object.hasOwn(updates, "location")) {
      const location = updates.location;

      if (
        !location ||
        typeof location !== "object" ||
        Array.isArray(location) ||
        location.type !== "Point" ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Location must contain a GeoJSON Point with [longitude, latitude] coordinates.",
        });
      }

      const [longitude, latitude] = location.coordinates;

      if (
        typeof longitude !== "number" ||
        typeof latitude !== "number" ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid longitude or latitude.",
        });
      }

      updates.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        profilePhoto: updatedUser.profilePhoto,
        location: updatedUser.location,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};

// GET ANOTHER USER'S PUBLIC PROFILE
// Do not expose precise location coordinates publicly.
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.userId,
      isActive: true,
    }).select(
      "name dateOfBirth gender bio interests profilePhoto createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      profile: user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    console.error("Get public profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve profile.",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
};