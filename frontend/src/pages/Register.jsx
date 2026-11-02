import { useState } from "react";
import { Heart } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dateOfBirth: "",
    gender: "female",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/discover" replace />;
  }

  const today = new Date();
  today.setFullYear(today.getFullYear() - 18);
  const latestBirthDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.dateOfBirth > latestBirthDate) {
      setError("You must be at least 18 years old to register.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      });

      navigate("/discover", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check your details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-100 px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl sm:p-10">
        <div className="mb-6 flex items-center gap-3">
          <Heart className="text-primary" fill="currentColor" size={38} />
          <span className="text-2xl font-extrabold">
            Heart<span className="text-primary">ly</span>
          </span>
        </div>

        <p className="font-semibold text-primary">JOIN HEARTLY</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-gray-500">
          Meet new people and discover meaningful connections.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Full name
            </label>
            <input
              name="name"
              type="text"
              minLength={2}
              maxLength={50}
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="form-input"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Email address
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="form-input"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Password
            </label>
            <input
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              className="form-input"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Date of birth
            </label>
            <input
              name="dateOfBirth"
              type="date"
              max={latestBirthDate}
              required
              value={form.dateOfBirth}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Gender
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="form-input"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3.5 font-bold text-white transition hover:bg-rose-600 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}