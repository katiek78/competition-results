import React, { useEffect, useState } from "react";
import { useUser } from "./UserProvider";
import { Container, Col, Row, Button } from "react-bootstrap";
import Register from "./Register";
import Login from "./Login";
import axios from "axios";
import Cookies from "universal-cookie";
import NameForm from "./NameForm";
import EmailForm from "./EmailForm";
import PasswordForm from "./PasswordForm";
import { fetchCurrentUserData, generateToken } from "./utils";
import { backendUrl } from "./constants";

const cookies = new Cookies();

export default function Account() {
  const [showNameInputs, setShowNameInputs] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmEmailRequestSent, setConfirmEmailRequestSent] = useState("");
  const { user } = useUser();
  const [userData, setUserData] = useState({});
  const token = cookies.get("TOKEN");

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

  // const handleSubmitEmail = (email) => {
  //     setShowEmailInput(false);
  //     saveUser({ email });
  // }

  const handleSubmitEmail = async (newEmail) => {
    try {
      setConfirmEmailRequestSent("");
      // Do not take action if new email is same as existing
      if (newEmail === userData.email) {
        alert("Email has not changed.");
        return;
      }

      // Generate a token to be sent
      const confirmationToken = generateToken();
      const confirmationURL = `http://localhost:3000/email-change?token=${confirmationToken}&userId=${user.userId}`;

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

  const handleSubmitPassword = async (oldPassword, newPassword) => {
    setErrorMessage("");

    try {
      const configuration = {
        method: "post",
        url: `${backendUrl}/change-password`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          oldPassword,
          newPassword,
        },
      };
      const response = await axios(configuration);
      console.log("User updated:", response.data);
      setConfirmMessage("Password changed successfully.");
      // setUserData({
      //     ...userData,
      //     ...changes
      // });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Unauthorized (incorrect old password)
        setErrorMessage("Old password is incorrect.");
      } else {
        console.error("Error updating user:", error);
      }
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
        url: `${backendUrl}/user/${user.userId}`,
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
              <Button className="IAMbutton" onClick={handleShowPasswordForm}>
                Change password
              </Button>

              {showPasswordForm && (
                <>
                  <PasswordForm onSubmitPassword={handleSubmitPassword} />
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
