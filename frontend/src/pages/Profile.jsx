import { useEffect, useState } from "react";
import { Save, UserRound, MapPin, LocateFixed } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { setUser } = useAuth();

  const [form, setForm] = useState({
    name: "",
    bio: "",
    interests: "",
    profilePhoto: "",
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the current user's profile.
  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const { data } = await api.get("/profiles/me");

        if (cancelled) return;

        const profile = data.profile || data.user || data;
        const coordinates = profile.location?.coordinates;

        setForm({
          name: profile.name || "",
          bio: profile.bio || "",
          interests: (profile.interests || []).join(", "),
          profilePhoto: profile.profilePhoto || "",
          longitude:
            Array.isArray(coordinates) && coordinates.length === 2
              ? String(coordinates[0])
              : "",
          latitude:
            Array.isArray(coordinates) && coordinates.length === 2
              ? String(coordinates[1])
              : "",
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load your profile."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Ask the user for permission to access their current location.
  const handleGetCurrentLocation = () => {
    setError("");
    setSuccess("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((previous) => ({
          ...previous,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));

        setGettingLocation(false);
        setSuccess(
          "Location detected. Click Save Profile to save it."
        );
      },
      (locationError) => {
        let message = "Unable to retrieve your location.";

        if (locationError.code === 1) {
          message =
            "Location permission was denied. Allow location access in your browser settings or enter coordinates manually.";
        } else if (locationError.code === 2) {
          message =
            "Your current location is unavailable. Please try again or enter coordinates manually.";
        } else if (locationError.code === 3) {
          message =
            "Location request timed out. Please try again.";
        }

        setError(message);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const latitudeText = form.latitude.trim();
    const longitudeText = form.longitude.trim();

    // Both coordinates must be provided together.
    if (
      (latitudeText && !longitudeText) ||
      (!latitudeText && longitudeText)
    ) {
      setError(
        "Enter both latitude and longitude, or use Detect My Location."
      );
      return;
    }

    let location;

    if (latitudeText && longitudeText) {
      const latitude = Number(latitudeText);
      const longitude = Number(longitudeText);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        setError(
          "Enter valid coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180."
        );
        return;
      }

      // GeoJSON requires [longitude, latitude].
      location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    const interests = [
      ...new Set(
        form.interests
          .split(",")
          .map((interest) => interest.trim())
          .filter(Boolean)
      ),
    ];

    if (interests.length > 20) {
      setError("You can add a maximum of 20 interests.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        bio: form.bio.trim(),
        interests,
        profilePhoto: form.profilePhoto.trim(),
      };

      // Only update location when both coordinates are supplied.
      // Omitting it preserves any existing saved location.
      if (location) {
        payload.location = location;
      }

      const { data } = await api.patch("/profiles/me", payload);

      const updatedProfile = data.profile || data.user || data;

      setForm((previous) => ({
        ...previous,
        name: updatedProfile.name ?? previous.name,
        bio: updatedProfile.bio ?? previous.bio,
        interests: (
          updatedProfile.interests ?? interests
        ).join(", "),
        profilePhoto:
          updatedProfile.profilePhoto ?? previous.profilePhoto,
        longitude: Array.isArray(
          updatedProfile.location?.coordinates
        )
          ? String(updatedProfile.location.coordinates[0])
          : previous.longitude,
        latitude: Array.isArray(
          updatedProfile.location?.coordinates
        )
          ? String(updatedProfile.location.coordinates[1])
          : previous.latitude,
      }));

      setUser((previous) => {
        const updated = {
          ...(previous || {}),
          ...updatedProfile,
        };

        localStorage.setItem("dating_user", JSON.stringify(updated));

        return updated;
      });

      setSuccess(
        location
          ? "Profile and location updated successfully."
          : "Profile updated successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading your profile...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl bg-pink-100 p-4 text-primary">
          <UserRound size={30} />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            My Profile
          </h1>
          <p className="mt-1 text-gray-500">
            Show people who you are.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-9">
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-3 text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl bg-green-50 p-3 text-green-700"
          >
            {success}
          </div>
        )}

        {/* Profile photo preview */}
        <div className="mb-7 flex flex-col items-center">
          {form.profilePhoto ? (
            <img
              src={form.profilePhoto}
              alt="Profile preview"
              className="h-28 w-28 rounded-full border-4 border-pink-100 object-cover"
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
              }}
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-pink-100 text-primary">
              <UserRound size={44} />
            </div>
          )}

          <p className="mt-3 text-sm text-gray-500">
            Profile photo preview
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Full name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              maxLength={50}
              required
              className="form-input"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              About me
            </label>

            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              maxLength={500}
              rows={5}
              placeholder="Tell people a little about yourself..."
              className="form-input resize-y"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {form.bio.length}/500
            </p>
          </div>

          {/* Interests */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Interests
            </label>

            <input
              name="interests"
              value={form.interests}
              onChange={handleChange}
              placeholder="Travel, Music, Movies, Fitness"
              className="form-input"
            />

            <p className="mt-1 text-xs text-gray-400">
              Separate each interest with a comma. Maximum 20 interests.
            </p>
          </div>

          {/* Profile photo */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Profile photo URL
            </label>

            <input
              name="profilePhoto"
              type="url"
              value={form.profilePhoto}
              onChange={handleChange}
              placeholder="https://example.com/photo.jpg"
              className="form-input"
            />

            <p className="mt-1 text-xs text-gray-400">
              Use a publicly accessible image URL. File uploads are not implemented yet.
            </p>
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={21} className="text-primary" />

              <div>
                <h2 className="font-bold text-gray-900">
                  Your Location
                </h2>

                <p className="text-sm text-gray-500">
                  Used to find people within your preferred distance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={gettingLocation}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-pink-200 px-4 py-3 font-semibold text-primary hover:bg-pink-50 disabled:opacity-60"
            >
              <LocateFixed size={18} />

              {gettingLocation
                ? "Detecting location..."
                : "Detect My Current Location"}
            </button>

            <p className="mb-4 text-xs text-gray-500">
              Your browser will ask for permission. You can also enter
              coordinates manually. Your precise coordinates should not
              be exposed on public profiles.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Latitude
                </label>

                <input
                  name="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 28.6139"
                  className="form-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Longitude
                </label>

                <input
                  name="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 77.2090"
                  className="form-input"
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Save your profile after detecting or entering your location.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || gettingLocation}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            <Save size={19} />

            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}
