import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Form, Button } from "react-bootstrap";
import { backendUrl } from "./constants";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [activationRequired, setActivationRequired] = useState(false);
  const [activationToken, setActivationToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setVerificationStatus("error");
        setMessage("No verification token provided.");
        return;
      }

      try {
        // Call backend API to verify the email
        const response = await axios.get(
          `${backendUrl}/verify-email?token=${token}`,
        );
        console.log("Email verification response:", response.data);

        if (response.data.success) {
          // Check if activation is required
          if (response.data.activationRequired) {
            setActivationRequired(true);
            setActivationToken(response.data.activationToken);
            setVerificationStatus("setup-password");
            setMessage("Your email has been verified! Now set your password.");
          } else {
            setVerificationStatus("success");
            setMessage("Your email has been verified successfully!");
          }
        } else {
          setVerificationStatus("error");
          setMessage(response.data.message || "Email verification failed.");
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        setVerificationStatus("error");

        if (error.response?.data?.message) {
          setMessage(error.response.data.message);
        } else if (error.response?.status === 400) {
          setMessage("Invalid or expired verification token.");
        } else if (error.response?.status === 404) {
          setMessage("User not found or already verified.");
        } else {
          setMessage(
            "An error occurred during email verification. Please try again.",
          );
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    // Validate passwords
    if (!password) {
      setPasswordError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSettingPassword(true);

    try {
      const response = await axios.post(`${backendUrl}/user-activation`, {
        token: activationToken,
        password,
      });

      console.log("Password set successfully:", response.data);
      setVerificationStatus("success");
      setMessage("Account activated successfully! You can now log in.");
      setPassword("");
      setConfirmPassword("");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error setting password:", error);
      setPasswordError(
        error.response?.data?.message ||
          "Failed to set password. Please try again.",
      );
    } finally {
      setSettingPassword(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "verifying":
        return (
          <div className="text-center">
            <div
              className="loading-animation"
              style={{ margin: "20px auto" }}
            ></div>
            <h3>Verifying your email...</h3>
            <p>Please wait while we verify your email address.</p>
          </div>
        );

      case "setup-password":
        return (
          <div className="text-center">
            <h2>Set Your Password</h2>
            <p className="lead">{message}</p>
            <Form onSubmit={handleSetPassword} style={{ maxWidth: "400px", marginTop: "30px" }}>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={settingPassword}
                />
                <Form.Text className="text-muted">
                  At least 8 characters
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={settingPassword}
                />
              </Form.Group>

              {passwordError && (
                <div className="alert alert-danger" role="alert">
                  {passwordError}
                </div>
              )}

              <Button
                variant="primary"
                type="submit"
                disabled={settingPassword}
                className="w-100"
              >
                {settingPassword ? "Setting Password..." : "Activate Account"}
              </Button>
            </Form>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div
              style={{
                color: "#28a745",
                fontSize: "3rem",
                marginBottom: "20px",
              }}
            >
              ✓
            </div>
            <h2 style={{ color: "#28a745" }}>
              {activationRequired
                ? "Account Activated Successfully!"
                : "Email Verified Successfully!"}
            </h2>
            <p className="lead">{message}</p>
            <div style={{ marginTop: "30px" }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/login")}
                className="me-2"
              >
                Login to Your Account
              </Button>
              <Button
                variant="outline-secondary"
                size="lg"
                onClick={() => navigate("/")}
              >
                Go to Home
              </Button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div
              style={{
                color: "#dc3545",
                fontSize: "3rem",
                marginBottom: "20px",
              }}
            >
              ✗
            </div>
            <h2 style={{ color: "#dc3545" }}>Verification Failed</h2>
            <p className="lead text-danger">{message}</p>
            <div style={{ marginTop: "30px" }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/register")}
                className="me-2"
              >
                Register Again
              </Button>
              <Button
                variant="outline-secondary"
                size="lg"
                onClick={() => navigate("/login")}
              >
                Try to Login
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Container className="mt-5">
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {renderContent()}
      </div>
    </Container>
  );
};

export default EmailVerification;
