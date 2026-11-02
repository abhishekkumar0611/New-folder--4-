import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("dating_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem("dating_token"))
  );

  useEffect(() => {
    const token = localStorage.getItem("dating_token");

    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    api
      .get("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;

        const currentUser = data.user;

        if (currentUser) {
          setUser(currentUser);
          localStorage.setItem(
            "dating_user",
            JSON.stringify(currentUser)
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("dating_token");
          localStorage.removeItem("dating_user");
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveAuth = (data) => {
    localStorage.setItem("dating_token", data.token);
    localStorage.setItem("dating_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    saveAuth(data);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    saveAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("dating_token");
    localStorage.removeItem("dating_user");
    setUser(null);
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}