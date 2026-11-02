const User = require("../models/User");
const Preference = require("../models/Preference");
const Interaction = require("../models/Interaction");

const getDiscoveryUsers = async (currentUserId) => {
  // 1. Find the logged-in user
  const currentUser = await User.findById(currentUserId).lean();

  if (!currentUser) {
    throw new Error("User not found");
  }

  // 2. Find the user's preferences
  const preference = await Preference.findOne({
    userId: currentUserId,
  }).lean();

  if (!preference) {
    throw new Error("Preferences not found");
  }

  // 3. Validate the current user's location
  const coordinates = currentUser.location?.coordinates;

  if (
    currentUser.location?.type !== "Point" ||
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !coordinates.every(Number.isFinite) ||
    Math.abs(coordinates[0]) > 180 ||
    Math.abs(coordinates[1]) > 90
  ) {
    throw new Error("Please add a valid location before discovering users");
  }

  // 4. Get users already interacted with
  const interactions = await Interaction.find({
    userId: currentUserId,
  })
    .select("targetUserId")
    .lean();

  const excludedUserIds = interactions
    .map((interaction) => interaction.targetUserId)
    .filter(Boolean);

  // 5. Convert distance from kilometers to meters
  const maxDistanceKm = preference.distance?.value ?? 25;

  if (
    !Number.isFinite(maxDistanceKm) ||
    maxDistanceKm <= 0 ||
    maxDistanceKm > 1000
  ) {
    throw new Error("Invalid maximum distance preference");
  }

  const maxDistanceMeters = maxDistanceKm * 1000;

  // 6. Build the discovery query
  const query = {
    _id: {
      $nin: [currentUserId, ...excludedUserIds],
    },

    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  };

  // 7. Apply age filtering when dateOfBirth is available
  if (currentUser.dateOfBirth) {
    const today = new Date();

    const youngestDOB = new Date(today);
    youngestDOB.setFullYear(
      today.getFullYear() - preference.maxAge
    );

    const oldestDOB = new Date(today);
    oldestDOB.setFullYear(
      today.getFullYear() - preference.minAge - 1
    );
    oldestDOB.setDate(oldestDOB.getDate() - 1);

    query.dateOfBirth = {
      $gte: youngestDOB,
      $lte: oldestDOB,
    };
  }

  // 8. Apply gender filtering if your schemas support it
  if (preference.interestedIn) {
    query.gender = preference.interestedIn;
  }

  // 9. Find nearby users, nearest first
  const users = await User.find(query)
    .select("-password")
    .limit(50)
    .lean();

  return {
    total: users.length,
    maxDistanceKm,
    users,
  };
};

module.exports = { getDiscoveryUsers };