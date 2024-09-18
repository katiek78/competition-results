// CompetitionForm.js

import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import axios from "axios";
import { getToken } from "./utils";
import { backendUrl } from "./constants";

const token = getToken();

const ParticipantsForm = ({ onSubmitParticipant, admin, group }) => {
  const [users, setUsers] = useState([]);
  const [id, setId] = useState("");

  useEffect(() => {
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
        setUsers(result.data.users);

        //get logged-in user details
        // console.log(result.data.userId);
        // console.log(result.data.userEmail);
      })
      .catch((error) => {
        error = new Error();
        console.log(error);
      });
  }, [group]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitParticipant(id);
  };

  return (
    <form className="maintext" onSubmit={handleSubmit}>
      {/* <label>
        Competitor:
        </label> */}
      <select value={id} onChange={(e) => setId(e.target.value)}>
        <option value="" disabled>
          Select a user
        </option>
        {group &&
          users
            .filter((user) => !group.includes(user._id))
            .sort((a, b) => {
              // Compare first names
              const firstNameComparison = a.firstName.localeCompare(
                b.firstName
              );

              // If first names are equal, compare last names
              return firstNameComparison !== 0
                ? firstNameComparison
                : a.lastName.localeCompare(b.lastName);
            })
            .map((user) => (
              <option key={user._id} value={user._id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
      </select>

      <Button type="submit">{admin ? "Add admin" : "Add participant"}</Button>
    </form>
  );
};

export default ParticipantsForm;
