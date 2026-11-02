import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import Preferences from "./pages/Preferences";
import Matches from "./pages/Matches";

function AppLayout() {
  return (
    <>
      <Navbar />

      <div className="min-h-[calc(100vh-80px)] bg-gray-50">
        <Routes>
          <Route path="/discover" element={<Discover />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/matches" element={<Matches />} />

          <Route path="*" element={<Navigate to="/discover" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-200 border-t-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/discover" replace /> : <Login />}
      />

      <Route
        path="/register"
        element={user ? <Navigate to="/discover" replace /> : <Register />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AppLayout />} />
      </Route>
    </Routes>
  );
}

export default App;