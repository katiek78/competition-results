import React, { useState, useEffect } from "react";
import { useUser } from "./UserProvider";
import axios from "axios";
import { backendUrl } from "./constants";
import { getToken, fetchCurrentUserData } from "./utils";
import { Button } from "react-bootstrap";

const AdminResetPassword = () => {
  const { user } = useUser();
  const [userData, setUserData] = useState({});
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const token = getToken();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user || !user.userId) return;
        const fetchedData = await fetchCurrentUserData(user.userId);

        if (fetchedData) {
          setUserData(fetchedData);
        } else {
          console.log("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };
    fetchData();
  }, [user, token]);

  if (!user || !userData || userData.role !== "superAdmin") {
    console.log(userData.role);
    return <div>Access denied.</div>;
  }

  const handleReset = async () => {
    setStatus("");
    setNewPassword("");
    try {
      const response = await axios.put(
        `${backendUrl}/admin/reset_password`,
        { email }, // <-- send email, not username
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (
        response.data &&
        response.data.success &&
        response.data.tempPassword
      ) {
        setNewPassword(response.data.tempPassword);
        setStatus("Password reset successfully.");
      } else {
        setStatus("Password reset, but no password returned.");
      }
    } catch (err) {
      setStatus("Error resetting password.");
      setNewPassword("");
    }
  };

  return (
    <div className="maintext">
      <h2>Reset User Password</h2>
      <label>
        Email:
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <Button onClick={handleReset} disabled={!email}>
        Reset Password
      </Button>
      {status && <div>{status}</div>}
      {newPassword && (
        <div style={{ marginTop: "1em" }}>
          <strong>New Password:</strong>{" "}
          <code id="new-password">{newPassword}</code>
          <Button
            size="sm"
            style={{ marginLeft: "1em" }}
            onClick={() => {
              navigator.clipboard.writeText(newPassword);
            }}
          >
            Copy
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminResetPassword;
