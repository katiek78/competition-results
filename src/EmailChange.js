import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl } from "./constants";

const EmailChange = () => {
  const navigate = useNavigate();
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const token = urlParams.get("token");
  const userId = urlParams.get("userId");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateEmail = async (userId, token) => {
    try {
      const configuration = {
        method: "put",
        url: `${backendUrl}/email-update/${userId}`,
        data: { token },
      };

      const response = await axios(configuration);
      console.log("Email updated:", response.data);
      setSuccessMessage(
        "Your email address has been changed successfully. Please log in again with your new email."
      );
      setErrorMessage("");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Error updating email:", error);
      if (error.response?.status === 404 && error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(
          "Sorry, an error occurred. Your email address has not been changed. " +
            (error.response?.data?.message || "Please try again.")
        );
      }
      setSuccessMessage("");
    }
  };

  useEffect(() => {
    if (!token) {
      setErrorMessage("The link has expired or is invalid.");
      return;
    }

    updateEmail(userId, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  return (
    <div>
      <h1 className="text-center">Email change</h1>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
          <br />
          <small>Redirecting to login in 3 seconds...</small>
        </div>
      )}
    </div>
  );
};

export default EmailChange;
