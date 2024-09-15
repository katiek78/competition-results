import React, { useState } from "react";
import { useUser } from "./UserProvider";
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import Cookies from "universal-cookie";
import { generateToken } from "./utils";
import EmailForm from "./EmailForm";

const cookies = new Cookies();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, setLogin] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [confirmPasswordRequestSent, setConfirmPasswordRequestSent] =
    useState(false);
  const { updateUser } = useUser();

  const handleSubmit = (e) => {
    // prevent the form from refreshing the whole page
    e.preventDefault();

    setIsSubmitted(true);

    // set configurations
    const configuration = {
      method: "post",
      url: "https://competition-results.onrender.com/login",
      data: {
        email,
        password,
      },
    };

    // make the API call
    axios(configuration)
      .then((result) => {
        setLogin(true);
        setIsResolved(true);

        // set the cookie
        cookies.set("TOKEN", result.data.token, {
          path: "/",
        });

        // Update the user in the context provider
        updateUser({ userId: result.data.id });

        // redirect user to the home page
        window.location.href = "/";
      })
      .catch((error) => {
        error = new Error();
        console.log(error);
        setIsResolved(true);
      });
  };

  const handleForgottenPassword = () => {
    setConfirmPasswordRequestSent("");
    setShowEmailInput(true);
  };

  const handleCancelEmailEdit = () => {
    setShowEmailInput(false);
  };

  const handlePasswordReset = async () => {
    try {
      // Generate a token to be sent
      const confirmationToken = generateToken();
      //  const confirmationURL = `http://localhost:3000/password-reset?token=${confirmationToken}&email=${encodeURIComponent(
      //   email
      const confirmationURL = `http://localhost:3000/password-reset?token=${confirmationToken}`;
      // )};

      // Determine when the token expires
      const createdAt = new Date();
      const expiresAt = new Date(Date.now() + 3600 * 1000); // Token expires in 1 hour

      // Send a request to the backend to initiate password change
      const configuration = {
        method: "post",
        url: "https://competition-results.onrender.com/initiate-password-change",
        headers: {
          // Authorization: `Bearer ${token}`,
        },
        data: {
          createdAt,
          expiresAt,
          dynamic_link: confirmationURL,
          token: confirmationToken,
          email,
        },
      };

      const response = await axios(configuration);

      // Handle the response (e.g., show a message to the user)
      console.log("Initiate Password Change Response:", response.data);
      setConfirmPasswordRequestSent(
        "An email has been sent to the address you just entered. Click on the link in the email to reset your password."
      );
      setShowEmailInput(false);
    } catch (error) {
      console.error("Error initiating password reset:", error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <>
      <h2>Log in</h2>
      <Form onSubmit={(e) => handleSubmit(e)}>
        {/* email */}
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
          />
        </Form.Group>

        {/* password */}
        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </Form.Group>

        {/* submit button */}
        <Button
          variant="primary"
          type="submit"
          onClick={(e) => handleSubmit(e)}
        >
          Login
        </Button>
      </Form>
      {!login && isResolved && (
        <>
          <p className="text-danger">Login failed</p>
          <p className="link" onClick={handleForgottenPassword}>
            Forgotten password?
          </p>
          {showEmailInput && (
            <>
              <p>
                Enter your email address here and we'll send you an email. Click
                on the link in the email to reset your password.
              </p>
              <EmailForm
                handleCancel={handleCancelEmailEdit}
                onSubmitEmail={handlePasswordReset}
                form={{ email: "" }}
              />
            </>
          )}
          <p>{confirmPasswordRequestSent}</p>
        </>
      )}

      {!login && isSubmitted && !isResolved && (
        <div className="login-container">
          <div className="login-message">
            <div className="loading-animation"></div>
            <p className="login-text">Logging you in...</p>
          </div>
          <div className="login-tips">
            <p className="tip">
              Did you know? You can reset your password anytime from the
              settings menu.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
