import React, { useState } from "react";
import { useUser } from "./UserProvider";
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, setLogin] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
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

        // console.log(result.data.email);
        // console.log(result.data.id);

        // redirect user to the home page
        window.location.href = "/";
      })
      .catch((error) => {
        error = new Error();
        console.log(error);
        setIsResolved(true);
      });
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

        {!login && isResolved && <p className="text-danger">Login failed</p>}
      </Form>
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
