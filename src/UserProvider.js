import React, { useEffect, createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken } from "./utils";

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();

    if (token) {
      // Decode the token and extract user ID
      const decodedToken = jwtDecode(token);

      if (decodedToken && decodedToken.userId) {
        // Set the user state with the decoded user ID
        setUser({ userId: decodedToken.userId });
      }
    }
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
  };

  const clearUser = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export { UserProvider, useUser };
