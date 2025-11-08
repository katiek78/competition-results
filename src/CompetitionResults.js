import React, { useEffect, useState, useMemo } from "react";
import CompetitorModal from "./CompetitorModal";
import ErrorBoundary from "./ErrorBoundary";
import { Modal, Form, Button } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import { useUser } from "./UserProvider";
import axios from "axios";
import {
  getDisciplineNameFromRef,
  getDisciplineStandardFromRef,
  AGE_GROUPS,
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
  getFlagEmoji,
} from "./utils";
import { backendUrl } from "./constants";
import { generateCompId } from "./competitionIdUtils";

const CompetitionResults = () => {
  // Modal state and handler already declared above
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);

  // Loading and error states for better mobile UX
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mobile-friendly confirmation dialog
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    user: null,
    discipline: null,
  });

  const handleCompetitorClick = (user) => {
    try {
      // Add null checks for mobile safety
      if (!user || !user._id) {
        console.warn(
          "Invalid user data passed to handleCompetitorClick:",
          user
        );
        return;
      }
      setSelectedCompetitor(user);
      setShowCompetitorModal(true);
    } catch (error) {
      console.error("Error in handleCompetitorClick:", error);
      // alert("Unable to display competitor information. Please try again.");
    }
  };
  // Show competitors who haven't submitted a result for selectedDiscipline
  function showCompUsersNotSubmitted() {
    if (
      !competitionData ||
      !competitionData.compUsers ||
      !competitionData.compResults ||
      !selectedDiscipline
    )
      return;
    const submittedUserIds = competitionData.compResults
      .filter((r) => r.discipline === selectedDiscipline)
      .map((r) => r.compUser);
    const notSubmitted = competitionData.compUsers
      .filter((userId) => !submittedUserIds.includes(userId))
      .map((userId) => {
        const user = users.find((u) => u._id === userId);
        return user ? `${user.firstName} ${user.lastName}` : userId;
      });
    alert(
      notSubmitted.length > 0
        ? `Competitors who haven't submitted a result for ${getDisciplineNameFromRef(
            selectedDiscipline
          )}:\n\n${notSubmitted.join("\n")}`
        : "All competitors have submitted a result for this discipline."
    );
  }

  // Handle request review for a user's result
  async function handleRequestReview(compUserId) {
    if (!competitionData || !selectedDiscipline) return;
    const result = getResult(compUserId, selectedDiscipline);
    if (!result) {
      alert("No result found for this user and discipline.");
      return;
    }
    // Update status to 'review'
    const updatedResult = { ...result, status: "review" };
    try {
      const configuration = {
        method: "put",
        url: `${backendUrl}/competition/${id}/results/${compUserId}/${selectedDiscipline}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: updatedResult,
      };
      await axios(configuration);
      // Update local state
      setCompetitionData((prevCompetitionData) => {
        const updatedResults = prevCompetitionData.compResults.map((r) =>
          r.compUser === compUserId && r.discipline === selectedDiscipline
            ? updatedResult
            : r
        );
        return {
          ...prevCompetitionData,
          compResults: updatedResults,
        };
      });
      alert("Review requested successfully.");
    } catch (error) {
      console.error("Error requesting review:", error);
      alert("Failed to request review. Please try again.");
    }
  }
  // Helper: getResult
  function getResult(compUser, discipline) {
    if (!competitionData || !competitionData.compResults) return null;
    return (
      competitionData.compResults.find(
        (result) =>
          result.compUser === compUser && result.discipline === discipline
      ) || null
    );
  }

  // Helper: getNumberOfResultsForDiscipline
  function getNumberOfResultsForDiscipline(discipline) {
    if (!competitionData || !competitionData.compResults) return 0;
    return competitionData.compResults.filter(
      (result) => result.discipline === discipline
    ).length;
  }

  // Helper: formatDate
  function formatDate(date) {
    if (!date) return "";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  // importMode state removed (was unused)
  const [pendingImports, setPendingImports] = useState([]);
  const [validImports, setValidImports] = useState([]);
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [editFormValues, setEditFormValues] = useState("");
  const [compUserTotals, setCompUserTotals] = useState([]);
  const [showDisciplineMenu, setShowDisciplineMenu] = useState(false);
  const [roundingOn, setRoundingOn] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [importDiscipline, setImportDiscipline] = useState("");

  // Safe mobile detection using useState and useEffect to prevent render issues
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return typeof window !== "undefined" && window.innerWidth < 769;
    } catch (error) {
      console.warn("Error detecting mobile viewport:", error);
      return false; // Default to desktop view if detection fails
    }
  });

  // Age group filter state: all selected by default
  const ageGroups = [
    { key: "kids", label: "Kids", color: "#87cefa", textColor: "#222" },
    { key: "juniors", label: "Juniors", color: "#4682b4", textColor: "#fff" },
    { key: "adults", label: "Adults", color: "#274472", textColor: "#fff" },
    { key: "seniors", label: "Seniors", color: "#3a8a16ff", textColor: "#fff" },
  ];
  const [selectedAgeGroups, setSelectedAgeGroups] = useState(
    ageGroups.map((g) => g.key)
  );

  const allAgeGroupsSelected = selectedAgeGroups.length === ageGroups.length;

  // Toggle age group selection
  const handleToggleAgeGroup = (key) => {
    if (key === "all-ages") {
      // When "all-ages" is clicked, always select all age groups
      setSelectedAgeGroups(ageGroups.map((g) => g.key));
      return;
    }

    setSelectedAgeGroups((prev) => {
      let newSelection;
      if (prev.includes(key)) {
        // Removing this age group
        newSelection = prev.filter((k) => k !== key);
      } else {
        // Adding this age group
        newSelection = [...prev, key];
        // If all age groups are now selected, keep them all selected
        if (newSelection.length === ageGroups.length) {
          return ageGroups.map((g) => g.key);
        }
      }
      return newSelection;
    });
  };

  // Helper: get age group for a user (by birthYear)
  function getUserAgeGroup(user) {
    const year = user?.birthYear;
    if (!year) return "adults";
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    if (age >= AGE_GROUPS.kids.minAge && age <= AGE_GROUPS.kids.maxAge)
      return "kids";
    if (age >= AGE_GROUPS.juniors.minAge && age <= AGE_GROUPS.juniors.maxAge)
      return "juniors";
    if (age >= AGE_GROUPS.seniors.minAge) return "seniors";
    return "adults";
  }
  //const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // adjust this value to your needs

  const handleDisciplineToggle = () => {
    if (isMobile) {
      setShowDisciplineMenu(!showDisciplineMenu);
    }
  };

  const handleToggleRounding = () => {
    setRoundingOn(!roundingOn);
  };

  const handleImportModalClose = () => {
    setShowImportModal(false);
  };

  const handleImportSubmit = () => {
    // Parse imported scores
    const namesAndScores = importText
      .split("\n")
      .map((line) => {
        const parts = line.split("\t").map((item) => item.trim());

        let name, category, score;

        if (parts.length === 2) {
          // Two columns: name, score
          [name, score] = parts;
          category = "";
        } else if (parts.length >= 3) {
          // Three or more columns: check if second column is numeric (age group to ignore)
          const secondColumn = parts[1];
          const isNumeric =
            !isNaN(parseFloat(secondColumn)) && isFinite(secondColumn);

          if (isNumeric) {
            // Second column is numeric (age group), ignore it: name, age_group, score
            [name, , score] = parts;
            category = "";
          } else {
            // Second column is text (category), keep it: name, category, score
            [name, category, score] = parts;
          }
        } else {
          // Only one column or invalid format
          name = parts[0] || "";
          category = "";
          score = "";
        }

        return { name, category, score };
      })
      .filter((entry) => entry.name.trim() !== "" && entry.score.trim() !== ""); // Filter out rows with empty names or scores

    // Prepare competitor lookup (firstName + lastName)
    const competitors = competitionData.compUsers.map((cuId) => {
      const user = users.find((u) => u._id === cuId);
      return {
        _id: cuId,
        name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
      };
    });

    const disciplineLabel = importDiscipline
      ? getDisciplineNameFromRef(importDiscipline)
      : "No discipline selected";

    let issues = [];
    let valid = [];
    let duplicates = [];

    namesAndScores.forEach((entry, idx) => {
      // Match name to competitor
      const competitor = competitors.find(
        (c) => c.name.toLowerCase() === entry.name.toLowerCase()
      );
      if (!competitor) {
        issues.push(`Row ${idx + 1}: Name not matched: '${entry.name}'`);
        return;
      }
      // Check for duplicate score for this discipline
      const alreadyHasScore = competitionData.compResults.some(
        (r) =>
          r.compUser === competitor._id && r.discipline === importDiscipline
      );
      const importObj = {
        compUser: competitor._id,
        discipline: importDiscipline,
        rawScore: parseFloat(entry.score),
        time: 0,
        status: "submitted",
        additionalInfo: entry.category,
        timestamp: Date.now(),
        name: entry.name,
        row: idx + 1,
      };
      if (alreadyHasScore) {
        issues.push(
          `Row ${idx + 1}: Duplicate score for '${
            entry.name
          }' in ${disciplineLabel}`
        );
        duplicates.push(importObj);
      } else {
        valid.push(importObj);
      }
    });

    // If there are issues (unmatched names or duplicates), show error and options
    if (issues.length > 0) {
      setImportError(issues.join("\n"));
      setPendingImports(duplicates);
      setValidImports(valid);
      return;
    }

    // If no valid imports, show message
    if (valid.length === 0) {
      alert("No valid scores to import.");
      setValidImports([]);
      setPendingImports([]);
      return;
    }

    // If no issues, import all valid scores
    console.log(
      `[Import Debug] About to import ${valid.length} valid scores:`,
      valid
    );
    Promise.all(
      valid.map((importObj) => {
        // Use the 'add' URL for new results (no existing score), else use the 'edit' URL
        const alreadyHasScore = competitionData.compResults.some(
          (r) =>
            r.compUser === importObj.compUser &&
            r.discipline === importObj.discipline
        );
        console.log(
          `[Import Debug] Processing import for ${importObj.name}, discipline: ${importObj.discipline}, score: ${importObj.rawScore}`
        );
        const configuration = {
          method: "put",
          url: !alreadyHasScore
            ? `${backendUrl}/competition/${id}/results` // Add new result
            : `${backendUrl}/competition/${id}/results/${importObj.compUser}/${importObj.discipline}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: importObj,
        };
        return axios(configuration);
      })
    )
      .then(() => {
        // Fetch latest competition data to refresh the page
        const configuration = {
          method: "get",
          url: `${backendUrl}/competition/${id}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        axios(configuration)
          .then((result) => {
            console.log(
              `[Import Success] Updated competition data:`,
              result.data
            );
            console.log(
              `[Import Success] Total compResults after import:`,
              result.data.compResults?.length
            );
            console.log(
              `[Import Success] Results for discipline ${importDiscipline}:`,
              result.data.compResults?.filter(
                (r) => r.discipline === importDiscipline
              )
            );
            setCompetitionData(result.data);

            alert(
              `${valid.length} new score${
                valid.length !== 1 ? "s" : ""
              } imported.`
            );
            setShowImportModal(false);
            setImportError("");
            setPendingImports([]);
            setImportText("");

            // Refresh current discipline standings if we're on a discipline
            if (selectedDiscipline) {
              handleSelectDiscipline(selectedDiscipline);
            }
          })
          .catch((error) => {
            alert("Scores imported, but failed to refresh data.");
          });
      })
      .catch((error) => {
        alert("Error importing scores. Please try again.");
      });
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
    // Use mobile-friendly confirmation dialog instead of window.confirm
    setDeleteConfirm({ show: true, user, discipline });
  };

  const confirmDelete = () => {
    const { user, discipline } = deleteConfirm;
    const resultIndex = competitionData.compResults.findIndex(
      (result) => result.compUser === user && result.discipline === discipline
    );
    deleteResult(resultIndex);
    setDeleteConfirm({ show: false, user: null, discipline: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, user: null, discipline: null });
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

  // Handle mobile detection and resize events safely
  useEffect(() => {
    const handleResize = () => {
      try {
        const isMobileNow = window.innerWidth < 769;
        setIsMobile(isMobileNow);
        // Auto-hide discipline menu on mobile after resize
        if (isMobileNow) {
          setShowDisciplineMenu(false);
        }
      } catch (error) {
        console.warn("Error in resize handler:", error);
      }
    };

    // Add resize listener with error handling
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

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
        setLoading(true);
        setError(null);

        // Fetch user data if user is logged in (optional)
        if (user) {
          const fetchedData = await fetchCurrentUserData(user.userId);
          if (fetchedData) {
            setUserData(fetchedData);
          }
        }

        // Always fetch competition data (public access)
        const configuration = {
          method: "get",
          url: `${backendUrl}/competition/${id}`,
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        };

        // Make the API call
        const result = await axios(configuration);
        setCompetitionData(result.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching competition data:", error);
        setError("Failed to load competition data. Please refresh the page.");
        setLoading(false);
      }
    };
    fetchData();
  }, [user, id, token]);

  useEffect(() => {
    // Fetch competition participants using the public endpoint
    // This is used for everyone (authenticated and public users) for better security
    const fetchUsers = async () => {
      try {
        if (competitionData && competitionData.compUsers) {
          const configuration = {
            method: "get",
            url: `${backendUrl}/users/public/${id}`,
          };
          const result = await axios(configuration);
          setUsers(result.data.users || []);
        }
      } catch (error) {
        console.error("Error fetching competition participants:", error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, [competitionData, id]); // Col 1: 11111111111X1111111X micrascope (12), cabbige (20)

  const handleSelectDiscipline = (discipline) => {
    if (competitionData?.compResults) {
      const resultsForDiscipline = competitionData.compResults.filter(
        (r) => r.discipline === discipline
      );
      console.log(
        `[Discipline Selection] Results for ${discipline}:`,
        resultsForDiscipline
      );
    }
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
      exportData.sort((a, b) => {
        // Primary sort: by total championship points
        const totalDiff = b.total - a.total;
        if (totalDiff !== 0) return totalDiff;

        // Secondary sort: by name (extract lastName from full name)
        const nameA = a.name.split(" ");
        const nameB = b.name.split(" ");
        const lastNameA = nameA.length > 1 ? nameA[nameA.length - 1] : nameA[0];
        const lastNameB = nameB.length > 1 ? nameB[nameB.length - 1] : nameB[0];
        const firstNameA =
          nameA.length > 1 ? nameA.slice(0, -1).join(" ") : nameA[0];
        const firstNameB =
          nameB.length > 1 ? nameB.slice(0, -1).join(" ") : nameB[0];

        const lastNameCompare = lastNameA.localeCompare(lastNameB);
        return lastNameCompare !== 0
          ? lastNameCompare
          : firstNameA.localeCompare(firstNameB);
      })
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
    // 1. Export competition.csv (unchanged)
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
        : false,
      competitionData?.adult_rankable !== undefined
        ? competitionData.adult_rankable
        : competitionData?.Adult_rankable !== undefined
        ? competitionData.Adult_rankable
        : competitionData?.adultRankable !== undefined
        ? competitionData.adultRankable
        : false,
      competitionData?.country || "N/A",
      competitionData?.championship_type || "N/A",
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
    // Build scoreFields: combine trials/attempts as required, but respect custom order
    const statsDisciplineFields = [];
    const disciplineOrder = competitionData?.disciplines || [];
    let insertedNum5 = false;
    let insertedSpoken1 = false;
    let insertedSpeedCards = false;

    for (let i = 0; i < disciplineOrder.length; i++) {
      const d = disciplineOrder[i];
      const name = getDisciplineNameFromRef(d);
      // 5-min Numbers Trials
      if (
        !insertedNum5 &&
        (name === "5-minute Numbers Trial 1" ||
          name === "5-minute Numbers Trial 2")
      ) {
        statsDisciplineFields.push("NUM5");
        insertedNum5 = true;
        continue;
      }
      // Spoken Numbers Attempts
      if (
        !insertedSpoken1 &&
        [
          "Spoken Numbers Attempt 1",
          "Spoken Numbers Attempt 2",
          "Spoken Numbers Attempt 3",
        ].includes(name)
      ) {
        statsDisciplineFields.push("SPOKEN1");
        insertedSpoken1 = true;
        continue;
      }
      // Speed Cards Trials
      if (
        !insertedSpeedCards &&
        (name === "Speed Cards Trial 1" || name === "Speed Cards Trial 2")
      ) {
        statsDisciplineFields.push(
          "spdcards1_cards",
          "spdcards1_time",
          "spdcards2_cards",
          "spdcards2_time"
        );
        insertedSpeedCards = true;
        continue;
      }
      // Skip all trials/attempts (they are handled above)
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
      ) {
        continue;
      }
      // Add mapped discipline or ref
      const statsId = disciplineNameToStatsId[name];
      if (statsId) statsDisciplineFields.push(statsId);
      else statsDisciplineFields.push(d);
    }

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
      // If country is '(none)', export as 'undefined'
      let exportCountry = user.country;
      if (exportCountry === "(none)") exportCountry = "undefined";
      const row = [
        user.firstName || "N/A",
        user.lastName || "N/A",
        user.iamId || user.iam_id || "N/A",
        exportCountry || "N/A",
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

  // Log current state immediately when component renders
  if (competitionData) {
    // console.log("=== CURRENT DATA ANALYSIS ===");
    // console.log("Competition name:", competitionData.name);
    // console.log(
    //   "Total results in system:",
    //   competitionData.compResults?.length || 0
    // );
    // console.log("All disciplines:", competitionData.disciplines);
    // console.log("All results:", competitionData.compResults);
    // // Check for 15-minute Words specifically
    // const wordsResults = competitionData.compResults?.filter(
    //   (r) =>
    //     r.discipline?.toLowerCase().includes("word") ||
    //     r.discipline?.includes("W") ||
    //     r.discipline?.includes("15W")
    // );
    // console.log("Results containing 'word' or 'W':", wordsResults);
    // // Check exact discipline matches
    // competitionData.disciplines?.forEach((discipline) => {
    //   const results = competitionData.compResults?.filter(
    //     (r) => r.discipline === discipline
    //   );
    //   console.log(`Results for discipline "${discipline}":`, results);
    // });
    // console.log("Selected discipline:", selectedDiscipline);
    // console.log("========================");
  }

  // Show loading state
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h3>Loading competition results...</h3>
        <p>Please wait while we load the data.</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#dc3545" }}>
        <h3>Unable to Load Results</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <>
      {competitionData ? (
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
                    View Setup {">>>"}
                  </Link>
                </p>
                <p onClick={handleExport} className="highlightText">
                  {/* <Link to={`/competition/${competitionData._id}`}> */}
                  Export Results {">>>"}
                  {/* </Link> */}
                </p>
                <p onClick={handleExportStats} className="highlightText">
                  Export Results for Stats {">>>"}
                </p>
              </>
            )}

            {isParticipant() && (
              <p className="highlightText">
                <Link to={`/competition_add_score/${competitionData._id}`}>
                  Add my score {">>>"}
                </Link>
              </p>
            )}

            {isAdmin() && !isParticipant() && (
              <>
                <p className="highlightText">
                  {/* <Link to={`/competition_add_user_score/${competitionData._id}/`}>Add score for a user >>></Link> */}
                  <span onClick={() => setShowScoreForm(true)}>
                    Add score for a user {">>>"}
                  </span>
                </p>
                <p className="highlightText">
                  <span onClick={() => setShowImportModal(true)}>
                    Import scores {">>>"}
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
            {/* Age group buttons below discipline buttons */}
            <div className="age-group-container">
              <button
                key={"all-ages"}
                type="button"
                className="age-group-button"
                onClick={() => handleToggleAgeGroup("all-ages")}
                style={{
                  background: "darkorange",
                  color: "white",
                  border: allAgeGroupsSelected ? "3px solid #222" : "none",
                  boxShadow: allAgeGroupsSelected
                    ? "0 0 0 2px #fff, 0 0 0 4px #222"
                    : "none",
                  opacity: allAgeGroupsSelected ? 1 : 0.6,
                  outline: allAgeGroupsSelected ? "2px solid #222" : "none",
                }}
              >
                All ages
              </button>
              {ageGroups.map((group) => {
                const selected = selectedAgeGroups.includes(group.key);
                return (
                  <button
                    key={group.key}
                    type="button"
                    className="age-group-button"
                    onClick={() => handleToggleAgeGroup(group.key)}
                    style={{
                      background: group.color,
                      color: group.textColor,
                      border: selected ? "3px solid #222" : "none",
                      boxShadow: selected
                        ? "0 0 0 2px #fff, 0 0 0 4px #222"
                        : "none",
                      opacity: selected ? 1 : 0.6,
                      outline: selected ? "2px solid #222" : "none",
                    }}
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>
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
                      {(() => {
                        const disciplineResults =
                          competitionData.compResults.filter(
                            (result) => result.discipline === selectedDiscipline
                          );
                        return disciplineResults;
                      })()
                        .filter((result) => {
                          const thisUser = users.find(
                            (u) => u._id === result.compUser
                          );
                          const group = getUserAgeGroup(thisUser);
                          return selectedAgeGroups.includes(group);
                        })
                        .sort((a, b) => {
                          if (selectedDiscipline.includes("SC")) {
                            // Speed Cards: sort by score, then by time for perfect scores
                            if (a.rawScore === 52 && b.rawScore === 52) {
                              const timeDiff = a.time - b.time;
                              if (timeDiff !== 0) return timeDiff;
                            } else {
                              const scoreDiff = b.rawScore - a.rawScore;
                              if (scoreDiff !== 0) return scoreDiff;
                            }
                          } else {
                            // Other disciplines: sort by score
                            const scoreDiff = b.rawScore - a.rawScore;
                            if (scoreDiff !== 0) return scoreDiff;
                          }

                          // Secondary sort: by name (lastName, then firstName)
                          const userA = users.find((u) => u._id === a.compUser);
                          const userB = users.find((u) => u._id === b.compUser);
                          const lastNameCompare = (
                            userA?.lastName || ""
                          ).localeCompare(userB?.lastName || "");
                          return lastNameCompare !== 0
                            ? lastNameCompare
                            : (userA?.firstName || "").localeCompare(
                                userB?.firstName || ""
                              );
                        })
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
                              <td>
                                <span
                                  className="asLink"
                                  style={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                  onClick={() =>
                                    handleCompetitorClick(thisUser)
                                  }
                                >
                                  {`${thisUser?.firstName || "Unknown"} ${
                                    thisUser?.lastName || "Unknown"
                                  }`}
                                </span>
                              </td>
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
                          .map((competitor) => {
                            // Find the user with the matching ID in the users array
                            const thisUser = users.find(
                              (u) => u._id === competitor.userId
                            ) || {
                              firstName: "Unknown",
                              lastName: "Unknown",
                            };
                            const group = getUserAgeGroup(thisUser);
                            return { competitor, thisUser, group };
                          })
                          .filter(({ group }) =>
                            selectedAgeGroups.includes(group)
                          )
                          .sort((a, b) => {
                            // Primary sort: by total championship points
                            const totalDiff =
                              b.competitor.unroundedTotal -
                              a.competitor.unroundedTotal;
                            if (totalDiff !== 0) return totalDiff;

                            // Secondary sort: by name (lastName, then firstName)
                            const lastNameCompare = (
                              a.thisUser?.lastName || ""
                            ).localeCompare(b.thisUser?.lastName || "");
                            return lastNameCompare !== 0
                              ? lastNameCompare
                              : (a.thisUser?.firstName || "").localeCompare(
                                  b.thisUser?.firstName || ""
                                );
                          })
                          .map(({ competitor, thisUser }, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>
                                <span
                                  className="asLink"
                                  style={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                  onClick={() =>
                                    handleCompetitorClick(thisUser)
                                  }
                                >
                                  {`${thisUser.firstName} ${thisUser.lastName}`}
                                </span>
                                {thisUser.country &&
                                  thisUser.country !== "(none)" && (
                                    <span style={{ marginLeft: "6px" }}>
                                      {getFlagEmoji(thisUser.country)}
                                    </span>
                                  )}
                                {thisUser.country === "(none)" && (
                                  <span
                                    style={{
                                      marginLeft: "6px",
                                      fontStyle: "italic",
                                      color: "#888",
                                    }}
                                  >
                                    (-)
                                  </span>
                                )}
                              </td>
                              <td className="champ-points">
                                {roundingOn
                                  ? competitor.unroundedTotal.toFixed(2)
                                  : competitor.total}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        !loading &&
        !error && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h3>No competition data available</h3>
            <p>Please check the competition ID and try again.</p>
          </div>
        )
      )}
      <ErrorBoundary>
        <CompetitorModal
          show={showCompetitorModal}
          onHide={() => setShowCompetitorModal(false)}
          competitor={selectedCompetitor}
          results={competitionData ? competitionData.compResults : []}
          disciplines={competitionData ? competitionData.disciplines : []}
          getDisciplineNameFromRef={getDisciplineNameFromRef}
        />
      </ErrorBoundary>

      {/* Mobile-friendly delete confirmation modal */}
      <Modal show={deleteConfirm.show} onHide={cancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this result? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showImportModal} onHide={handleImportModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Import Scores</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleImportSubmit}>
            <Form.Group controlId="importDisciplineDropdown">
              <Form.Label>Select discipline:</Form.Label>
              <Form.Select
                value={importDiscipline}
                onChange={(e) => setImportDiscipline(e.target.value)}
              >
                <option value="">-- Select discipline --</option>
                {competitionData &&
                  competitionData.disciplines &&
                  require("./constants")
                    .disciplines.filter((d) =>
                      competitionData.disciplines.includes(d.ref)
                    )
                    .map((d) => (
                      <option key={d.ref} value={d.ref}>
                        {d.label}
                      </option>
                    ))}
              </Form.Select>
            </Form.Group>
            <Form.Group
              controlId="importScoresTextarea"
              style={{ marginTop: "1em" }}
            >
              <Form.Label>
                Paste scores (name, [optional age group], score):
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="e.g. John Smith\t123 OR John Smith\tSenior\t123 OR John Smith\t65\t123"
                style={{ fontSize: "1.2em" }}
              />
            </Form.Group>
            {importError && <div style={{ color: "red" }}>{importError}</div>}
            {/* Show options if there are duplicate issues */}
            {importError && pendingImports.length > 0 ? (
              <div style={{ marginTop: "1em" }}>
                <div style={{ fontWeight: "bold" }}>
                  How would you like to proceed?
                </div>
                <div
                  style={{ display: "flex", gap: "1em", marginTop: "0.5em" }}
                >
                  <Button
                    variant={"outline-primary"}
                    type="button"
                    onClick={() => {
                      // Update existing scores (import all, using appropriate endpoint)
                      const allImports = [...validImports, ...pendingImports];
                      console.log(
                        `[Update Existing] About to process ${allImports.length} scores (${validImports.length} new + ${pendingImports.length} updates)`
                      );
                      Promise.all(
                        allImports.map((importObj) => {
                          // Use the 'add' URL for new results (no existing score), else use the 'edit' URL
                          const alreadyHasScore =
                            competitionData.compResults.some(
                              (r) =>
                                r.compUser === importObj.compUser &&
                                r.discipline === importObj.discipline
                            );
                          const configuration = {
                            method: "put",
                            url: !alreadyHasScore
                              ? `${backendUrl}/competition/${id}/results` // Add new result
                              : `${backendUrl}/competition/${id}/results/${importObj.compUser}/${importObj.discipline}`, // Edit existing result
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                            data: importObj,
                          };
                          console.log(
                            `[Update Existing] ${importObj.name}: ${
                              alreadyHasScore ? "UPDATE" : "ADD"
                            } - ${configuration.url}`
                          );
                          return axios(configuration);
                        })
                      )
                        .then(() => {
                          console.log(
                            `[Update Existing] Successfully processed ${allImports.length} scores`
                          );
                          alert(
                            `${allImports.length} score${
                              allImports.length !== 1 ? "s" : ""
                            } imported (including overwrites).`
                          );
                          setShowImportModal(false);
                          setImportError("");
                          setPendingImports([]);
                          setImportText("");
                          // Refresh competition data
                          const configuration = {
                            method: "get",
                            url: `${backendUrl}/competition/${id}`,
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          };
                          axios(configuration)
                            .then((result) => {
                              setCompetitionData(result.data);
                              console.log(
                                `[Update Existing] Competition data refreshed`
                              );

                              // Refresh current discipline standings if we're on a discipline
                              if (selectedDiscipline) {
                                handleSelectDiscipline(selectedDiscipline);
                              }
                            })
                            .catch((error) => {
                              console.error(
                                "[Update Existing] Error refreshing data:",
                                error
                              );
                            });
                        })
                        .catch((error) => {
                          console.error(
                            "[Update Existing] Error importing scores:",
                            error
                          );
                          alert("Error importing scores. Please try again.");
                        });
                    }}
                  >
                    Update existing scores
                  </Button>
                  <Button
                    variant={"outline-primary"}
                    type="button"
                    onClick={() => {
                      // Import only new scores - ONLY use ADD endpoint, skip duplicates entirely
                      console.log(
                        `[Import New Only] About to import ${validImports.length} new scores (using ADD endpoint only):`,
                        validImports
                      );
                      console.log(
                        `[Import New Only] Completely skipping ${pendingImports.length} duplicate scores:`,
                        pendingImports
                      );

                      if (validImports.length === 0) {
                        alert("No new scores to import (all were duplicates).");
                        setShowImportModal(false);
                        setImportError("");
                        setPendingImports([]);
                        setImportText("");
                        return;
                      }

                      Promise.all(
                        validImports.map((importObj) => {
                          console.log(
                            `[Import New Only] ADD: ${importObj.name} - ${importObj.discipline} - ${importObj.rawScore}`
                          );
                          const configuration = {
                            method: "put",
                            url: `${backendUrl}/competition/${id}/results`, // ALWAYS use ADD endpoint
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                            data: importObj,
                          };
                          console.log(
                            `[Import New Only] API call (ADD only):`,
                            configuration
                          );
                          return axios(configuration)
                            .then((response) => {
                              console.log(
                                `[Import New Only] API response for ${importObj.name}:`,
                                response.status,
                                response.data
                              );
                              return response;
                            })
                            .catch((error) => {
                              console.error(
                                `[Import New Only] API error for ${importObj.name}:`,
                                error.response?.status,
                                error.response?.data,
                                error.message
                              );
                              throw error;
                            });
                        })
                      )
                        .then(() => {
                          console.log(
                            `[Import New Only] Successfully imported ${validImports.length} new scores`
                          );
                          alert(
                            `${validImports.length} new score${
                              validImports.length !== 1 ? "s" : ""
                            } imported.`
                          );
                          setShowImportModal(false);
                          setImportError("");
                          setPendingImports([]);
                          setImportText("");

                          // Refresh current discipline standings if we're on a discipline
                          if (selectedDiscipline) {
                            handleSelectDiscipline(selectedDiscipline);
                          }

                          // Refresh competition data
                          const configuration = {
                            method: "get",
                            url: `${backendUrl}/competition/${id}`,
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          };
                          axios(configuration)
                            .then((result) => {
                              setCompetitionData(result.data);
                              console.log(
                                `[Import New Only] Competition data refreshed`
                              );
                            })
                            .catch((error) => {
                              console.error(
                                "[Import New Only] Error refreshing data:",
                                error
                              );
                            });
                        })
                        .catch((error) => {
                          console.error(
                            "[Import New Only] Error importing scores:",
                            error
                          );
                          alert("Error importing scores. Please try again.");
                        });
                    }}
                  >
                    Import only new scores
                  </Button>
                  <Button
                    variant={"outline-primary"}
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportError("");
                      setPendingImports([]);
                      setImportText("");
                    }}
                  >
                    Cancel import
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant={importDiscipline ? "primary" : "secondary"}
                type="button"
                style={{ marginTop: "1em" }}
                onClick={handleImportSubmit}
                disabled={!importDiscipline}
              >
                Import
              </Button>
            )}
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CompetitionResults;
