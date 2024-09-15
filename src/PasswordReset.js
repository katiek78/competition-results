import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import axios from "axios";

const PasswordReset = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const token = urlParams.get("token");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    resetPassword();
  };

  const resetPassword = async () => {
    try {
      const configuration = {
        method: "put",
        url: `https://competition-results.onrender.com/password-reset/`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { password },
      };

      const response = await axios(configuration);
      setSuccessMessage("Your password has been reset successfully.");
    } catch (error) {
      console.error("Error resetting password:", error);
      setSuccessMessage(
        "Sorry, an error occurred. Your password has not been reset. " +
          error.response.data.message
      );
    }
  };

  useEffect(() => {
    //check token validity
    if (!token) {
      setSuccessMessage("The link has expired or is invalid.");
    }
  }, [token]);

  return (
    <div>
      <h1 className="text-center">Password reset</h1>
      <Form onSubmit={(e) => handleSubmit(e)}>
        {/* password */}
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

        {/* submit button */}
        <Button
          variant="primary"
          type="submit"
          onClick={(e) => handleSubmit(e)}
        >
          Reset my password
        </Button>

        {/* {register && (
          <p className="text-success">Registered successfully</p>
        )} */}
      </Form>
      <p className="success-message">{successMessage}</p>
      <br />
      <Link to={`/login/`}>Log in</Link>
    </div>
  );
};

export default PasswordReset;
