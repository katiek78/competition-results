import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import { backendUrl } from "./constants";

const PasswordReset = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const token = urlParams.get("token");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    resetPassword();
  };

  const resetPassword = async () => {
    try {
      const configuration = {
        method: "put",
        url: `${backendUrl}/password-reset/`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { password },
      };

      await axios(configuration);
      setSuccessMessage("Your password has been reset successfully.");
      setErrorMessage("");
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error.response?.status === 400 && error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(
          "Sorry, an error occurred. Your password has not been reset. " +
            (error.response?.data?.message || "Please try again.")
        );
      }
      setSuccessMessage("");
    }
  };

  useEffect(() => {
    if (!token) {
      setErrorMessage("The link has expired or is invalid.");
    }
  }, [token]);

  return (
    <div>
      <h1 className="text-center">Password reset</h1>
      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : (
        <Form onSubmit={(e) => handleSubmit(e)}>
          <Form.Group controlId="formBasicPassword">
            <Form.Label>New password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            onClick={(e) => handleSubmit(e)}
          >
            Reset my password
          </Button>
        </Form>
      )}
      {successMessage && (
        <p className="success-message">{successMessage}</p>
      )}
      <br />
      <Link to={`/login/`}>Log in</Link>
    </div>
  );
};

export default PasswordReset;
