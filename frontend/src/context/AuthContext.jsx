import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios.config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myHotelId, setMyHotelId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
  try {
    const res = await api.get("/users/me");

    const userData = res.data.user;

    setUser(userData);
    setIsLoggedIn(true);

    if (userData.role === "owner") {
      const hotelRes = await api.get("/hotels/my/hotel");

      if (
        hotelRes.data &&
        hotelRes.data.hotels &&
        hotelRes.data.hotels.length > 0
      ) {
        setMyHotelId(hotelRes.data.hotels[0]._id);
      }
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    setUser(null);
    setIsLoggedIn(false);
    setMyHotelId(null);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUserData();
  }, []);

  const login = async () => {
  await fetchUserData();
};

  const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.error(err);
  }

  localStorage.removeItem("accessToken");
  setUser(null);
  setIsLoggedIn(false);
  setMyHotelId(null);
};

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        userRole: user?.role || "user",
        myHotelId,
        loading,
        login,
        logout,
        refreshUser: fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
