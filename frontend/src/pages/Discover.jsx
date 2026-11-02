import { useCallback, useEffect, useState } from "react";
import { Heart, X, RefreshCw, MapPin } from "lucide-react";
import api from "../services/api";

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const birthdayHasPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) age--;

  return age;
}

export default function Discover() {
  const [users, setUsers] = useState([]);
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(async (pageNumber = 1, append = false) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/discover", {
        params: { page: pageNumber, limit: 10 },
      });

      const results = Array.isArray(data.users)
        ? data.users
        : Array.isArray(data.suggestions)
          ? data.suggestions
          : [];

      setUsers((previous) =>
        append ? [...previous, ...results] : results
      );

      setIndex(0);
      setPage(pageNumber);
      setHasMore(
        data.pagination
          ? pageNumber < data.pagination.totalPages
          : results.length === 10
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load profiles. Check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const currentUser = users[index];

  const handleAction = async (action) => {
    if (!currentUser || actionLoading) return;

    setActionLoading(true);
    setNotice("");
    setError("");

    try {
      const { data } = await api.post("/interactions", {
        targetUserId: currentUser.id || currentUser._id,
        action,
      });

      if (data.matched) {
        setNotice(`It's a match! You and ${currentUser.name} like each other.`);
      } else if (action === "like") {
        setNotice(`You liked ${currentUser.name}.`);
      }

      const nextIndex = index + 1;

      if (nextIndex >= users.length && hasMore) {
        await loadUsers(page + 1, true);
      } else {
        setIndex(nextIndex);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save your choice. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        Finding people for you...
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="mx-auto mt-12 max-w-lg rounded-2xl bg-white p-8 text-center shadow">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => loadUsers(1)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white"
        >
          <RefreshCw size={17} /> Try again
        </button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 text-primary">
          <Heart size={36} />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-gray-900">
          You've seen everyone for now
        </h1>
        <p className="mt-3 text-gray-500">
          Check your preferences or try discovering profiles again later.
        </p>

        <button
          onClick={() => loadUsers(1)}
          className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-rose-600"
        >
          Refresh profiles
        </button>
      </div>
    );
  }

  const age = calculateAge(currentUser.dateOfBirth);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-7">
        <p className="font-semibold uppercase tracking-widest text-primary">
          YOUR NEXT CONNECTION
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
          Discover people
        </h1>
        <p className="mt-2 text-gray-500">
          Explore profiles and find someone who shares your interests.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-xl bg-pink-50 p-3 text-center font-medium text-primary"
        >
          {notice}
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="relative flex h-80 items-center justify-center bg-gradient-to-br from-pink-100 to-rose-200 sm:h-[420px]">
            {currentUser.profilePhoto ? (
              <img
                src={currentUser.profilePhoto}
                alt={`${currentUser.name}'s profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white text-6xl font-extrabold text-primary shadow">
                {currentUser.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-20 text-white">
              <h2 className="text-3xl font-extrabold">
                {currentUser.name}
                {age !== null && `, ${age}`}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
                <MapPin size={16} />
                Location not provided
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-7 p-6">
            <button
              onClick={() => handleAction("pass")}
              disabled={actionLoading}
              aria-label="Pass on profile"
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-200 text-gray-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            >
              <X size={30} />
            </button>

            <button
              onClick={() => handleAction("like")}
              disabled={actionLoading}
              aria-label="Like profile"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-pink-200 transition hover:scale-105 hover:bg-rose-600 disabled:opacity-50"
            >
              <Heart size={29} fill="currentColor" />
            </button>
          </div>

          <p className="pb-5 text-center text-xs text-gray-400">
            {actionLoading ? "Saving your choice..." : "Pass or like this profile"}
          </p>
        </div>

        <div className="rounded-3xl border border-pink-100 bg-white p-7 shadow-sm sm:p-9">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            About
          </p>

          <h3 className="mt-3 text-xl font-bold text-gray-900">
            About {currentUser.name}
          </h3>

          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-600">
            {currentUser.bio || "This person hasn't added a bio yet."}
          </p>

          <div className="my-7 h-px bg-gray-100" />

          <h3 className="font-bold text-gray-900">Interests</h3>

          <div className="mt-4 flex flex-wrap gap-2">
            {currentUser.interests?.length ? (
              currentUser.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-pink-50 px-4 py-2 text-sm font-medium text-primary"
                >
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No interests added yet.
              </p>
            )}
          </div>

          <div className="my-7 h-px bg-gray-100" />

          <div className="rounded-2xl bg-rose-50 p-5">
            <Heart size={23} className="text-primary" />
            <h3 className="mt-3 font-bold text-gray-900">
              Looking for a connection?
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Like someone you're interested in. If they like you back, you'll
              become a match!
            </p>
          </div>

          <p className="mt-5 text-sm text-gray-400">
            Profile {index + 1} of {users.length}
          </p>
        </div>
      </div>
    </main>
  );
}