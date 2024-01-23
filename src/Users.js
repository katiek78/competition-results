import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useUser } from "./UserProvider";
import { fetchCurrentUserData } from "./utils";
import { Button } from "react-bootstrap";

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const Users = () => {
    const { user } = useUser();
    const [users, setUsers] = useState([]);
    const [userData, setUserData] = useState({});

    function addTestUser() {
        const newUser = {
            'firstName': 'Diogo',
            'lastName': 'Jota'
        }
       saveUser(newUser);
    }

    const saveUser = async (newUser) => {
        try {
            // set configurations
            const configuration = {
                method: "post",
                url: `https://competition-results.onrender.com/user/${user.userId}`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                data: newUser
            };
            const response = await axios(configuration);
            console.log('User added:', response.data);
            setUsers([
                ...users,
                newUser
            ]);

        } catch (error) {
            console.error('Error adding test user:', error);
        }

    }


    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const fetchedData = await fetchCurrentUserData(user.userId);

                //only allow users who are in compAdmins, or superAdmins                          
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
    </tr>
  </thead>
  <tbody>
        {users.map((usr) => {
            const thisUser = users.find((u) => u._id === usr._id);         
            return (
          <tr key={usr._id}>          
            <td>{`${thisUser.firstName} ${thisUser.lastName}`}</td>
            <td>{thisUser.email}</td>
          </tr>
        );
        })}
        </tbody>
        </table>
    </div>
  );
}

export default Users;