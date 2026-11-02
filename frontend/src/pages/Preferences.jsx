import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import api from "../services/api";

const genderOptions = [
  { value: "male", label: "Men" },
  { value: "female", label: "Women" },
  { value: "non-binary", label: "Non-binary people" },
  { value: "other", label: "Other" },
];

export default function Preferences() {
  const [form, setForm] = useState({
    interestedIn: ["female"],
    minAge: 18,
    maxAge: 35,
    maxDistanceKm: 50,
    interests: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get("/preferences")
      .then(({ data }) => {
        if (cancelled) return;

        const preferences = data.preferences || data;

        setForm({
          interestedIn: preferences.interestedIn || ["female"],
          minAge: preferences.minAge ?? 18,
          maxAge: preferences.maxAge ?? 35,
          maxDistanceKm: preferences.maxDistanceKm ?? 50,
          interests: (preferences.interests || []).join(", "),
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load preferences. Please try again."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleGender = (gender) => {
    setForm((previous) => {
      const selected = previous.interestedIn.includes(gender)
        ? previous.interestedIn.filter((item) => item !== gender)
        : [...previous.interestedIn, gender];

      return { ...previous, interestedIn: selected };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.interestedIn.length === 0) {
      setError("Please select at least one gender preference.");
      return;
    }

    if (Number(form.minAge) > Number(form.maxAge)) {
      setError("Minimum age cannot exceed maximum age.");
      return;
    }

    setSaving(true);

    const interests = [
      ...new Set(
        form.interests
          .split(",")
          .map((interest) => interest.trim())
          .filter(Boolean)
      ),
    ];

    try {
      await api.patch("/preferences", {
        interestedIn: form.interestedIn,
        minAge: Number(form.minAge),
        maxAge: Number(form.maxAge),
        maxDistanceKm: Number(form.maxDistanceKm),
        interests,
      });

      setSuccess("Your discovery preferences have been saved.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save preferences. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading preferences...</div>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl bg-pink-100 p-4 text-primary">
          <Settings size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Preferences
          </h1>
          <p className="mt-1 text-gray-500">
            Customize the people you discover.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-3xl bg-white p-6 shadow-sm sm:p-9"
      >
        {error && (
          <div role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="rounded-xl bg-green-50 p-3 text-green-700">
            {success}
          </div>
        )}

        <section>
          <h2 className="font-bold text-gray-900">I'm interested in</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select one or more options.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {genderOptions.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  form.interestedIn.includes(option.value)
                    ? "border-primary bg-pink-50"
                    : "border-gray-200 hover:border-pink-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.interestedIn.includes(option.value)}
                  onChange={() => toggleGender(option.value)}
                  className="h-4 w-4 accent-pink-600"
                />
                <span className="font-medium text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-bold text-gray-900">Age range</h2>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Minimum age
              </label>
              <input
                type="number"
                min="18"
                max="120"
                required
                value={form.minAge}
                onChange={(event) =>
                  setForm({ ...form, minAge: event.target.value })
                }
                className="form-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Maximum age
              </label>
              <input
                type="number"
                min="18"
                max="120"
                required
                value={form.maxAge}
                onChange={(event) =>
                  setForm({ ...form, maxAge: event.target.value })
                }
                className="form-input"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Maximum distance</h2>
            <span className="rounded-full bg-pink-50 px-3 py-1 font-bold text-primary">
              {form.maxDistanceKm} km
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="500"
            value={form.maxDistanceKm}
            onChange={(event) =>
              setForm({ ...form, maxDistanceKm: event.target.value })
            }
            className="mt-5 w-full accent-pink-600"
          />

          <div className="flex justify-between text-xs text-gray-400">
            <span>1 km</span>
            <span>250 km</span>
            <span>500 km</span>
          </div>

        </section>

        <section>
          <h2 className="font-bold text-gray-900">Preferred interests</h2>
          <input
            value={form.interests}
            onChange={(event) =>
              setForm({ ...form, interests: event.target.value })
            }
            placeholder="Travel, Music, Fitness"
            className="form-input mt-3"
          />
          <p className="mt-2 text-sm text-gray-500">
            Enter interests separated by commas.
          </p>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-primary py-3.5 font-bold text-white hover:bg-rose-600 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </form>
    </main>
  );
}