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
  faCalculator,
} from "@fortawesome/free-solid-svg-icons";
import ScoreForm from "./ScoreForm";
import {
  exportCompetitionToExcel,
  fetchCurrentUserData,
  getToken,
} from "./utils";
import { backendUrl } from "./constants";
import { generateCompId } from "./competitionIdUtils";

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
    //think this disappears automatically

    // prompt user for note to be added
    const note = prompt("Please enter a note:");

    //change status of this result to review so arbiters will see it
    const result = getResult(usr, selectedDiscipline);
    console.log(usr);
    console.log(result);
    const { rawScore, time, additionalInfo, timestamp } = result;
    const expandedInfo = additionalInfo + "<br />Note: " + note;
    console.log(expandedInfo);
    saveScore(
      rawScore,
      time,
      usr,
      selectedDiscipline,
      false,
      "review",
      expandedInfo,
      timestamp
    ); //only change is to mark status as review and include note along with additionalInfo
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

  function formatCorrections(corrections, status) {
    if (status === "submitted" || !corrections) return "";

    // Split corrections and note if present
    let [correctionsPart, notePart] = corrections.split("<br />Note:");

    const parts = correctionsPart.trim().split(/\s+/);
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

    // Append the note if present
    if (notePart) {
      output += `<br><strong>Note:</strong> ${notePart.trim()}`;
    }

    return output;
  }

  const handleExport = () => {
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

  // Lookup table for stats discipline IDs
  const disciplineNameToStatsId = {
    "5-minute Binary": "BINARY5",
    "5-minute Names & Faces": "NAMES5",
    "5-minute Numbers": "NUM5",
    "5-minute Words": "WORDS5",
    "10-minute Cards": "CARDS10",
    "10-minute Cards (MWC)": "CARDS10MWC",
    "15-minute Numbers": "NUM15",
    "15-minute Numbers (MWC)": "NUM15MWC",
    "30-minute Binary": "BINARY30",
    "30-minute Cards": "CARDS30",
    "30-minute Cards (MWC)": "CARDS30MWC",
    "30-minute Numbers": "NUM30",
    "15-minute Images": "IMAGES15",
    "5-minute Dates": "DATES5",
    "Hour Cards": "CARDS60",
    "Hour Numbers": "NUM60",
    Images: "IMAGESOLD",
    "15-minute Names & Faces": "NAMES15",
    "15-minute Poem/Text (Old)": "POEM15",
    "15-minute Words": "WORDS15",
    "Speed Cards": "SPDCARDS",
    "Spoken Numbers": "SPOKEN1",
    "Spoken Numbers (2 sec)": "SPOKEN2",
    "10-minute Names & Faces": "NAMES10",
    Vocabulary: "VOCAB5",
    "10-minute Words": "WORDS10",
    "10-minute Text": "POEM10",
    "Images On Screen": "IMGSCRN",
    "Simpson's Challenge": "SIMPSONS",
    "5-minute Names (old format)": "NAMESold5",
    "15-minute Names (old format)": "NAMESold15",
    "10-Minute Names (Old Format)": "NAMESold10",
    "5-minute Images": "IMAGES5",
  };

  const handleExportStats = () => {
    // 1. Export competition.csv
    const compFields = [
      "id",
      "title",
      "year",
      "location",
      "start_date",
      "end_date",
      "rankable",
      "adult_rankable",
      "country",
      "type",
      "championship_status",
    ];
    const compRow = [
      competitionData?.comp_id ||
        generateCompId(competitionData?.name, competitionData?.dateStart) ||
        "",
      competitionData?.name || "N/A",
      competitionData?.dateStart
        ? new Date(competitionData.dateStart).getFullYear()
        : "N/A",
      competitionData?.location || competitionData?.Location || "N/A",
      competitionData?.dateStart
        ? formatDate(new Date(competitionData.dateStart))
        : "N/A",
      competitionData?.dateEnd
        ? formatDate(new Date(competitionData.dateEnd))
        : "N/A",
      competitionData?.rankable !== undefined
        ? competitionData.rankable
        : competitionData?.Rankable !== undefined
        ? competitionData.Rankable
        : false, // Default to false instead of "N/A"
      competitionData?.adult_rankable !== undefined
        ? competitionData.adult_rankable
        : competitionData?.Adult_rankable !== undefined
        ? competitionData.Adult_rankable
        : competitionData?.adultRankable !== undefined
        ? competitionData.adultRankable
        : false, // Default to false instead of "N/A"
      competitionData?.country || "N/A",
      competitionData?.type || "N/A",
      competitionData?.championship_status || "N/A",
    ];
    const compCsv =
      "\uFEFF" + compFields.join(",") + "\n" + compRow.join(",") + "\n";
    const compBlob = new Blob([compCsv], { type: "text/csv;charset=utf-8" });
    const compUrl = URL.createObjectURL(compBlob);
    const compLink = document.createElement("a");
    compLink.href = compUrl;
    compLink.download = "competition.csv";
    document.body.appendChild(compLink);
    compLink.click();
    document.body.removeChild(compLink);
    URL.revokeObjectURL(compUrl);

    // 2. Export score.csv
    // Build scoreFields: replace 5-min Numbers and Spoken Numbers with NUM5 and SPOKEN1
    const statsDisciplineFields = [];
    // Add NUM5 and SPOKEN1 first
    statsDisciplineFields.push("NUM5");
    statsDisciplineFields.push("SPOKEN1");
    // Add all other mapped disciplines except the trials/attempts and Speed Cards
    (competitionData?.disciplines || []).forEach((d) => {
      const name = getDisciplineNameFromRef(d);
      // Skip 5-min Numbers trials, Spoken Numbers attempts, and Speed Cards
      if (
        [
          "5-minute Numbers Trial 1",
          "5-minute Numbers Trial 2",
          "Spoken Numbers Attempt 1",
          "Spoken Numbers Attempt 2",
          "Spoken Numbers Attempt 3",
          "Speed Cards Trial 1",
          "Speed Cards Trial 2",
        ].includes(name)
      )
        return;
      const statsId = disciplineNameToStatsId[name];
      if (statsId) statsDisciplineFields.push(statsId);
      else statsDisciplineFields.push(d);
    });
    statsDisciplineFields.push(
      "spdcards1_cards",
      "spdcards1_time",
      "spdcards2_cards",
      "spdcards2_time"
    );

    const scoreFields = [
      "first name",
      "last name",
      "iam id",
      "Country",
      "Age group",
      ...statsDisciplineFields,
    ];

    const scoreRows = [];
    (competitionData?.compUsers || []).forEach((compUserId) => {
      const user = users.find((u) => u._id === compUserId) || {};
      const row = [
        user.firstName || "N/A",
        user.lastName || "N/A",
        user.iamId || user.iam_id || "N/A",
        user.country || "N/A",
        user.ageGroup || user.age_group || "N/A",
      ];
      // NUM5: highest of 5-minute Numbers Trial 1/2
      const num1 = getResult(compUserId, "5N1");
      const num2 = getResult(compUserId, "5N2");
      const num1Score = num1?.rawScore !== undefined ? num1.rawScore : null;
      const num2Score = num2?.rawScore !== undefined ? num2.rawScore : null;
      let num5Score = "N/A";
      if (num1Score !== null && num2Score !== null)
        num5Score = Math.max(num1Score, num2Score);
      else if (num1Score !== null) num5Score = num1Score;
      else if (num2Score !== null) num5Score = num2Score;
      row.push(num5Score);
      // SPOKEN1: highest of Spoken Numbers Attempt 1/2/3
      const k1 = getResult(compUserId, "K1");
      const k2 = getResult(compUserId, "K2");
      const k3 = getResult(compUserId, "K3");
      const kScores = [k1?.rawScore, k2?.rawScore, k3?.rawScore].filter(
        (v) => v !== undefined
      );
      let spokenScore = "N/A";
      if (kScores.length > 0) spokenScore = Math.max(...kScores);
      row.push(spokenScore);
      // Other disciplines
      (competitionData?.disciplines || []).forEach((discipline) => {
        const name = getDisciplineNameFromRef(discipline);
        if (
          [
            "5-minute Numbers Trial 1",
            "5-minute Numbers Trial 2",
            "Spoken Numbers Attempt 1",
            "Spoken Numbers Attempt 2",
            "Spoken Numbers Attempt 3",
            "Speed Cards Trial 1",
            "Speed Cards Trial 2",
          ].includes(name)
        )
          return;
        const result = getResult(compUserId, discipline);
        row.push(result?.rawScore !== undefined ? result.rawScore : "N/A");
      });
      // spdcards1 and spdcards2 use SC1 and SC2
      const spd1 = getResult(compUserId, "SC1");
      row.push(spd1?.rawScore !== undefined ? spd1.rawScore : "N/A");
      row.push(spd1?.time !== undefined ? spd1.time : "N/A");
      const spd2 = getResult(compUserId, "SC2");
      row.push(spd2?.rawScore !== undefined ? spd2.rawScore : "N/A");
      row.push(spd2?.time !== undefined ? spd2.time : "N/A");
      scoreRows.push(row);
    });
    const scoreCsv =
      "\uFEFF" +
      scoreFields.join(",") +
      "\n" +
      scoreRows.map((r) => r.join(",")).join("\n") +
      "\n";
    const scoreBlob = new Blob([scoreCsv], { type: "text/csv;charset=utf-8" });
    const scoreUrl = URL.createObjectURL(scoreBlob);
    const scoreLink = document.createElement("a");
    scoreLink.href = scoreUrl;
    scoreLink.download = "score.csv";
    document.body.appendChild(scoreLink);
    scoreLink.click();
    document.body.removeChild(scoreLink);
    URL.revokeObjectURL(scoreUrl);
  };

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
                <p onClick={handleExportStats} className="highlightText">
                  Export Results for Stats >>>
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
                                          result.additionalInfo,
                                          result.status
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
