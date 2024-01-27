import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useUser } from "./UserProvider";
import { fetchCurrentUserData } from "./utils";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const Users = () => {
    const { user } = useUser();
    const [users, setUsers] = useState([]);
    const [userData, setUserData] = useState({});

    async function addTestUser() {
        try {
            const result = await axios.get("https://random-data-api.com/api/v2/users");
            const newUser = {
                firstName: result.data.first_name,
                lastName: result.data.last_name,
                email: result.data.email,
                password: result.data.password
            }
            saveUser(newUser);
        } catch (err) {
            console.log("error: ", err);
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? Their name will be removed from all the competitions they've taken part in.")) return;
        try {
            // set configurations
            const configuration = {
                method: "delete",
                url: `https://competition-results.onrender.com/users/${userId}`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },               
            };
            const response = await axios(configuration);
            console.log('User deleted:', response.data);
          
            // setUsers(prevUsers => [...prevUsers, newUser]);
          
            setUsers(prevUsers => {
                // Use filter to exclude the user with the specified userId
                const newUsers = prevUsers.filter(user => user._id !== userId);
            
                return newUsers;
            });

        } catch (error) {
            console.error('Error deleting user:', error);
        }

    }

    const saveUser = async (newUser) => {
        try {
            // set configurations
            const configuration = {
                method: "post",
                url: `https://competition-results.onrender.com/users`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                data: newUser
            };
            const response = await axios(configuration);
            console.log('User added:', response.data);
          
            // setUsers(prevUsers => [...prevUsers, newUser]);
          
            setUsers(prevUsers => {
                const newUsers = [...prevUsers, newUser];                
                return newUsers;
            });

        } catch (error) {
            console.error('Error adding test user:', error);
        }

    }


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
                        url: "https://competition-results.onrender.com/users",
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
                    console.log('Failed to fetch user data');
                }
            } catch (error) {
                console.error('Error in useEffect:', error);
            }
        };
        fetchData();
    }, [user, token]); // The empty dependency array ensures the effect runs only once on mount

    return (
        <div>
            <h1 className="text-center">Users</h1>
            <Button onClick={addTestUser}>Add test user</Button>
            <table className="niceTable usersTable">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((usr) => 
                        <tr key={usr._id}>
                            <td>{`${usr.firstName} ${usr.lastName}`}</td>
                            <td>{usr.email}</td>
                            <td> {usr.role !== 'superAdmin' && <FontAwesomeIcon title="Delete User" className="actionIcon" icon={faTrash} onClick={() => handleDeleteUser(usr._id)} />}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Users;