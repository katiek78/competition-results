// CompetitionForm.js

import React, { useEffect, useState } from 'react';
import axios from "axios";
import Cookies from "universal-cookie";

const cookies = new Cookies();

const token = cookies.get("TOKEN");


const ParticipantsForm = ({ onSubmitParticipant }) => {

    const [users, setUsers] = useState([]);
    const [id, setId] = useState('');


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

            //get logged-in user details
            console.log(result.data.userId);
            console.log(result.data.userEmail);
        })
        .catch((error) => {
        error = new Error();
        console.log(error);
        });
    }, [])



const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitParticipant(id);
}

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Competitor:
        </label>
        <select value={id} onChange={(e) => setId(e.target.value)}>
        <option value="" disabled>Select a competitor</option>
        {users?.map((user) => <option key={user._id} value={user._id}>{user.email}</option>)}

        </select>
   
     
      <button type="submit">Add participant</button>
    </form>
  );
};

export default ParticipantsForm;
