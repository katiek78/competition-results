import React, { useEffect, useState } from "react";
import { useUser } from "./UserProvider";
import { Container, Col, Row, Button } from "react-bootstrap";
import Register from "./Register";
import Login from "./Login";
import axios from "axios";
import NameForm from "./NameForm";
import EmailForm from "./EmailForm";
import {
  fetchCurrentUserData,
  generateToken,
  getToken,
  COUNTRIES,
} from "./utils";
import { backendUrl, frontendUrl, duplicateEmailMessage } from "./constants";

export default function Account() {
  const [showNameInputs, setShowNameInputs] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showCountryInput, setShowCountryInput] = useState(false);
  const [showBirthYearInput, setShowBirthYearInput] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmEmailRequestSent, setConfirmEmailRequestSent] = useState("");
  const { user } = useUser();
  const [userData, setUserData] = useState({});
  const token = getToken();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const fetchedData = await fetchCurrentUserData(user.userId);
        if (fetchedData) {
          // Do something with the userData
          setUserData(fetchedData);
        } else {
          console.log("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };
    fetchData();
    //  setUserData(user);
  }, [user, token]); // The empty dependency array ensures the effect runs only once on mount

  const handleSubmitName = (firstName, lastName) => {
    setShowNameInputs(false);
    saveUser({ firstName, lastName });
  };

  const handleSubmitCountry = (country) => {
    setShowCountryInput(false);
    saveUser({ country });
  };

  const handleSubmitBirthYear = (birthYear) => {
    setShowBirthYearInput(false);
    saveUser({ birthYear });
  };

  // const handleSubmitEmail = (email) => {
  //     setShowEmailInput(false);
  //     saveUser({ email });
  // }

  const handleSubmitEmail = async (newEmail) => {
    try {
      setConfirmEmailRequestSent("");

      // Do not take action if new email exists in database already
      const configurationUsers = {
        method: "get",
        url: `${backendUrl}/users`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const responseUsers = await axios(configurationUsers);
      const users = responseUsers.data.users;
      if (!users) {
        console.log("No users found");
        return;
      }
      const existingUser = users.find((u) => u.email === newEmail);
      if (existingUser) {
        alert(duplicateEmailMessage);
        return;
      }

      // Do not take action if new email is same as existing
      if (newEmail === userData.email) {
        alert("Email has not changed.");
        return;
      }

      // Generate a token to be sent
      const confirmationToken = generateToken();
      const confirmationURL = `${frontendUrl}/email-change?token=${confirmationToken}&userId=${user.userId}`;

      // Determine when the token expires
      const createdAt = new Date();
      const expiresAt = new Date(Date.now() + 3600 * 1000); // Token expires in 1 hour

      // Send a request to the backend to initiate email change
      const configuration = {
        method: "post",
        url: `${backendUrl}/initiate-email-change`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          to: newEmail,
          createdAt,
          expiresAt,
          dynamic_link: confirmationURL,
          token: confirmationToken,
          userId: user.userId,
        },
      };

      const response = await axios(configuration);

      // Handle the response (e.g., show a message to the user)
      console.log("Initiate Email Change Response:", response.data);
      setConfirmEmailRequestSent(
        "An email has been sent to the address you just entered. Click on the link in the email to confirm this change."
      );
      setShowEmailInput(false);
    } catch (error) {
      console.error("Error initiating email change:", error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  const handleSubmitPassword = async () => {
    setErrorMessage("");
    setConfirmMessage("");

    try {
      // Generate a token to be sent
      const confirmationToken = generateToken();
      const confirmationURL = `${frontendUrl}/password-reset?token=${confirmationToken}`;

      // Determine when the token expires
      const createdAt = new Date();
      const expiresAt = new Date(Date.now() + 3600 * 1000); // Token expires in 1 hour

      // Send a request to the backend to initiate password change
      const configuration = {
        method: "post",
        url: `${backendUrl}/initiate-password-change`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          createdAt,
          expiresAt,
          dynamic_link: confirmationURL,
          token: confirmationToken,
          email: userData.email,
        },
      };

      const response = await axios(configuration);

      // Handle the response
      console.log("Initiate Password Change Response:", response.data);
      setConfirmMessage(
        "An email has been sent to your email address. Click on the link in the email to reset your password."
      );
      setShowPasswordForm(false);
    } catch (error) {
      console.error("Error initiating password reset:", error);
      setErrorMessage("Failed to initiate password reset. Please try again.");
    }
  };

  const saveUser = async (changes) => {
    try {
      const updatedUser = {
        ...userData,
        ...changes,
      };

      // set configurations
      const configuration = {
        method: "put",
        url: `${backendUrl}/user-update/${user.userId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: updatedUser,
      };
      const response = await axios(configuration);
      console.log("User updated:", response.data);
      setUserData({
        ...userData,
        ...changes,
      });
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleShowPasswordForm = () => {
    setShowPasswordForm(true);
  };

  const handleCancelEmailEdit = () => {
    setShowEmailInput(false);
  };

  return (
    <>
      {token ? (
        <Container>
          <Row>
            <h1>My account</h1>
            <div className="maintext">
              {!showNameInputs && (
                <>
                  Name: {userData.firstName || ""} {userData.lastName || ""}
                  <Button onClick={() => setShowNameInputs(true)}>Edit</Button>
                </>
              )}
              {showNameInputs && (
                <>
                  <NameForm
                    onSubmitName={handleSubmitName}
                    form={{
                      firstName: userData.firstName,
                      lastName: userData.lastName,
                    }}
                  />
                </>
              )}
              <br />
              {!showEmailInput && (
                <>
                  Email: {userData.email || ""}
                  <Button onClick={() => setShowEmailInput(true)}>Edit</Button>
                </>
              )}
              {showEmailInput && (
                <>
                  <EmailForm
                    handleCancel={handleCancelEmailEdit}
                    onSubmitEmail={handleSubmitEmail}
                    form={{ email: userData.email }}
                  />
                </>
              )}
              <br />
              <span>{confirmEmailRequestSent}</span>
              <br />
              {!showCountryInput && (
                <>
                  Country: {userData.country || "Not specified"}
                  <Button onClick={() => setShowCountryInput(true)}>
                    Edit
                  </Button>
                </>
              )}
              {showCountryInput && (
                <>
                  <label>Country: </label>
                  <select
                    defaultValue={userData.country || ""}
                    onBlur={(e) => handleSubmitCountry(e.target.value)}
                    onChange={(e) => handleSubmitCountry(e.target.value)}
                    autoFocus
                  >
                    <option value="">Select a country...</option>
                    {COUNTRIES.map((countryName) => (
                      <option key={countryName} value={countryName}>
                        {countryName}
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => setShowCountryInput(false)}>
                    Cancel
                  </Button>
                </>
              )}
              <br />
              {!showBirthYearInput && (
                <>
                  Birth Year: {userData.birthYear || "Not specified"}
                  <Button onClick={() => setShowBirthYearInput(true)}>
                    Edit
                  </Button>
                </>
              )}
              {showBirthYearInput && (
                <>
                  <label>Birth Year: </label>
                  <input
                    type="number"
                    defaultValue={userData.birthYear || ""}
                    min="1900"
                    max={new Date().getFullYear()}
                    onBlur={(e) => handleSubmitBirthYear(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSubmitBirthYear(e.target.value);
                      }
                    }}
                    autoFocus
                  />
                  <Button onClick={() => setShowBirthYearInput(false)}>
                    Cancel
                  </Button>
                </>
              )}
              <br />
              IAM ID: {userData.iamId || "Not specified"}
              <br />
              <Button className="IAMbutton" onClick={handleShowPasswordForm}>
                Change password
              </Button>
              {showPasswordForm && (
                <>
                  <p>
                    Click the button below to receive an email with a link to
                    reset your password.
                  </p>
                  <Button onClick={handleSubmitPassword} className="IAMbutton">
                    Send Password Reset Email
                  </Button>
                  <Button
                    onClick={() => setShowPasswordForm(false)}
                    className="IAMbutton"
                  >
                    Cancel
                  </Button>
                  <br />
                  <span>{confirmMessage}</span>
                  <span className="text-danger">{errorMessage}</span>
                </>
              )}
            </div>
          </Row>
        </Container>
      ) : (
        <Container>
          <Row>
            <Col xs={12} sm={12} md={6} lg={6}>
              <Register />
            </Col>
            <Col xs={12} sm={12} md={6} lg={6}>
              <Login />
            </Col>
          </Row>
        </Container>
      )}
    </>
  );
}
