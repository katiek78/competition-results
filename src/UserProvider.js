import React, { useEffect, createContext, useContext, useState } from 'react';
import Cookies from "universal-cookie";
import { jwtDecode } from "jwt-decode";

const UserContext = createContext();
//const cookies = new Cookies();
//const token = cookies.get("TOKEN");

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  

  console.log('UserProvider - User:', user);


  useEffect(() => {
    const cookies = new Cookies();
    const token = cookies.get("TOKEN");

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
    console.log(userData.email)
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
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export { UserProvider, useUser };