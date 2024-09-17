import React, { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import { backendUrl, disciplines, getDisciplineNameFromRef } from "./constants";
import axios from "axios";
import { getToken } from "./utils";

const token = getToken();

const ScoreForm = ({ onSubmitScore, form, editing, competitionId }) => {
  const [score, setScore] = useState(editing ? form.score : undefined);
  const [time, setTime] = useState(editing ? form.time : undefined);
  const [discipline, setDiscipline] = useState(editing ? form.discipline : "");
  const [provisional, setProvisional] = useState(
    editing ? form.provisional : undefined
  );
  const [additionalInfo, setAdditionalInfo] = useState(
    editing ? form.additionalInfo : undefined
  );
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(editing ? form.user : "");
  const [competitionData, setCompetitionData] = useState({});

  const userHasNotAddedScoreForThisDiscipline = useCallback(
    (d) => {
      return !competitionData.compResults.some(
        (result) => result.compUser === user && result.discipline === d.ref
      );
    },
    [competitionData, user]
  );

  useEffect(() => {
    // Set the initial user to the first user available in the select box
    if (competitionData && users?.length > 0) {
      const firstUserInDropdown = users.find((user) =>
        competitionData?.compUsers?.includes(user._id)
      );
      if (firstUserInDropdown) {
        setUser(firstUserInDropdown._id);
      }
    }
  }, [competitionData, users]);

  useEffect(() => {
    // Set the initial discipline to the first discipline available in the select box
    if (competitionData && competitionData.disciplines?.length > 0) {
      const firstDisciplineInDropdown = disciplines.find(
        (d) =>
          competitionData.disciplines.includes(d.ref) &&
          userHasNotAddedScoreForThisDiscipline(d)
      );
      if (firstDisciplineInDropdown) {
        setDiscipline(firstDisciplineInDropdown.ref);
      }
    }
  }, [competitionData, userHasNotAddedScoreForThisDiscipline]);

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
      })
      .catch((error) => {
        error = new Error();
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (editing) return;

    // set configurations
    const configuration = {
      method: "get",
      url: `${backendUrl}/competition/${competitionId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    // make the API call
    axios(configuration)
      .then((result) => {
        setCompetitionData(result.data);

        //get logged-in user details
        // console.log(result.data.userId);
        // console.log(result.data.userEmail);
      })
      .catch((error) => {
        console.error("Error fetching competition data:", error);
      });
  }, []);

  const closeForm = () => {
    onSubmitScore(null, !editing);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate form data (add more validation as needed)
    if (!score || !user || !discipline) {
      alert("Please fill in all fields.");
      return;
    }

    // Create a result object with the form data
    const result = {
      score,
      time,
      discipline,
      user,
      provisional: editing ? provisional : discipline?.includes("W"),
      additionalInfo,
    };

    // Call the callback to add the result
    onSubmitScore(result, !editing);

    // Clear the form fields
    setScore("");
    setTime("");
    setDiscipline("");
    setUser("");
  };

  return (
    <form className="maintext" onSubmit={handleSubmit}>
      {competitionData?.compUsers && !editing && (
        <>
          <label>User:</label>
          <select value={user} onChange={(e) => setUser(e.target.value)}>
            {/* <option value="" disabled>Select a competitor</option> */}
            {competitionData &&
              users
                ?.filter(
                  (usr) => competitionData.compUsers.indexOf(usr._id) > -1
                )
                .map((usr) => (
                  <option key={usr._id} value={usr._id}>
                    {usr.firstName} {usr.lastName}
                  </option>
                ))}
          </select>
        </>
      )}
      {editing && (
        <label>
          User:{" "}
          {(() => {
            const foundUser = users.find((usr) => usr._id === user);
            return foundUser
              ? `${foundUser.firstName} ${foundUser.lastName}`
              : "Unknown User";
          })()}
        </label>
      )}
      <br />
      {!editing && (
        <>
          <label>Discipline:</label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
          >
            {competitionData.disciplines &&
              disciplines
                .filter(
                  (d) =>
                    competitionData.disciplines.includes(d.ref) &&
                    userHasNotAddedScoreForThisDiscipline(d)
                )
                .map((d) => (
                  <option key={d.ref} value={d.ref}>
                    {d.label}
                  </option>
                ))}
          </select>
        </>
      )}
      {editing && (
        <label>Discipline: {getDisciplineNameFromRef(discipline)}</label>
      )}
      <br />
      <label>Score:</label>
      <input
        type="text"
        value={score}
        onChange={(e) => setScore(e.target.value)}
      />
      <br />
      {discipline.includes("SC") && (
        <>
          <label>Time:</label>
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </>
      )}
      <br />
      <Button type="submit">{editing ? "Save" : "Add"} Score</Button>
      <Button onClick={closeForm}>Close</Button>
    </form>
  );
};

export default ScoreForm;
