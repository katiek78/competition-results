import React, { useState } from "react";
import axios from "axios";
import { Form, Button } from "react-bootstrap";
import { backendUrl } from "./constants";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [register, setRegister] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const sendRegistrationMail = async (eml, fn) => {
    try {
      await axios.post(`${backendUrl}/send-email`, {
        to: eml,
        subject: "Welcome to the IAM Results Centre",
        html: `Dear ${fn}, <br />Thanks for registering!`,
      });

      console.log("Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const handleSubmit = (e) => {
    // prevent the form from refreshing the whole page
    e.preventDefault();

    // set configurations
    const configuration = {
      method: "post",
      url: `${backendUrl}/register`,
      data: {
        email,
        firstName,
        lastName,
        password,
      },
    };

    // make the API call
    axios(configuration)
      .then((result) => {
        setRegister(true);
        setIsSubmitted(true);

        //send an email
        sendRegistrationMail(
          configuration.data.email,
          configuration.data.firstName
        );

        // redirect user to the home page
        window.location.href = "/";
      })
      .catch((error) => {
        error = new Error();
        console.log(error);
        setIsSubmitted(true);
      });
  };

  return (
    <>
      <h2>Register</h2>
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

        {/* first name */}
        <Form.Group controlId="formBasicFirstName">
          <Form.Label>First name</Form.Label>
          <Form.Control
            type="text"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        </Form.Group>

        {/* last name */}
        <Form.Group controlId="formBasicLastName">
          <Form.Label>Last name</Form.Label>
          <Form.Control
            type="text"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
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
          Register
        </Button>

        {/* {register && (
          <p className="text-success">Registered successfully</p>
        )} */}
        {!register && isSubmitted && (
          <p className="text-danger">Registration failed</p>
        )}
      </Form>
    </>
  );
}
