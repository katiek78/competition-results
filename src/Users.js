import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const Users = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
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
    }, [])
  
    
  return (
    <div>
      <h1 className="text-center">Users</h1>
        {users.map((user) => {
            return (
            <div>{user.email}</div>
            )
        })}
    </div>
  );
}

export default Users;