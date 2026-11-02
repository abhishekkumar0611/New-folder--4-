import { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import api from "../services/api";

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

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
}

export default function Matches() {
  const [activeTab, setActiveTab] = useState("likes");

  const [likes, setLikes] = useState([]);
  const [matches, setMatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConnections = async () => {
    setLoading(true);
    setError("");

    try {
      const [likesResult, matchesResult] = await Promise.allSettled([
        api.get("/interactions/received"),
        api.get("/matches"),
      ]);

      let hasError = false;

      if (likesResult.status === "fulfilled") {
        const data = likesResult.value.data;
        setLikes(Array.isArray(data.likes) ? data.likes : []);
      } else {
        hasError = true;
        console.error(
          "Unable to load received likes:",
          likesResult.reason
        );
      }

      if (matchesResult.status === "fulfilled") {
        const data = matchesResult.value.data;

        // Your backend returns:
        // { matchId, matchedAt, user: { id, name, ... } }
        const normalizedMatches = Array.isArray(data.matches)
          ? data.matches.map((match) => ({
              ...match.user,
              id: match.user?.id || match.user?._id,
              matchId: match.matchId,
              matchedAt: match.matchedAt,
            })).filter((match) => match.id)
          : [];

        setMatches(normalizedMatches);
      } else {
        hasError = true;
        console.error(
          "Unable to load matches:",
          matchesResult.reason
        );
      }

      if (hasError) {
        setError(
          "Some connections could not be loaded. Please refresh to try again."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your connections."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const displayedUsers = activeTab === "likes" ? likes : matches;

  const getUser = (item) => {
    // Received-likes endpoint returns { user, interactionId, likedAt }.
    // Matches are normalized into user objects above.
    return activeTab === "likes" ? item.user : item;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold uppercase tracking-widest text-primary">
            YOUR CONNECTIONS
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
            Likes & Matches
          </h1>

          <p className="mt-2 text-gray-500">
            See who likes you and discover your mutual matches.
          </p>
        </div>

        <button
          type="button"
          onClick={loadConnections}
          disabled={loading}
          aria-label="Refresh likes and matches"
          className="rounded-xl border border-gray-200 p-3 text-gray-600 hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <RefreshCw
            size={20}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab("likes");
            setError("");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 font-semibold transition ${
            activeTab === "likes"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Heart size={18} />
          Likes You
          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-primary">
            {likes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("matches");
            setError("");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 font-semibold transition ${
            activeTab === "matches"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Users size={18} />
          Your Matches
          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-primary">
            {matches.length}
          </span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">
          Loading your connections...
        </div>
      ) : displayedUsers.length === 0 ? (
        /* Empty state */
        <div className="rounded-3xl border border-pink-100 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 text-primary">
            {activeTab === "likes" ? (
              <Heart size={36} />
            ) : (
              <Users size={36} />
            )}
          </div>

          <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
            {activeTab === "likes"
              ? "No likes yet"
              : "Your story starts with a like"}
          </h2>

          <p className="mx-auto mt-3 max-w-md text-gray-500">
            {activeTab === "likes"
              ? "When someone likes your profile, they will appear here."
              : "When you and another person like each other, your match will appear here."}
          </p>
        </div>
      ) : (
        /* User cards */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedUsers.map((item) => {
            const user = getUser(item);

            if (!user) return null;

            const age = calculateAge(user.dateOfBirth);

            const id =
              user.id ||
              user._id ||
              item.interactionId ||
              item.matchId;

            return (
              <article
                key={id}
                className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Photo */}
                <div className="flex h-56 items-center justify-center bg-gradient-to-br from-pink-100 to-rose-200">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name || "User"}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl font-extrabold text-primary shadow">
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {user.name || "Unknown user"}
                      {age !== null && `, ${age}`}
                    </h2>

                    <Heart
                      size={19}
                      className="shrink-0 text-primary"
                      fill="currentColor"
                    />
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
                    {user.bio || "No bio added yet."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(user.interests || [])
                      .slice(0, 4)
                      .map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {interest}
                        </span>
                      ))}
                  </div>

                  {activeTab === "likes" && (
                    <p className="mt-4 text-sm font-medium text-primary">
                      Liked your profile
                    </p>
                  )}

                  <button
                    type="button"
                    disabled
                    title="Chat functionality has not been implemented yet"
                    className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-500"
                  >
                    <MessageCircle size={18} />
                    Chat coming soon
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
