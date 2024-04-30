import React, { useEffect, useState } from "react";
import axios from "axios";

const EmailChange = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const token = urlParams.get("token");
  const userId = urlParams.get("userId");
  const [successMessage, setSuccessMessage] = useState("");

  const updateEmail = async (userId, token) => {
    //     try {
    //       // Send a request to your backend API to update the user's email
    //       const response = await fetch(
    //         `https://competition-results.onrender.com/email-update/${userId}`,
    //         {
    //           method: "PUT",
    //           headers: {
    //             "Content-Type": "application/json",
    //           },
    //           body: JSON.stringify({ token }),
    //         }
    //       );

    //       if (response.ok) {
    //         // Email address updated successfully
    //         // You can handle success actions here, such as displaying a success message
    //         console.log("Email address updated successfully");
    //       } else {
    //         // Handle errors if the request fails
    //         // For example, you can display an error message to the user
    //         console.error("Failed to update email address:", response.statusText);
    //       }
    //     } catch (error) {
    //       // Handle network errors or other exceptions
    //       console.error("An error occurred:", error.message);
    //     }
    //   };

    try {
      const configuration = {
        method: "put",
        url: `https://competition-results.onrender.com/email-update/${userId}`,
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

    //   const saveUser = async (changes) => {
    //     try {
    //       const updatedUser = {
    //         ...userData,
    //         ...changes,
    //       };

    //       // set configurations
    //       const configuration = {
    //         method: "put",
    //         url: `https://competition-results.onrender.com/user/${user.userId}`,
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //         },
    //         data: updatedUser,
    //       };
    //       const response = await axios(configuration);
    //       console.log("User updated:", response.data);
    //       setUserData({
    //         ...userData,
    //         ...changes,
    //       });
    //     } catch (error) {
    //       console.error("Error updating user:", error);
    //     }
    //   };
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
