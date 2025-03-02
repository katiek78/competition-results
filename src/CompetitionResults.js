import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "./UserProvider";
import axios from "axios";
import {
  getDisciplineNameFromRef,
  getDisciplineStandardFromRef,
} from "./constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faQuestion,
  faTrash,
  faCheck,
  faCheckDouble,
  faUserCheck,
  faCalculator,
} from "@fortawesome/free-solid-svg-icons";
import ScoreForm from "./ScoreForm";
import {
  exportCompetitionToExcel,
  fetchCurrentUserData,
  getToken,
} from "./utils";
import { backendUrl } from "./constants";

const CompetitionResults = () => {
  const token = useMemo(() => getToken(), []);
  const { id } = useParams();
  const { user } = useUser();
  const [competitionData, setCompetitionData] = useState(null);
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState({});
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [standard, setStandard] = useState(1);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [showEditScoreForm, setShowEditScoreForm] = useState(false);
  const [editFormValues, setEditFormValues] = useState("");
  const [compUserTotals, setCompUserTotals] = useState([]);
  const [showDisciplineMenu, setShowDisciplineMenu] = useState(false);
  const [roundingOn, setRoundingOn] = useState(false);
  const isMobile = window.innerWidth < 769;
  //const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // adjust this value to your needs

  const handleDisciplineToggle = () => {
    console.log(isMobile, showDisciplineMenu);
    if (isMobile) {
      setShowDisciplineMenu(!showDisciplineMenu);
    }
  };

  const handleToggleRounding = () => {
    setRoundingOn(!roundingOn);
  };

  const handleRequestReview = (usr) => {
    //grey out the faQuestion icon so they can't request review again

    //change status of this result to review so arbiters will see it
    const result = getResult(usr, selectedDiscipline);
    console.log(usr);
    console.log(result);
    const { rawScore, time, additionalInfo, timestamp } = result;
    saveScore(
      rawScore,
      time,
      usr,
      selectedDiscipline,
      false,
      "review",
      additionalInfo,
      timestamp
    ); //only change is to mark status as review
  };

  // Helper function to format date as 'YYYY-MM-DD'
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getResult = (user, discipline) => {
    return competitionData.compResults.find(
      (el) => el.compUser === user && el.discipline === discipline
    );
  };

  // const getNumberOfResultsForDiscipline = (d) => competitionData.compResults.filter(r => r.discipline === d).length;

  const getNumberOfResultsForDiscipline = (d) => {
    const results = competitionData.compResults.filter(
      (r) => r.discipline === d
    );
    return results.length;
  };

  const showCompUsersNotSubmitted = () => {
    const notSubmittedList = competitionData.compUsers
      .filter(
        (cuId) =>
          !competitionData.compResults.find(
            (r) => r.discipline === selectedDiscipline && r.compUser === cuId
          )
      )
      .map((cuId) => {
        const user = users.find((u) => u._id === cuId);
        return `${user.firstName} ${user.lastName}`;
      })
      .join("\n");

    alert(notSubmittedList);
  };

  function isDuplicateResult(compResults, compUser, discipline) {
    return compResults.some(
      (result) =>
        result.compUser === compUser && result.discipline === discipline
    );
  }

  const handleEditScore = (user, discipline) => {
    const result = getResult(user, discipline);
    setEditFormValues({
      ...result,
      score: result.rawScore,
      user: result.compUser,
    });

    setShowEditScoreForm(true);
  };

  const handleDeleteScore = (user, discipline) => {
    if (window.confirm("Are you sure you wish to delete this result?")) {
      const resultIndex = competitionData.compResults.findIndex(
        (result) => result.compUser === user && result.discipline === discipline
      );
      deleteResult(resultIndex);
    }
  };

  const handleMarkCorrected = (usr) => {
    const result = getResult(usr, selectedDiscipline);
    const { rawScore, time, additionalInfo, timestamp } = result;
    saveScore(
      rawScore,
      time,
      usr,
      selectedDiscipline,
      false,
      "corrected",
      additionalInfo,
      timestamp
    ); //only change is to mark status as 'corrected'
  };

  const handleSubmitScore = (result, newScore) => {
    if (!result) {
      if (newScore) {
        setShowScoreForm(false);
      } else setShowEditScoreForm(false);
      return;
    }
    const { score, time, discipline, user, additionalInfo, status } = result;
    //check for duplicate result and alert
    if (
      newScore &&
      isDuplicateResult(competitionData.compResults, user, discipline)
    ) {
      alert(
        "User already has a score for this discipline. Please find the score in the results and edit it from there."
      );
      return;
    }

    const rawScore = parseFloat(score);
    if (isNaN(rawScore)) {
      alert(
        "The score you entered could not be processed. Score must be a number."
      );
    } else
      saveScore(
        rawScore,
        time,
        user,
        discipline,
        newScore,
        status,
        additionalInfo,
        ""
      );

    if (newScore) {
      setShowScoreForm(false);
    } else setShowEditScoreForm(false);
  };

  const isAdmin = () => {
    if (!user) return false;
    return (
      (competitionData.compAdmins &&
        competitionData.compAdmins.indexOf(user.userId) > -1) ||
      userData.role === "superAdmin"
    );
  };
  const isParticipant = () => {
    if (!user) return false;
    return (
      competitionData.compUsers &&
      competitionData.compUsers.indexOf(user.userId) > -1
    );
  };

  const areAllResultsComplete = (d) => {
    // Filter out the results with the specified discipline
    const filteredResults = competitionData.compResults.filter(
      (result) => result.discipline === d
    );

    // Check if all filtered results are final
    const allComplete = filteredResults.every(
      (result) => !result.status || result.status !== "review"
    );

    return allComplete;
  };

  const isDisciplineComplete = (d) => {
    if (d.includes("W")) {
      return (
        competitionData?.compUsers.length > 0 &&
        getNumberOfResultsForDiscipline(d) ===
          competitionData?.compUsers.length &&
        areAllResultsComplete(d)
      );
    } else
      return (
        competitionData?.compUsers.length > 0 &&
        getNumberOfResultsForDiscipline(d) === competitionData?.compUsers.length
      );
  };
  const getReadableDate = (timestamp) => {
    const date = new Date(timestamp);

    if (!timestamp || isNaN(date.getTime())) {
      return ""; // Return empty string for invalid or empty timestamps
    }

    const readableDate = date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return readableDate;
  };

  const getNumberOfCompleteDisciplines = () => {
    if (!competitionData?.disciplines) return;

    // Count the number of complete disciplines
    return competitionData.disciplines.reduce((count, discipline) => {
      // Use the provided isDisciplineComplete function to check if the discipline is complete
      const isComplete = isDisciplineComplete(discipline);
      return count + (isComplete ? 1 : 0);
    }, 0);
  };

  const isCompetitionComplete = () => {
    if (competitionData.compUsers?.length === 0) return false;
    // Check if the number of complete disciplines equals the total number of disciplines
    return (
      getNumberOfCompleteDisciplines() === competitionData?.disciplines?.length
    );
  };

  const getChampPoints = (discipline, score, time = 0) => {
    const thisStandard = getDisciplineStandardFromRef(discipline) || 0;
    if (!thisStandard) return 0; // Default to 0 if standard is not defined
    if (discipline.includes("SC")) {
      const calculatedPoints =
        score === 52
          ? thisStandard.part1 / Math.pow(time, thisStandard.part2)
          : (score / 52) * thisStandard.part3;
      return parseFloat(calculatedPoints.toFixed(2)); // Round to 2 decimal places
    } else if (discipline.includes("K")) {
      return parseFloat((Math.sqrt(score) * thisStandard).toFixed(2)); // Round to 2 decimal places
    } else {
      return parseFloat((score / thisStandard) * 1000).toFixed(2); // Round to 2 decimal places
    }
  };

  const saveScore = async (
    rawScore,
    time = 0,
    user,
    discipline,
    newScore,
    status,
    additionalInfo,
    timestamp
  ) => {
    const newResult = {
      compUser: user,
      discipline,
      rawScore,
      time: Number(time) || 0,
      status,
      additionalInfo,
      timestamp,
    };

    console.log(
      `${backendUrl}/competition/${id}/results/${user}/${discipline}`
    ); //see what it's actually saving
    // https://competition-results.onrender.com/competition/67bb3edfd48ebcbe7a58cd7c/results/662ba1e0b01fae0e1722b521/5W
    // So it's saving correct user

    try {
      const configuration = {
        method: "put",
        url: newScore
          ? `${backendUrl}/competition/${id}/results` // Add new result
          : `${backendUrl}/competition/${id}/results/${user}/${discipline}`, // Edit existing result
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: newResult,
      };

      await axios(configuration);

      // Update local competitionData state
      setCompetitionData((prevCompetitionData) => {
        const updatedResults = newScore
          ? [...prevCompetitionData.compResults, newResult] // Add new result
          : prevCompetitionData.compResults.map(
              (result) =>
                result.compUser === user && result.discipline === discipline
                  ? newResult // Replace with the new result
                  : result // Keep the existing result
            );
        console.log(updatedResults); //correct
        return {
          ...prevCompetitionData,
          compResults: updatedResults,
        };
      });

      setShowScoreForm(false); // Hide the form after successful operation
    } catch (error) {
      console.error(`Error ${newScore ? "adding" : "editing"} result:`, error);
      alert(
        `The score could not be ${
          newScore ? "added" : "edited"
        }. Please try again.`
      );
    }
  };

  const deleteResult = (indexToDelete) => {
    if (
      indexToDelete < 0 ||
      indexToDelete >= competitionData.compResults.length
    )
      return;

    const updatedCompResults = [...competitionData.compResults];
    updatedCompResults.splice(indexToDelete, 1);

    try {
      const updatedCompetition = {
        ...competitionData,
        compResults: updatedCompResults,
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

      axios(configuration);

      setCompetitionData({
        ...competitionData,
        compResults: updatedCompResults,
      });
    } catch (error) {
      console.error("Error deleting result:", error);
      alert("The score could not be deleted. Please try again.");
    }
  };

  // useEffect(() => {
  //   const handleResize = () => {
  //     const isMobileNow = window.innerWidth < 768;
  //     setShowDisciplineMenu(!isMobileNow);
  //   };
  //   window.addEventListener("resize", handleResize);
  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);

  useEffect(() => {
    if (!competitionData) return;
    if (selectedDiscipline)
      setStandard(getDisciplineStandardFromRef(selectedDiscipline));
    const updateCompetitorTotals = () => {
      if (!competitionData.compUsers) return;

      const updatedCompUserTotals = competitionData.compUsers.map(
        (competitor) => {
          // Calculate the total points for this competitor
          let totalPoints = 0;

          // Track the highest score for disciplines "5N", "SC", or "K"
          const highestScores = {};

          competitionData.compResults
            .filter((result) => result.compUser === competitor)
            .forEach((result) => {
              const { discipline, rawScore, time } = result;

              // Update highest score for "5N", "SC", or "K"
              if (
                discipline.includes("5N") ||
                discipline.includes("SC") ||
                discipline.includes("K")
              ) {
                const disciplineKey = discipline.replace(/\d+$/, ""); // Remove the digits at the end
                if (
                  !highestScores[disciplineKey] ||
                  rawScore > highestScores[disciplineKey].rawScore
                ) {
                  highestScores[disciplineKey] = { rawScore, time, discipline };
                } else if (
                  rawScore === highestScores[disciplineKey].rawScore &&
                  discipline.includes("SC") &&
                  time < highestScores[disciplineKey].time
                ) {
                  highestScores[disciplineKey] = { rawScore, time, discipline };
                }
              } else {
                // Add points for other disciplines directly
                const points = getChampPoints(discipline, rawScore, time);
                totalPoints += parseFloat(points);
              }
            });

          // Add the highest scores for "5N", "SC", or "K" to the total points
          Object.values(highestScores).forEach(
            ({ rawScore, time, discipline }) => {
              const points = getChampPoints(discipline, rawScore, time);
              totalPoints += parseFloat(points);
            }
          );

          return {
            userId: competitor,
            total: Math.ceil(totalPoints), // TODO: can this be rounded up or down? Or just up?
            unroundedTotal: totalPoints,
          };
        }
      );

      setCompUserTotals(updatedCompUserTotals);
    };
    updateCompetitorTotals();
  }, [competitionData, selectedDiscipline]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        const fetchedData = await fetchCurrentUserData(user.userId);

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
            })
            .catch((error) => {
              console.error("Error fetching competition data:", error);
            });
        } else {
          console.log("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };
    fetchData();
  }, [user, id, token, selectedDiscipline]);

  useEffect(() => {
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
      })
      .catch((error) => {
        console.error("Error fetching competition data:", error);
      });
  }, [id, token, selectedDiscipline]);

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

  // Col 1: 11111111111X1111111X micrascope (12), cabbige (20)

  const handleSelectDiscipline = (discipline) => {
    setSelectedDiscipline(discipline);
    if (isMobile) setShowDisciplineMenu(false);
  };

  function formatCorrections(corrections) {
    if (!corrections) return;
    const parts = corrections.split(/\s+/);
    let output = "";
    let currentColumn = "";

    parts.forEach((part, index) => {
      if (part.match(/^\d+$/)) {
        // It's a column number
        currentColumn = `Col ${part}:`;
        if (!output.includes(currentColumn)) {
          output += (index === 0 ? "" : "<br>") + `${currentColumn}`;
        }
      } else {
        // It's a symbol or word
        output += ` ${part}`;
      }
    });

    return output;
  }

  const handleExport = () => {
    console.log(JSON.stringify(competitionData, null, 2));
    //Make an array to export, which will be an array of objects with keys 'name', 'total', 'unroundedTotal' and then each discipline with their scores.
    const exportData = [];

    competitionData.compUsers.forEach((compUser) => {
      const thisUser = users.find((u) => u._id === compUser);
      const compData = {
        name:
          (thisUser?.firstName || "Unknown") +
          " " +
          (thisUser?.lastName || "Unknown"),
        total: compUserTotals.find((u) => u.userId === compUser).total,
        unroundedTotal: compUserTotals
          .find((u) => u.userId === compUser)
          .unroundedTotal.toFixed(2),
      };
      competitionData.disciplines.forEach((discipline) => {
        const result = getResult(compUser, discipline);
        const raw = result?.rawScore || "";

        if (discipline.includes("SC")) {
          const time = result?.time || "";
          const champ = getChampPoints(discipline, raw, time);
          compData[discipline] = {
            raw,
            time,
            champ,
          };
        } else {
          const champ = getChampPoints(discipline, raw);
          compData[discipline] = { raw, champ };
        }
      });
      exportData.push(compData);
    });
    exportCompetitionToExcel(
      competitionData.name,
      competitionData.disciplines,
      exportData.sort((a, b) => b.total - a.total)
    );
  };

  // Example usage
  //const correctionsString = "1 11111111111X1111111X micrascope(12) cabbige(20)";

  return (
    <>
      {competitionData && (
        <div>
          <h1 className="text-center">
            Competition results: {competitionData.name}
          </h1>
          <h2 className="text-center">
            {competitionData.dateStart &&
              formatDate(new Date(competitionData.dateStart))}{" "}
            -{" "}
            {competitionData.dateEnd &&
              formatDate(new Date(competitionData.dateEnd))}
          </h2>

          <div className="highlightButtonsDiv">
            {isAdmin() && (
              <>
                <p className="highlightText">
                  <Link to={`/competition/${competitionData._id}`}>
                    View Setup >>>
                  </Link>
                </p>
                <p onClick={handleExport} className="highlightText">
                  {/* <Link to={`/competition/${competitionData._id}`}> */}
                  Export Results >>>
                  {/* </Link> */}
                </p>
              </>
            )}

            {isParticipant() && (
              <p className="highlightText">
                <Link to={`/competition_add_score/${competitionData._id}`}>
                  Add my score >>>
                </Link>
              </p>
            )}

            {isAdmin() && !isParticipant() && (
              <>
                <p className="highlightText">
                  {/* <Link to={`/competition_add_user_score/${competitionData._id}/`}>Add score for a user >>></Link> */}
                  <span onClick={() => setShowScoreForm(true)}>
                    Add score for a user >>>
                  </span>
                </p>
              </>
            )}
          </div>

          {showScoreForm && (
            <ScoreForm
              onSubmitScore={handleSubmitScore}
              competitionId={competitionData._id}
            />
          )}

          {showEditScoreForm && editFormValues && (
            <ScoreForm
              onSubmitScore={handleSubmitScore}
              editing={true}
              form={editFormValues}
            />
          )}

          <div className="disciplinesDiv">
            <button
              onClick={handleDisciplineToggle}
              className="disciplinesToggle"
            >
              Select discipline
            </button>
            {((isMobile && showDisciplineMenu) || !isMobile) && (
              <div className="disciplinesMenu">
                <span
                  className={
                    "disciplineHeading" +
                    (selectedDiscipline ? "" : " selected")
                  }
                  onClick={() => handleSelectDiscipline("")}
                >
                  Overall
                </span>
                {competitionData.disciplines?.map((discipline) => (
                  <span
                    key={discipline}
                    className={`disciplineHeading ${
                      selectedDiscipline === discipline ? "selected" : ""
                    }`}
                    onClick={() => handleSelectDiscipline(discipline)}
                  >
                    {getDisciplineNameFromRef(discipline)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {competitionData && (
            <div className="standingsDiv">
              <h2>
                {" "}
                {selectedDiscipline === ""
                  ? "Overall standings"
                  : getDisciplineNameFromRef(selectedDiscipline)}
              </h2>
              {selectedDiscipline === "" &&
                (isCompetitionComplete() ? (
                  <h3 className="compComplete">Competition complete!</h3>
                ) : (
                  <h3>
                    {getNumberOfCompleteDisciplines()} out of{" "}
                    {competitionData.disciplines.length} disciplines complete
                  </h3>
                ))}

              {selectedDiscipline &&
                !isDisciplineComplete(selectedDiscipline) && (
                  <>
                    <h3>
                      Results received:{" "}
                      {competitionData.compResults &&
                        getNumberOfResultsForDiscipline(selectedDiscipline)}
                      /
                      {competitionData.compUsers &&
                        competitionData.compUsers.length}
                    </h3>
                    {isAdmin() && (
                      <h4
                        className="asLink"
                        onClick={showCompUsersNotSubmitted}
                      >
                        Who hasn't submitted a result?
                      </h4>
                    )}
                  </>
                )}

              {selectedDiscipline &&
                isDisciplineComplete(selectedDiscipline) && (
                  <>
                    <h3 className="disciplineComplete">
                      All results received - discipline complete
                    </h3>
                  </>
                )}

              {selectedDiscipline !== "" && (
                <>
                  {" "}
                  <table className="niceTable resultsTable">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Competitor</th>
                        <th>Score</th>
                        {selectedDiscipline.includes("SC") && <th>Time</th>}
                        {selectedDiscipline.includes("W") && (
                          <>
                            {isAdmin() && !isParticipant() && (
                              <th className="corrections">Corrections</th>
                            )}
                            <th>Status</th>
                          </>
                        )}

                        <th>Champ. Pts</th>
                        {isAdmin() && <th>Timestamp</th>}

                        {isAdmin() && <th></th>}
                        {!isAdmin() &&
                          isParticipant() &&
                          selectedDiscipline.includes("W") && (
                            <th>Request review?</th>
                          )}
                      </tr>
                    </thead>
                    <tbody>
                      {competitionData.compResults
                        .filter(
                          (result) => result.discipline === selectedDiscipline
                        )
                        .sort((a, b) =>
                          selectedDiscipline.includes("SC")
                            ? a.rawScore === 52 && b.rawScore === 52
                              ? a.time - b.time
                              : b.rawScore - a.rawScore
                            : b.rawScore - a.rawScore
                        )
                        .map((result, i) => {
                          // Find the user with the matching ID in the users array
                          const thisUser = users.find(
                            (u) => u._id === result.compUser
                          );

                          //determine if this user is the currently logged in user
                          const isCurrentUser = thisUser?._id === user?.userId;

                          return (
                            <tr
                              key={thisUser?._id}
                              className={result.status ? result.status : ""}
                            >
                              <td>{i + 1}</td>
                              <td>{`${thisUser?.firstName || "Unknown"} ${
                                thisUser?.lastName || "Unknown"
                              }`}</td>
                              <td>{result.rawScore}</td>
                              {selectedDiscipline.includes("SC") && (
                                <td>
                                  {result.time?.toFixed(2) || result.time}
                                </td>
                              )}
                              {selectedDiscipline.includes("W") && (
                                <>
                                  {isAdmin() && !isParticipant() && (
                                    <td
                                      dangerouslySetInnerHTML={{
                                        __html: formatCorrections(
                                          result.additionalInfo
                                        ),
                                      }}
                                    ></td>
                                  )}
                                  <td>
                                    {result.status === "review" && (
                                      <FontAwesomeIcon
                                        title="Review requested"
                                        className="menuIcon"
                                        icon={faQuestion}
                                      />
                                    )}
                                    {result.status === "corrected" && (
                                      <FontAwesomeIcon
                                        title="Corrected"
                                        className="menuIcon"
                                        icon={faCheck}
                                      />
                                    )}
                                  </td>
                                </>
                              )}

                              {!selectedDiscipline.includes("SC") &&
                                !selectedDiscipline.includes("K") && (
                                  <td className="champ-points">
                                    {(
                                      (result.rawScore / standard) *
                                      1000
                                    ).toFixed(2)}
                                  </td>
                                )}

                              {selectedDiscipline.includes("SC") && (
                                <td className="champ-points">
                                  {result.rawScore === 52
                                    ? (
                                        standard.part1 /
                                        Math.pow(result.time, standard.part2)
                                      ).toFixed(2)
                                    : (
                                        (result.rawScore / 52) *
                                        standard.part3
                                      ).toFixed(2)}
                                </td>
                              )}

                              {selectedDiscipline.includes("K") && (
                                <td className="champ-points">
                                  {(
                                    Math.sqrt(result.rawScore) * standard
                                  ).toFixed(2)}
                                </td>
                              )}

                              {isAdmin() && (
                                <td>{getReadableDate(result.timestamp)}</td>
                              )}

                              {isAdmin() && !isParticipant() && (
                                <td>
                                  <FontAwesomeIcon
                                    title="Edit Score"
                                    className="actionIcon"
                                    icon={faEdit}
                                    onClick={() =>
                                      handleEditScore(
                                        result.compUser,
                                        result.discipline
                                      )
                                    }
                                  />
                                  <FontAwesomeIcon
                                    title="Delete Score"
                                    className="actionIcon"
                                    icon={faTrash}
                                    onClick={() =>
                                      handleDeleteScore(
                                        result.compUser,
                                        result.discipline
                                      )
                                    }
                                  />

                                  {selectedDiscipline.includes("W") &&
                                    result.status === "review" && (
                                      <>
                                        <FontAwesomeIcon
                                          title="Mark as Complete"
                                          className="actionIcon"
                                          icon={faCheck}
                                          onClick={() =>
                                            handleMarkCorrected(result.compUser)
                                          }
                                        />
                                      </>
                                    )}
                                </td>
                              )}

                              {isParticipant() &&
                                isCurrentUser &&
                                (result.status === "submitted" ||
                                  !result.status) &&
                                selectedDiscipline.includes("W") && (
                                  <td>
                                    <FontAwesomeIcon
                                      title="Request review"
                                      className="actionIcon"
                                      icon={faQuestion}
                                      onClick={() =>
                                        handleRequestReview(result.compUser)
                                      }
                                    />
                                  </td>
                                )}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </>
              )}

              {selectedDiscipline === "" && (
                <>
                  <table className="niceTable resultsTable overallTable">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Competitor</th>
                        <th>
                          Champ. Pts{" "}
                          {isAdmin() && (
                            <FontAwesomeIcon
                              onClick={handleToggleRounding}
                              icon={faCalculator}
                              title="Rounding on/off"
                            />
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {compUserTotals &&
                        compUserTotals
                          .sort((a, b) => b.unroundedTotal - a.unroundedTotal)
                          .map((competitor, i) => {
                            // Find the user with the matching ID in the users array
                            const thisUser = users.find(
                              (u) => u._id === competitor.userId
                            ) || {
                              firstName: "Unknown",
                              lastName: "Unknown",
                            };

                            return (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{`${thisUser.firstName} ${thisUser.lastName}`}</td>
                                <td className="champ-points">
                                  {roundingOn
                                    ? competitor.unroundedTotal.toFixed(2)
                                    : competitor.total}
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CompetitionResults;
