import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Row, Col, Button, Modal, Form } from "react-bootstrap";
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
import stringSimilarity from "string-similarity";

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [userMatches, setUserMatches] = useState([]);
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState("");

  // Debug: Log the id parameter
  console.log("Competition ID from useParams:", id);

  // Utility: Find possible matches for imported participants
  // importedParticipants: [{ fullName, country, ... }]
  // existingUsers: [{ fullName, country, ... }]
  // Returns: [{ participant, matches: [user, ...] }]
  function findUserMatches(
    importedParticipants,
    existingUsers,
    nameThreshold = 0.85
  ) {
    return importedParticipants
      .map((participant) => {
        // Construct participant's full name for display and comparison
        const participantFullName = (
          (participant.firstName || "") +
          " " +
          (participant.lastName || "")
        ).trim();

        // Filter users by country first
        const countryMatches = existingUsers.filter(
          (user) => user.country === participant.country || user.country === ""
        );

        // Combine firstName and lastName for users
        const nameCandidates = countryMatches.map((user) => {
          const userFullName = (
            (user.firstName || "") +
            " " +
            (user.lastName || "")
          ).trim();
          return {
            user,
            similarity: stringSimilarity.compareTwoStrings(
              userFullName.toLowerCase(),
              participantFullName.toLowerCase()
            ),
            userFullName,
          };
        });

        // Only keep matches above threshold
        const matches = nameCandidates
          .filter((c) => c.similarity >= nameThreshold)
          .sort((a, b) => b.similarity - a.similarity)
          .map((c) => ({
            ...c.user,
            similarity: c.similarity,
            userFullName: c.userFullName,
          }));

        // Only return participants with at least one match
        if (matches.length > 0) {
          return { participantFullName, matches };
        }
        return null;
      })
      .filter(Boolean); // Remove nulls (participants with no matches)
  }

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

  // Handler for import button
  const handleImportClick = () => {
    setShowImportModal(true);
    setUserMatches([]);
    setImportUrl("");
    setImportError("");
  };

  // Handler for closing modal
  const handleImportModalClose = () => {
    setShowImportModal(false);
    setImportUrl("");
    setImportError("");
  };

  // Handler for submitting import
  const handleImportSubmit = (e) => {
    e.preventDefault();
    setImportError("");
    if (!importUrl.trim()) {
      setImportError("Please paste CSV data.");
      return;
    }
    // Parse pasted CSV data
    const rows = importUrl.split(/\r?\n/).filter(Boolean);
    // Find header row (the first one with 'Name' in it and 'Country' or 'Nationality')
    let headerIdx = rows.findIndex(
      (row) =>
        row.includes("Name") &&
        (row.includes("Country") || row.includes("Nationality"))
    );
    let dataRows;
    if (headerIdx === -1) {
      // No header row, treat all rows as data
      dataRows = rows;
    } else {
      // Data starts after header
      dataRows = rows.slice(headerIdx + 1);
    }
    // Extract Name (A), Country (B), Birth Year (C)
    const competitors = dataRows
      .map((row) => {
        const cols = row.split(/\t|,/); // support tab or comma separated
        let nameRaw = cols[0]?.trim() || "";
        let birthYearRaw = cols[2]?.trim() || "";
        let birthYear = "";
        // If it's just a year, use it. If it's a date, extract year from end or regex
        if (/^\d{4}$/.test(birthYearRaw)) {
          birthYear = birthYearRaw;
        } else if (/\d{4}$/.test(birthYearRaw)) {
          birthYear = birthYearRaw.slice(-4);
        } else {
          birthYear = birthYearRaw.match(/\d{4}/)?.[0] || "";
        }
        // Assign last word as lastName, rest as firstName
        let firstName = "";
        let lastName = "";
        const nameParts = nameRaw.split(" ").filter(Boolean);
        if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = "";
        } else if (nameParts.length > 1) {
          lastName = nameParts[nameParts.length - 1];
          firstName = nameParts.slice(0, -1).join(" ");
        }
        return {
          firstName,
          lastName,
          country: cols[1]?.trim() || "",
          birthYear,
        };
      })
      .filter((c) => c.firstName);

    const foundMatches = findUserMatches(competitors, users, 0.8);
    setUserMatches(foundMatches);

    if (competitors.length === 0) {
      setImportError("No competitors found in the pasted data.");
      return;
    }

    if (foundMatches.length > 0) {
      return; // Do not save yet!
    }

    // Save competitors to DB and add to competition
    const saveCompetitors = async () => {
      try {
        // 1. Create competitors in bulk using new endpoint
        const response = await axios.post(
          `${backendUrl}/users/bulk`,
          {
            users: competitors.map((c) => ({
              firstName: c.firstName,
              lastName: c.lastName,
              country: c.country,
              birthYear: c.birthYear,
              verified: true,
              role: "user",
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const createdIds = response.data.userIds || [];
        console.log(createdIds);
        // 2. Add all created competitor IDs to the competition
        const updatedCompetition = {
          compUsers: competitionData.compUsers
            ? [...competitionData.compUsers, ...createdIds]
            : [...createdIds],
        };
        await axios.put(`${backendUrl}/competition/${id}`, updatedCompetition, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCompetitionData({
          ...competitionData,
          compUsers: updatedCompetition.compUsers,
        });
        // Optimistically add new competitors to users state
        const newUsers = createdIds.map((id, idx) => ({
          _id: id,
          firstName: competitors[idx].firstName,
          lastName: competitors[idx].lastName,
          country: competitors[idx].country,
          birthYear: competitors[idx].birthYear,
          verified: true,
          role: "user",
        }));
        setUsers((prevUsers) => [...prevUsers, ...newUsers]);
        alert(`Imported and saved ${createdIds.length} competitors.`);
        setShowImportModal(false);
      } catch (err) {
        setImportError(
          "Error saving competitors. Please check your data and try again."
        );
        console.error(err);
      }
    };
    saveCompetitors();
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
        console.log("User:", user);
        console.log("ID:", id);

        // Don't fetch if we don't have a valid ID
        if (!user || !id) {
          console.log("Missing user or id, skipping fetch");
          return;
        }

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
        // Filter out unverified users (treat undefined as verified for legacy users)
        const verifiedUsers = result.data.users.filter(
          (user) => user.verified !== false
        );
        setUsers(verifiedUsers);

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
                comp_id: competitionData.comp_id,
                location: competitionData.location,
                rankable: competitionData.rankable,
                adult_rankable: competitionData.adult_rankable,
                country: competitionData.country,
                championship_type: competitionData.championship_type,
                championship_status: competitionData.championship_status,
              }}
              editing={true}
            />
          )}

          <div>
            {competitionData && userData && (
              <p className="highlightText">
                <Link to={`/competition_results/${id}`}>
                  View Results {">>>"}
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
                  <Button
                    variant="secondary"
                    style={{ marginLeft: "10px" }}
                    onClick={handleImportClick}
                  >
                    Import participants
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
                        console.log(users);
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
                  <table className="setupTable disciplineTable niceTable">
                    <thead>
                      <tr>
                        <th>Discipline</th>
                        {userData.role === "superAdmin" && <th></th>}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitionData.disciplines?.map((discipline) => {
                        return (
                          <tr key={discipline}>
                            <td>{getDisciplineNameFromRef(discipline)}</td>
                            {userData.role === "superAdmin" && (
                              <td>
                                {/* <Link
                                  to={`/compete/${competitionData._id}/${discipline}`}
                                >
                                  <FontAwesomeIcon
                                    className="menuIcon"
                                    icon={faPlay}
                                  />
                                </Link> */}
                              </td>
                            )}
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
      <Modal show={showImportModal} onHide={handleImportModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Import Competitors</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleImportSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Paste CSV data below (columns: Name, Country, DOB/Birth Year)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={16}
                style={{ fontSize: "1rem" }}
                placeholder="Paste CSV rows here..."
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
              {importError && (
                <div style={{ color: "red", marginTop: 8 }}>{importError}</div>
              )}
              {/* Example: Display flagged matches if any */}
              {userMatches.length > 0 && (
                <div
                  style={{
                    background: "#ffe",
                    border: "1px solid #cc0",
                    padding: "1em",
                    marginBottom: "1em",
                  }}
                >
                  <h4>Possible User Matches</h4>
                  {userMatches.map(({ participantFullName, matches }, idx) => (
                    <div key={idx} style={{ marginBottom: "1em" }}>
                      <strong>{participantFullName}</strong>
                      {matches.length > 0 ? (
                        <ul>
                          {matches.map((user, i) => (
                            <li key={i}>
                              {user.firstName + " " + user.lastName} (
                              {user.country})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: "#888" }}>
                          No close matches found.
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleImportModalClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Import
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default CompetitionDetail;
