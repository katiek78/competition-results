import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useUser } from "./UserProvider";
import { fetchCurrentUserData, getToken } from "./utils";
import axios from "axios";
import CompetitionForm from "./CompetitionForm";
import ParticipantsForm from "./ParticipantsForm";
import {
  backendUrl,
  formatNames,
  nationalEvents,
  internationalEvents,
  worldEvents,
  getDisciplineNameFromRef,
} from "./constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const CompetitionDetail = () => {
  const token = useMemo(() => getToken(), []);
  const { user } = useUser();
  const [userData, setUserData] = useState({});
  const { id } = useParams();
  const [competitionData, setCompetitionData] = useState({});
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);

  // Helper function to format date as 'YYYY-MM-DD'
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleEditCompetition = (modifiedCompetition) => {
    // Edit the competition
    setCompetitionData(modifiedCompetition);
    saveCompetition(modifiedCompetition);
    setShowForm(false);
  };

  const saveParticipant = async (participantId) => {
    try {
      const updatedCompetition = {
        // ...competitionData,
        compUsers: competitionData.compUsers
          ? [...competitionData.compUsers, participantId]
          : [participantId],
      };

      // set configurations
      const configuration = {
        method: "put",
        url: `${backendUrl}/competition/${id}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: updatedCompetition,
      };
      const response = await axios(configuration);
      console.log("Participant added:", response.data);
      setCompetitionData({
        ...competitionData,
        compUsers: updatedCompetition.compUsers,
      });
      setShowParticipantForm(false);
    } catch (error) {
      console.error("Error adding participant:", error);
    }
  };

  const saveAdmin = async (participantId) => {
    try {
      const updatedCompetition = {
        // ...competitionData,
        compAdmins: competitionData.compAdmins
          ? [...competitionData.compAdmins, participantId]
          : [participantId],
      };

      // set configurations
      const configuration = {
        method: "put",
        url: `${backendUrl}/competition/${id}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: updatedCompetition,
      };
      const response = await axios(configuration);
      console.log("Admin added:", response.data);
      setCompetitionData({
        ...competitionData,
        compAdmins: updatedCompetition.compAdmins,
      });
      setShowAdminForm(false);
    } catch (error) {
      console.error("Error adding admin:", error);
    }
  };

  const saveCompetition = async (competition) => {
    //work out if we need to change disciplines
    if (competition.format !== competitionData.format) {
      if (competition.format === "n") {
        console.log(nationalEvents);
        competition.disciplines = [...nationalEvents];
      } else if (competition.format === "i") {
        competition.disciplines = [...internationalEvents];
      } else competition.disciplines = [...worldEvents];
    }
    try {
      // set configurations
      const configuration = {
        method: "put",
        url: `${backendUrl}/competition/${id}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: competition,
      };
      const response = await axios(configuration);
      console.log("Competition saved:", response.data);
    } catch (error) {
      console.error("Error saving competition:", error);
    }
  };

  const deleteAdmin = async (id) => {
    try {
      const updatedCompAdmins = competitionData.compAdmins.filter(
        (adminId) => adminId !== id
      );
      const response = await axios.put(
        `${backendUrl}/competition/${competitionData._id}`,
        {
          compAdmins: updatedCompAdmins,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Competition saved:", response.data);
      setCompetitionData({ ...competitionData, compAdmins: updatedCompAdmins });
    } catch (error) {
      console.error("Error saving competition:", error);
    }
  };

  const deleteParticipant = async (id) => {
    try {
      console.log(competitionData.compUsers);
      // Convert id to string for comparison
      // const stringId = id.toString();

      const updatedCompUsers = competitionData.compUsers.filter(
        (userId) => userId !== id
      );
      console.log(updatedCompUsers);
      const updatedCompResults = competitionData.compResults.filter(
        (r) => r.compUser !== id
      );
      const response = await axios.put(
        `${backendUrl}/competition/${competitionData._id}`,
        {
          compUsers: updatedCompUsers,
          compResults: updatedCompResults,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Competition saved:", response.data);
      setCompetitionData((prevData) => ({
        ...prevData,
        compUsers: updatedCompUsers,
        compResults: updatedCompResults,
      }));
      // setCompetitionData({...competitionData, compUsers: updatedCompUsers, compResults: updatedCompResults})
    } catch (error) {
      console.error("Error saving competition:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(user);
        if (!user) return;
        const fetchedData = await fetchCurrentUserData(user.userId);
        console.log(fetchedData);
        if (fetchedData) {
          // Do something with the userData
          setUserData(fetchedData);

          //Then get competition data
          // set configurations
          const configuration = {
            method: "get",
            url: `${backendUrl}/competition/${id}`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          // make the API call
          axios(configuration)
            .then((result) => {
              setCompetitionData(result.data);
              console.log(result.data);
              //only allow users who are in compAdmins, or superAdmins
              if (
                result.data.compAdmins?.indexOf(fetchedData._id) === -1 &&
                fetchedData.role !== "superAdmin" &&
                fetchedData.role !== "admin"
              ) {
                // redirect user to the home page
                window.location.href = "/";
              }
            })
            .catch((error) => {
              console.error("Error fetching competition data:", error);
              window.location.href = "/competitions";
            });
        } else {
          console.log("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };
    fetchData();
  }, [user, token, id]);

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
  }, [token]);

  const handleDeleteAdmin = (id) => {
    if (window.confirm("Are you sure you wish to delete this admin?"))
      deleteAdmin(id);
  };

  const handleDeleteParticipant = (id) => {
    if (
      window.confirm(
        "Are you sure you wish to delete this participant? All their scores will be deleted."
      )
    )
      deleteParticipant(id);
  };

  const handleDeleteDiscipline = (discipline) => {
    if (window.confirm("Are you sure you wish to delete this discipline?"))
      deleteDiscipline(discipline);
  };

  const deleteDiscipline = async (discipline) => {
    try {
      const updatedDisciplines = competitionData.disciplines.filter(
        (d) => d !== discipline
      );

      const response = await axios.put(
        `${backendUrl}/competition/${competitionData._id}`,
        {
          disciplines: updatedDisciplines,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Competition saved:", response.data);
      setCompetitionData((prevData) => ({
        ...prevData,
        disciplines: updatedDisciplines,
      }));
    } catch (error) {
      console.error("Error saving competition:", error);
    }
  };

  return (
    <>
      {competitionData && (
        <div>
          <h1 className="text-center">
            Competition setup: {competitionData?.name}
          </h1>
          <h2 className="text-center">
            {competitionData.dateStart &&
              formatDate(new Date(competitionData.dateStart))}{" "}
            -{" "}
            {competitionData.dateEnd &&
              formatDate(new Date(competitionData.dateEnd))}
          </h2>
          <h2 className="text-center">
            Format: {formatNames[competitionData.format]}
          </h2>

          <Button onClick={() => setShowForm(true)}>
            Edit competition details
          </Button>

          {showForm && (
            <CompetitionForm
              onSubmitCompetition={handleEditCompetition}
              form={{
                compName: competitionData.name,
                dateStart: competitionData.dateStart,
                dateEnd: competitionData.dateEnd,
              }}
              editing={true}
            />
          )}

          <div>
            {competitionData && userData && (
              <p className="highlightText">
                <Link to={`/competition_results/${competitionData._id}`}>
                  View Results >>>
                </Link>
              </p>
            )}

            <Container>
              <Row>
                <Col>
                  <h2>
                    Competition admins: (
                    {competitionData.compAdmins?.length || 0})
                  </h2>
                  <Button onClick={() => setShowAdminForm(true)}>
                    New admin
                  </Button>

                  {showAdminForm && (
                    <ParticipantsForm
                      onSubmitParticipant={saveAdmin}
                      admin={true}
                      group={competitionData.compAdmins}
                    />
                  )}
                  {/* {competitionData.compAdmins?.map((userId) => {
                                // Find the user with the matching ID in the users array
                                const user = users.find((user) => user._id === userId);

                                // Display the user names
                                return (
                                    <p key={userId}>{user?.firstName} {user?.lastName}</p>
                                );
                            })} */}

                  <table className="setupTable adminTable niceTable">
                    <thead>
                      <tr>
                        <th>Admin</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitionData.compAdmins?.map((userId) => {
                        // Find the user with the matching ID in the users array
                        const user = users.find((user) => user._id === userId);

                        // Display the user names and actions
                        return (
                          <tr key={userId}>
                            <td>
                              {!user && "<Deleted User>"}
                              {user?.firstName} {user?.lastName}
                            </td>
                            <td onClick={() => handleDeleteAdmin(userId)}>
                              <FontAwesomeIcon
                                className="menuIcon"
                                icon={faTrash}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <h2>
                    Registered participants: (
                    {competitionData.compUsers?.length || 0})
                  </h2>
                  <Button onClick={() => setShowParticipantForm(true)}>
                    New participant
                  </Button>

                  {showParticipantForm && (
                    <ParticipantsForm
                      onSubmitParticipant={saveParticipant}
                      group={competitionData.compUsers}
                    />
                  )}

                  <table className="setupTable usersTable niceTable">
                    <thead>
                      <tr>
                        <th>Competitor</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitionData.compUsers?.map((userId) => {
                        // Find the user with the matching ID in the users array
                        const user = users.find((user) => user._id === userId);

                        // Display the user names and actions
                        return (
                          <tr key={userId}>
                            <td>
                              {!user && "<Deleted User>"}
                              {user?.firstName} {user?.lastName}
                            </td>
                            <td onClick={() => handleDeleteParticipant(userId)}>
                              <FontAwesomeIcon
                                className="menuIcon"
                                icon={faTrash}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Col>

                <Col>
                  <h2>Disciplines:</h2>
                  {/* {competitionData.disciplines?.map((discipline) => {
                              
                                return (
                                    <p key={discipline}>{getDisciplineNameFromRef(discipline)}</p>
                                );
                            })} */}

                  <table className="setupTable disciplineTable niceTable">
                    <thead>
                      <tr>
                        <th>Discipline</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitionData.disciplines?.map((discipline) => {
                        return (
                          <tr key={discipline}>
                            <td>{getDisciplineNameFromRef(discipline)}</td>
                            <td
                              onClick={() => handleDeleteDiscipline(discipline)}
                            >
                              <FontAwesomeIcon
                                className="menuIcon"
                                icon={faTrash}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Col>
              </Row>
            </Container>
          </div>
        </div>
      )}
    </>
  );
};

export default CompetitionDetail;
