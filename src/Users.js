import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useUser } from "./UserProvider";
import { fetchCurrentUserData, getToken, COUNTRIES } from "./utils";
import { Button, Modal, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faTrash,
  faUserPlus,
  faUserTie,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { backendUrl } from "./constants";

const Users = () => {
  const token = useMemo(() => getToken(), []);
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState({});
  const [editingCountryUserId, setEditingCountryUserId] = useState(null);
  const [editingCountryValue, setEditingCountryValue] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state for add user
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    iamId: "",
    birthYear: "",
    country: "",
  });

  // Delete user handler (must be inside Users component)
  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? Their name will be removed from all the competitions they've taken part in."
      )
    )
      return;
    try {
      // set configurations
      const configuration = {
        method: "delete",
        url: `${backendUrl}/users/${userId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios(configuration);
      console.log("User deleted:", response.data);
      setUsers((prevUsers) => {
        // Use filter to exclude the user with the specified userId
        const newUsers = prevUsers.filter((user) => user._id !== userId);
        return newUsers;
      });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  function addUser() {
    setShowAddUserModal(true);
  }

  function handleAddUserFormChange(e) {
    const { name, value } = e.target;
    setAddUserForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddUserModalClose() {
    setShowAddUserModal(false);
    setAddUserForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      iamId: "",
      birthYear: "",
      country: "",
    });
  }

  async function handleAddUserFormSubmit(e) {
    e.preventDefault();
    await saveUser(addUserForm);
    handleAddUserModalClose();
  }

  async function addTestUser() {
    try {
      const response = await axios.get("https://randomuser.me/api/");
      const userData = response.data.results[0];
      // Generate random IAM Id (6 digits)
      const iamId = Math.floor(100000 + Math.random() * 900000).toString();
      // Generate random birth year (between 1950 and 2015)
      const birthYear = Math.floor(Math.random() * (2015 - 1950 + 1)) + 1950;
      // Pick a random country from COUNTRIES, fallback to API country
      const countryList =
        COUNTRIES && COUNTRIES.length > 0
          ? COUNTRIES
          : [userData.location.country];
      const country =
        countryList[Math.floor(Math.random() * countryList.length)];
      const newUser = {
        firstName: userData.name.first + " (TEST)",
        lastName: userData.name.last,
        email: userData.email,
        password: userData.login.password,
        iamId,
        birthYear,
        country,
      };
      saveUser(newUser);
    } catch (err) {
      console.log("error: ", err);
    }
  }

  const handleMakeUserSiteAdmin = async (userId) => {
    const user = fetchCurrentUserData(userId);

    if (!user) return;

    const updatedUser = {
      ...user,
      role: "admin",
    };

    try {
      // set configurations for editing a user
      const configuration = {
        method: "put",
        url: `${backendUrl}/user-update/${userId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: updatedUser,
      };
      const response = await axios(configuration);
      console.log("User is now site admin:", response.data);

      // setUsers(prevUsers => [...prevUsers, newUser]);

      setUsers((prevUsers) => {
        //update users
        const newUsers = prevUsers.map((user) => {
          if (user._id === userId) {
            return {
              ...user,
              role: "admin",
            };
          }
          return user;
        });
        return newUsers;
      });
    } catch (error) {
      console.error("Error making user siteAdmin:", error);
    }
  };

  const saveUser = async (newUser) => {
    try {
      // set configurations
      const configuration = {
        method: "post",
        url: `${backendUrl}/users`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: newUser,
      };
      const response = await axios(configuration);
      console.log("User added:", response.data);

      // setUsers(prevUsers => [...prevUsers, newUser]);

      setUsers((prevUsers) => {
        const newUsers = [...prevUsers, newUser];
        return newUsers;
      });
    } catch (error) {
      console.error("Error adding test user:", error);
    }
  };

  const handleEditCountry = (userId, currentCountry) => {
    setEditingCountryUserId(userId);
    setEditingCountryValue(currentCountry || "");
  };

  const handleSaveCountry = async (userId) => {
    try {
      // set configurations
      const configuration = {
        method: "put",
        url: `${backendUrl}/user-update/${userId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          country: editingCountryValue,
        },
      };
      const response = await axios(configuration);
      console.log("User country updated:", response.data);

      // Update the local state
      setUsers((prevUsers) => {
        const newUsers = prevUsers.map((user) => {
          if (user._id === userId) {
            return {
              ...user,
              country: editingCountryValue,
            };
          }
          return user;
        });
        return newUsers;
      });

      // Reset editing state
      setEditingCountryUserId(null);
      setEditingCountryValue("");
    } catch (error) {
      console.error("Error updating user country:", error);
    }
  };

  const handleCancelCountryEdit = () => {
    setEditingCountryUserId(null);
    setEditingCountryValue("");
  };

  const handleRefreshUsers = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        // return a faUserTie icon with tooltip "Site admin"
        return (
          <FontAwesomeIcon
            className="displayIcon adminIcon"
            icon={faUserTie}
            title="Site admin"
          />
        );
      case "superAdmin":
        return (
          <FontAwesomeIcon
            className="displayIcon superAdminIcon"
            icon={faStar}
            title="Superadmin"
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const fetchedData = await fetchCurrentUserData(user.userId);

        //only allow users who are admins or superAdmins
        if (fetchedData.role !== "superAdmin" && fetchedData.role !== "admin") {
          // redirect user to the home page
          window.location.href = "/";
        }

        if (fetchedData) {
          // Do something with the userData
          setUserData(fetchedData);

          // set configurations
          const configuration = {
            method: "get",
            url: `${backendUrl}/users`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          // make the API call
          axios(configuration)
            .then((result) => {
              console.log(`Fetched ${result.data.users.length} users from API`);
              console.log("Raw API response:", result.data.users);

              // Check if any users have verified field
              const usersWithVerified = result.data.users.filter((user) =>
                user.hasOwnProperty("verified")
              );
              console.log(
                `Users with 'verified' field: ${usersWithVerified.length}`
              );

              // Log a sample user object to see all fields
              if (result.data.users.length > 0) {
                console.log(
                  "Sample user object structure:",
                  Object.keys(result.data.users[0])
                );
                console.log("Full sample user:", result.data.users[0]);
              }

              // Filter out unverified users (treat undefined as verified for legacy users)
              const verifiedUsers = result.data.users.filter((user) => {
                const isVerified = user.verified !== false;
                if (user.verified === true) {
                  console.log(
                    `✓ ${user.firstName} ${user.lastName}: verified = true`
                  );
                } else if (user.verified === false) {
                  console.log(
                    `✗ ${user.firstName} ${user.lastName}: verified = false (filtered out)`
                  );
                } else {
                  console.log(
                    `? ${user.firstName} ${user.lastName}: verified = undefined (legacy user, treated as verified)`
                  );
                }
                return isVerified;
              });
              console.log(`Displaying ${verifiedUsers.length} verified users`);
              setUsers(verifiedUsers);
            })
            .catch((error) => {
              error = new Error();
              console.log(error);
            });
        } else {
          console.log("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };
    fetchData();
  }, [user, token, refreshKey]); // Include refreshKey to trigger re-fetch

  return (
    userData &&
    (userData.role === "superAdmin" || userData.role === "admin") && (
      <div>
        <h1 className="text-center">Users</h1>
        <div style={{ marginBottom: "15px" }}>
          <Button onClick={addUser} style={{ marginRight: "10px" }}>
            Add user
          </Button>
          <Button onClick={addTestUser} style={{ marginRight: "10px" }}>
            Add test user
          </Button>
          <Button onClick={handleRefreshUsers} variant="outline-primary">
            Refresh Users
          </Button>
        </div>
        <Modal show={showAddUserModal} onHide={handleAddUserModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>Add User</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAddUserFormSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  name="firstName"
                  value={addUserForm.firstName}
                  onChange={handleAddUserFormChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  name="lastName"
                  value={addUserForm.lastName}
                  onChange={handleAddUserFormChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={addUserForm.email}
                  onChange={handleAddUserFormChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={addUserForm.password}
                  onChange={handleAddUserFormChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>IAM ID (if they have one)</Form.Label>
                <Form.Control
                  name="iamId"
                  value={addUserForm.iamId}
                  onChange={handleAddUserFormChange}
                  maxLength={6}
                  minLength={0}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Birth Year</Form.Label>
                <Form.Control
                  name="birthYear"
                  value={addUserForm.birthYear}
                  onChange={handleAddUserFormChange}
                  type="number"
                  min={1950}
                  max={2015}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Select
                  name="country"
                  value={addUserForm.country}
                  onChange={handleAddUserFormChange}
                  required
                >
                  <option value="">Select a country...</option>
                  {COUNTRIES.map((countryName) => (
                    <option key={countryName} value={countryName}>
                      {countryName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleAddUserModalClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save User
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
        <table className="niceTable usersTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users
              .sort((a, b) =>
                a.lastName.localeCompare(
                  b.lastName || a.firstName.localeCompare(b.firstName)
                )
              )
              .map((usr) => (
                <tr key={usr._id}>
                  <td>
                    {editingCountryUserId === usr._id ? (
                      <div>
                        <span>{`${usr.firstName} ${usr.lastName} (`}</span>
                        <select
                          value={editingCountryValue}
                          onChange={(e) =>
                            setEditingCountryValue(e.target.value)
                          }
                          style={{ width: "150px", display: "inline" }}
                          autoFocus
                        >
                          <option value="">Select a country...</option>
                          {COUNTRIES.map((countryName) => (
                            <option key={countryName} value={countryName}>
                              {countryName}
                            </option>
                          ))}
                        </select>
                        <span>)</span>
                        <button
                          onClick={() => handleSaveCountry(usr._id)}
                          style={{ marginLeft: "5px", fontSize: "12px" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelCountryEdit}
                          style={{ marginLeft: "5px", fontSize: "12px" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div>
                        <span>{`${usr.firstName} ${usr.lastName}${
                          usr.country ? ` (${usr.country})` : ""
                        }`}</span>
                        {(userData.role === "superAdmin" ||
                          userData.role === "admin") && (
                          <FontAwesomeIcon
                            title="Edit Country"
                            className="actionIcon"
                            icon={faEdit}
                            onClick={() =>
                              handleEditCountry(usr._id, usr.country)
                            }
                            style={{ marginLeft: "10px", cursor: "pointer" }}
                          />
                        )}
                      </div>
                    )}
                  </td>
                  <td>{usr.email}</td>
                  <td>{getRoleIcon(usr.role)}</td>
                  <td>
                    {" "}
                    {usr.role !== "superAdmin" && usr.role !== "admin" && (
                      <>
                        <FontAwesomeIcon
                          title="Delete User"
                          className="actionIcon"
                          icon={faTrash}
                          onClick={() => handleDeleteUser(usr._id)}
                        />
                        <FontAwesomeIcon
                          title="Make User Site Admin"
                          className="actionIcon"
                          icon={faUserPlus}
                          onClick={() => handleMakeUserSiteAdmin(usr._id)}
                        />
                        {/* <span
                        className="actionTableItem"
                        onClick={() => handleMakeUserSiteAdmin(usr._id)}
                      >
                        Make Admin
                      </span> */}
                      </>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    )
  );
};

export default Users;
