import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import { useUser } from "./UserProvider";
import axios from "axios";
import CompetitionForm from "./CompetitionForm";
import { nationalEvents, internationalEvents, worldEvents } from "./constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { fetchCurrentUserData, getToken } from "./utils";
import { backendUrl } from "./constants";

const Competitions = () => {
  const token = getToken();
  const { user } = useUser();
  const [competitions, setCompetitions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [userData, setUserData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("User in Account:", user);
  }, [user]);

  const handleDeleteComp = async (compId) => {
    if (!window.confirm("Are you sure you want to delete this competition?"))
      return;
    try {
      // set configurations
      const configuration = {
        method: "delete",
        url: `${backendUrl}/competitions/${compId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios(configuration);
      console.log("Competition deleted:", response.data);

      // setUsers(prevUsers => [...prevUsers, newUser]);

      setCompetitions((prevComps) => {
        // Use filter to exclude the user with the specified userId
        const newComps = prevComps.filter((comp) => comp._id !== compId);

        return newComps;
      });
    } catch (error) {
      console.error("Error deleting competition:", error);
    }
  };

  const handleAddCompetition = (newCompetition) => {
    saveCompetition(newCompetition);
    setShowForm(false);
  };

  const saveCompetition = async (competition) => {
    console.log(competition.format);
    //add disciplines
    if (competition.format === "n") {
      console.log(nationalEvents);
      competition.disciplines = [...nationalEvents];
    } else if (competition.format === "i") {
      competition.disciplines = [...internationalEvents];
    } else competition.disciplines = [...worldEvents];

    try {
      // set configurations
      const configuration = {
        method: "post",
        url: `${backendUrl}/competitions`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: competition,
      };
      const response = await axios(configuration);
      console.log("Competition saved:", response.data);
      const newCompetition = response.data;
      // Update competitions state, making sure to set the id correctly
      setCompetitions((prevCompetitions) => [
        ...prevCompetitions,
        newCompetition,
      ]);
    } catch (error) {
      console.error("Error saving competition:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        //Get competition data
        // set configurations
        const configuration = {
          method: "get",
          url: `${backendUrl}/competitions`,
          headers: {
            //  Authorization: `Bearer ${token}`,
          },
        };
        // make the API call
        const response = await axios(configuration);
        setCompetitions(response.data.competitions);
        setError(null);

        // .then((result) => {
        // setCompetitions(result.data.competitions);
        //  })
        //.catch((error) => {
        //  console.error("Error fetching competition data:", error);
        // });

        let fetchedData;

        if (user) {
          fetchedData = await fetchCurrentUserData(user.userId);

          setUserData(fetchedData);
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
        if (!error.response) {
          setError("Network error");
        } else if (error.response.status === 503) {
          // Example: 503 Service Unavailable
          setError(
            "The server is currently unavailable. Please try refreshing the page."
          );
        } else {
          // Other errors
          setError("An unexpected error occurred. Please try again later.");
        }
      }
    };
    fetchData();
  }, [user, token]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div>
      <h1 className="text-center">Competitions</h1>

      {userData &&
        (userData.role === "superAdmin" || userData.role === "admin") && (
          <Button onClick={() => setShowForm(true)}>Add Competition</Button>
        )}

      {showForm && (
        <CompetitionForm
          onSubmitCompetition={handleAddCompetition}
          editing={false}
        />
      )}

      <table className="niceTable competitionTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Dates</th>
            {userData &&
              (userData.role === "superAdmin" || userData.role === "admin") && (
                <th></th>
              )}
          </tr>
        </thead>
        <tbody>
          {competitions
            .sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart))
            .map((competition) => (
              <tr key={competition._id}>
                <td>
                  <Link to={`/competition_results/${competition._id}`}>
                    {competition.name}
                  </Link>
                </td>
                <td>{`${formatDate(
                  new Date(competition.dateStart)
                )} - ${formatDate(new Date(competition.dateEnd))}`}</td>
                {userData &&
                  (userData.role === "superAdmin" ||
                    userData.role === "admin") && (
                    <td>
                      <FontAwesomeIcon
                        title="Delete Competition"
                        className="actionIcon"
                        icon={faTrash}
                        onClick={() => handleDeleteComp(competition._id)}
                      />
                    </td>
                  )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Competitions;
