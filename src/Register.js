import React, { useState } from "react";
import axios from "axios";
import { Form, Button } from "react-bootstrap";
import { backendUrl, duplicateEmailMessage } from "./constants";
import { COUNTRIES } from "./utils";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [iamId, setIamId] = useState("");
  const [country, setCountry] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [register, setRegister] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");

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
        iamId,
        country,
        birthYear,
        verified: false, // Explicitly set new users as unverified
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

        // Don't redirect - show verification message instead
        setMessage(
          `Registration successful! We've sent a verification email to ${email}. Please check your inbox and click the verification link to activate your account.`
        );
      })
      .catch((error) => {
        console.log(error);
        setIsSubmitted(true);
        if (error.response?.data.message === "Email already exists") {
          setMessage(duplicateEmailMessage);
        } else {
          setMessage("Registration failed.");
        }
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

        {/* IAM ID */}
        <Form.Group controlId="formBasicIamId">
          <Form.Label>IAM ID (if known)</Form.Label>
          <Form.Control
            type="text"
            name="iamId"
            value={iamId}
            onChange={(e) => setIamId(e.target.value)}
            placeholder="IAM ID (optional)"
          />
        </Form.Group>

        {/* Country */}
        <Form.Group controlId="formBasicCountry">
          <Form.Label>Country</Form.Label>
          <Form.Control
            as="select"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Select a country...</option>
            {COUNTRIES.map((countryName) => (
              <option key={countryName} value={countryName}>
                {countryName}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        {/* Birth Year */}
        <Form.Group controlId="formBasicBirthYear">
          <Form.Label>Birth Year</Form.Label>
          <Form.Control
            type="number"
            name="birthYear"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="Birth Year (e.g., 1990)"
            min="1900"
            max={new Date().getFullYear()}
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
          disabled={register} // Disable button after successful registration
        >
          Register
        </Button>

        {register && (
          <div className="alert alert-success mt-3" role="alert">
            <h5>Registration Successful!</h5>
            <p>{message}</p>
            <hr />
            <p className="mb-0">
              Don't see the email? Check your spam folder or{" "}
              <a href="/register" className="alert-link">
                try registering again
              </a>
              .
            </p>
          </div>
        )}
        {!register && isSubmitted && (
          <div className="alert alert-danger mt-3" role="alert">
            {message}
          </div>
        )}
      </Form>
    </>
  );
}
