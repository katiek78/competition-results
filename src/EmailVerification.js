import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { Container } from "react-bootstrap";
import { backendUrl } from "./constants";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

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
        const configuration = {
          method: "get",
          url: `${backendUrl}/verify-email?token=${token}`,
        };

        const response = await axios(configuration);
        console.log("Email verification response:", response.data);

        if (response.data.success) {
          setVerificationStatus("success");
          setMessage("Your email has been verified successfully!");
          setUserEmail(response.data.email || "");

          // Send welcome email
          if (response.data.email && response.data.firstName) {
            try {
              await axios.post(`${backendUrl}/send-email`, {
                to: response.data.email,
                subject: "Welcome to the IAM Results Centre!",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to the IAM Results Centre!</h2>
                    <p>Dear ${response.data.firstName},</p>
                    <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
                    <p>You can now:</p>
                    <ul>
                      <li>Participate in memory competitions</li>
                      <li>Track your scores and progress</li>
                      <li>View competition results</li>
                      <li>Connect with the memory sports community</li>
                    </ul>
                    <p>
                      <a href="${window.location.origin}/login" 
                         style="background-color: #007bff; color: white; padding: 10px 20px; 
                                text-decoration: none; border-radius: 5px; display: inline-block;">
                        Login to Your Account
                      </a>
                    </p>
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    <p>Best regards,<br>The IAM Results Centre Team</p>
                  </div>
                `,
              });
              console.log("Welcome email sent successfully");
            } catch (emailError) {
              console.error("Error sending welcome email:", emailError);
              // Don't fail verification if welcome email fails
            }
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
            "An error occurred during email verification. Please try again."
          );
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

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
            <h2 style={{ color: "#28a745" }}>Email Verified Successfully!</h2>
            <p className="lead">{message}</p>
            {userEmail && (
              <p>
                A welcome email has been sent to <strong>{userEmail}</strong>
              </p>
            )}
            <div style={{ marginTop: "30px" }}>
              <Link
                to="/login"
                className="btn btn-primary btn-lg"
                style={{ marginRight: "10px" }}
              >
                Login to Your Account
              </Link>
              <Link to="/" className="btn btn-outline-secondary btn-lg">
                Go to Home
              </Link>
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
              <Link
                to="/register"
                className="btn btn-primary btn-lg"
                style={{ marginRight: "10px" }}
              >
                Register Again
              </Link>
              <Link to="/login" className="btn btn-outline-secondary btn-lg">
                Try to Login
              </Link>
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
