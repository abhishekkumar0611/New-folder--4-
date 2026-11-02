const mongoose = require("mongoose");

const User = require("../models/User");
const Preference = require("../models/Preference");
const Interaction = require("../models/Interaction");

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (coordinates1, coordinates2) => {
  const [lon1, lat1] = coordinates1;
  const [lon2, lat2] = coordinates2;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lon2 - lon1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const boundedA = Math.min(1, Math.max(0, a));

  const c = 2 * Math.atan2(
    Math.sqrt(boundedA),
    Math.sqrt(1 - boundedA)
  );

  return earthRadiusKm * c;
};

const discoverUsers = async (req, res) => {
  try {
    // 1. Validate pagination
    const parsedPage = Number.parseInt(req.query.page, 10);
    const parsedLimit = Number.parseInt(req.query.limit, 10);

    const page = Math.max(
      1,
      Math.min(100000, parsedPage || 1)
    );

    const limit = Math.max(
      1,
      Math.min(50, parsedLimit || 10)
    );

    // 2. Validate authenticated user
    const currentUserId = req.user?._id || req.user?.id;

    if (!currentUserId ||
        !mongoose.isValidObjectId(currentUserId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const currentUser = await User.findById(currentUserId)
      .select("name dateOfBirth gender location isActive")
      .lean();

    if (!currentUser || !currentUser.isActive) {
      return res.status(404).json({
        success: false,
        message: "Active user not found.",
      });
    }

    // 3. Load current user's preferences
    const preferences = await Preference.findOne({
      user: currentUser._id,
    }).lean();

    const minAge = preferences?.minAge ?? 18;
    const maxAge = preferences?.maxAge ?? 35;

    const interestedIn = preferences?.interestedIn ?? ["female"];

    const maxDistanceKm = preferences?.maxDistance ?? 25;

    // 4. Validate distance preference
    if (
      !Number.isFinite(maxDistanceKm) ||
      maxDistanceKm < 1 ||
      maxDistanceKm > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid maximum distance preference.",
      });
    }

    // 5. Validate user's location
    const coordinates = currentUser.location?.coordinates;

    if (
      currentUser.location?.type !== "Point" ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      !coordinates.every(Number.isFinite) ||
      Math.abs(coordinates[0]) > 180 ||
      Math.abs(coordinates[1]) > 90
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please add a valid location before discovering users.",
      });
    }

    // 6. Find users already interacted with
    const interactions = await Interaction.find({
      fromUser: currentUser._id,
    })
      .select("toUser")
      .lean();

    const excludedIds = interactions
      .map((interaction) => interaction.toUser)
      .filter(Boolean);

    // Always exclude the current user
    excludedIds.push(currentUser._id);

    // 7. Find users within the selected distance
    // MongoDB $maxDistance expects meters, not kilometers.
    const candidates = await User.find({
      isActive: true,

      _id: {
        $nin: excludedIds,
      },

      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates,
          },
          $maxDistance: maxDistanceKm * 1000,
        },
      },
    })
      .select(
        "name dateOfBirth gender bio interests profilePhoto location"
      )
      .lean();

    // $near returns users ordered by distance.
    // Do not sort candidates before applying pagination.

    // 8. Load candidate preferences
    const candidateIds = candidates.map(
      (candidate) => candidate._id
    );

    const candidatePreferences = await Preference.find({
      user: {
        $in: candidateIds,
      },
    }).lean();

    const preferenceMap = new Map(
      candidatePreferences.map((preference) => [
        preference.user.toString(),
        preference,
      ])
    );

    const currentAge = calculateAge(currentUser.dateOfBirth);

    if (currentAge === null) {
      return res.status(400).json({
        success: false,
        message: "Please add a valid date of birth.",
      });
    }

    // 9. Apply age, gender, and mutual preference filters
    const filteredUsers = candidates.filter((candidate) => {
      const candidateAge = calculateAge(candidate.dateOfBirth);

      if (candidateAge === null) {
        return false;
      }

      // Check current user's age preferences
      const ageMatches =
        candidateAge >= minAge &&
        candidateAge <= maxAge;

      // Check current user's gender preferences
      const genderMatches = interestedIn.includes(
        candidate.gender
      );

      if (!ageMatches || !genderMatches) {
        return false;
      }

      // Check candidate's preferences, if they exist
      const candidatePreference = preferenceMap.get(
        candidate._id.toString()
      );

      if (candidatePreference) {
        const candidateInterestedIn =
          candidatePreference.interestedIn ?? ["female"];

        const candidateMinAge =
          candidatePreference.minAge ?? 18;

        const candidateMaxAge =
          candidatePreference.maxAge ?? 35;

        const currentGenderAccepted =
          candidateInterestedIn.includes(currentUser.gender);

        const currentAgeAccepted =
          currentAge >= candidateMinAge &&
          currentAge <= candidateMaxAge;

        if (!currentGenderAccepted || !currentAgeAccepted) {
          return false;
        }
      }

      return true;
    });

    // 10. Calculate total before pagination
    const total = filteredUsers.length;

    const startIndex = (page - 1) * limit;

    // 11. Return paginated profiles with their distances
    const users = filteredUsers
      .slice(startIndex, startIndex + limit)
      .map((user) => {
        const distanceKm = calculateDistance(
          coordinates,
          user.location.coordinates
        );

        return {
          id: user._id,
          name: user.name,
          age: calculateAge(user.dateOfBirth),
          gender: user.gender,
          bio: user.bio,
          interests: user.interests,
          profilePhoto: user.profilePhoto,
          distanceKm: Number(distanceKm.toFixed(2)),
        };
      });

    // 12. Send response
    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      maxDistanceKm,
      users,
    });
  } catch (error) {
    console.error("Discover error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load discover profiles.",
    });
  }
};

module.exports = { discoverUsers };