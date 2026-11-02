import { Heart, LogOut, MessageCircle, Settings, UserRound } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/discover", label: "Discover", icon: Heart },
  { to: "/matches", label: "Matches", icon: MessageCircle },
  { to: "/profile", label: "My Profile", icon: UserRound },
  { to: "/preferences", label: "Preferences", icon: Settings },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-pink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <NavLink to="/discover" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
            <Heart fill="currentColor" size={22} />
          </span>

          <span className="text-2xl font-extrabold tracking-tight text-gray-900">
            Heart<span className="text-primary">ly</span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm font-semibold transition ${
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-primary"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden max-w-32 truncate text-sm font-semibold text-gray-700 sm:block">
            {user?.name}
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-red-200 hover:text-red-600"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <nav className="flex justify-around border-t border-pink-50 px-2 py-3 md:hidden">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs ${
                isActive ? "text-primary" : "text-gray-500"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}