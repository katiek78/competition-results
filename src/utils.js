import axios from "axios";
import Cookies from "universal-cookie";

export const fetchCurrentUserData = async (userId) => {
  try {
    const cookies = new Cookies();
    const token = cookies.get("TOKEN");

    const configuration = {
      method: "get",
      url: `https://competition-results.onrender.com/user/${userId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Use the user ID to fetch additional user data
    const result = await axios(configuration);

    return result.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const generateToken = (length = 32) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    token += charset[randomIndex];
  }
  return token;
};
