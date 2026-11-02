const Preference = require("../models/Preference");

const ALLOWED_GENDERS = [
  "male",
  "female",
  "non-binary",
  "other",
];

// GET MY PREFERENCES
const getPreferences = async (req, res) => {
  try {
    let preference = await Preference.findOne({
      user: req.user._id,
    });

    if (!preference) {
      preference = await Preference.create({
        user: req.user._id,
      });
    }

    return res.status(200).json({
      success: true,
      preferences: preference,
    });
  } catch (error) {
    console.error("Get preferences error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve preferences.",
    });
  }
};

// UPDATE MY PREFERENCES
const updatePreferences = async (req, res) => {
  try {
    const {
      interestedIn,
      minAge,
      maxAge,
      maxDistanceKm,
      interests,
    } = req.body;

    const updates = {};

    if (interestedIn !== undefined) {
      if (
        !Array.isArray(interestedIn) ||
        interestedIn.length === 0 ||
        !interestedIn.every((gender) =>
          ALLOWED_GENDERS.includes(gender)
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Select at least one valid gender.",
        });
      }

      updates.interestedIn = [...new Set(interestedIn)];
    }

    if (minAge !== undefined) {
      if (
        !Number.isInteger(minAge) ||
        minAge < 18 ||
        minAge > 120
      ) {
        return res.status(400).json({
          success: false,
          message: "Minimum age must be between 18 and 120.",
        });
      }

      updates.minAge = minAge;
    }

    if (maxAge !== undefined) {
      if (
        !Number.isInteger(maxAge) ||
        maxAge < 18 ||
        maxAge > 120
      ) {
        return res.status(400).json({
          success: false,
          message: "Maximum age must be between 18 and 120.",
        });
      }

      updates.maxAge = maxAge;
    }

    if (
      updates.minAge !== undefined &&
      updates.maxAge !== undefined &&
      updates.minAge > updates.maxAge
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum age cannot exceed maximum age.",
      });
    }

    if (
      updates.minAge === undefined &&
      updates.maxAge !== undefined
    ) {
      const current = await Preference.findOne({
        user: req.user._id,
      });

      if (
        current &&
        current.minAge > updates.maxAge
      ) {
        return res.status(400).json({
          success: false,
          message: "Maximum age cannot be below minimum age.",
        });
      }
    }

    if (
      updates.maxAge === undefined &&
      updates.minAge !== undefined
    ) {
      const current = await Preference.findOne({
        user: req.user._id,
      });

      if (
        current &&
        current.maxAge < updates.minAge
      ) {
        return res.status(400).json({
          success: false,
          message: "Minimum age cannot exceed maximum age.",
        });
      }
    }

    if (maxDistanceKm !== undefined) {
      if (
        typeof maxDistanceKm !== "number" ||
        !Number.isFinite(maxDistanceKm) ||
        maxDistanceKm < 1 ||
        maxDistanceKm > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Distance must be between 1 and 500 km.",
        });
      }

      updates.maxDistanceKm = maxDistanceKm;
    }

    if (interests !== undefined) {
      if (
        !Array.isArray(interests) ||
        interests.length > 20 ||
        !interests.every(
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
          interests.map((interest) => interest.trim())
        ),
      ];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid preference.",
      });
    }

    // Validate age bounds against the final saved values.
    const current = await Preference.findOne({
      user: req.user._id,
    });

    const finalMinAge = updates.minAge ?? current?.minAge ?? 18;
    const finalMaxAge = updates.maxAge ?? current?.maxAge ?? 35;

    if (finalMinAge > finalMaxAge) {
      return res.status(400).json({
        success: false,
        message: "Minimum age cannot exceed maximum age.",
      });
    }

    const preference = await Preference.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: updates,
        $setOnInsert: { user: req.user._id },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully.",
      preferences: preference,
    });
  } catch (error) {
    console.error("Update preferences error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update preferences.",
    });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
};