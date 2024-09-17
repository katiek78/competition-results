import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "./constants";

const EmailChange = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const token = urlParams.get("token");
  const userId = urlParams.get("userId");
  const [successMessage, setSuccessMessage] = useState("");

  const updateEmail = async (userId, token) => {
    try {
      const configuration = {
        method: "put",
        url: `${backendUrl}/email-update/${userId}`,
        headers: {
          // Authorization: `Bearer ${token}`,
        },
        //data: JSON.stringify({ token }),
        data: { token },
      };

      const response = await axios(configuration);
      console.log("Email updated:", response.data);
      setSuccessMessage(
        "Your email address has been changed successfully." + response.message
      );
    } catch (error) {
      console.error("Error updating email:", error);
      setSuccessMessage(
        "Sorry, an error occurred. Your email address has not been changed. " +
          error.response.data.message
      );
    }
  };
  useEffect(() => {
    //check token validity
    console.log(token); //undefined
    if (!token) return;

    //saveUser({ email });
    updateEmail(userId, token);
  }, [userId, token]);

  return (
    <div>
      <h1 className="text-center">Email change</h1>

      <p className="success-message">{successMessage}</p>
    </div>
  );
};

export default EmailChange;
