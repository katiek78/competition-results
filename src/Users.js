import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useUser } from "./UserProvider";
import { fetchCurrentUserData } from "./utils";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faTrash,
  faUserPlus,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { backendUrl } from "./constants";

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const Users = () => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState({});

  async function addTestUser() {
    try {
      const result = await axios.get(
        "https://random-data-api.com/api/v2/users"
      );
      const newUser = {
        firstName: result.data.first_name,
        lastName: result.data.last_name,
        email: result.data.email,
        password: result.data.password,
      };
      saveUser(newUser);
    } catch (err) {
      console.log("error: ", err);
    }
  }

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

      // setUsers(prevUsers => [...prevUsers, newUser]);

      setUsers((prevUsers) => {
        // Use filter to exclude the user with the specified userId
        const newUsers = prevUsers.filter((user) => user._id !== userId);

        return newUsers;
      });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

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
        url: `${backendUrl}/user/${userId}`,
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
              console.log(result);
              setUsers(result.data.users);
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
  }, [user, token]); // The empty dependency array ensures the effect runs only once on mount

  return (
    userData &&
    (userData.role === "superAdmin" || userData.role === "admin") && (
      <div>
        <h1 className="text-center">Users</h1>
        <Button onClick={addTestUser}>Add test user</Button>
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
                  <td>{`${usr.firstName} ${usr.lastName}`}</td>
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
