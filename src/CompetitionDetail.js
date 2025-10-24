import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Row, Col, Button, Modal, Form } from "react-bootstrap";
import { useUser } from "./UserProvider";
import { fetchCurrentUserData, getToken, getFlagEmoji } from "./utils";
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
import { faTrash, faRedoAlt } from "@fortawesome/free-solid-svg-icons";
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
  const [importedCompetitors, setImportedCompetitors] = useState([]);
  const [countryFlagSummary, setCountryFlagSummary] = useState(null);

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

  const handleCancelEdit = () => {
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
    setCountryFlagSummary(null);
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

    // --- Country matching logic ---
    // 1. Load country list from countries.csv (hardcoded here for now)
    const countryList = [
      "Afghanistan",
      "Albania",
      "Algeria",
      "Andorra",
      "Angola",
      "Antigua and Barbuda",
      "Argentina",
      "Armenia",
      "Australia",
      "Austria",
      "Azerbaijan",
      "The Bahamas",
      "Bahrain",
      "Bangladesh",
      "Barbados",
      "Belarus",
      "Belgium",
      "Belize",
      "Benin",
      "Bhutan",
      "Bolivia",
      "Bosnia and Herzegovina",
      "Botswana",
      "Brazil",
      "Brunei",
      "Bulgaria",
      "Burkina Faso",
      "Burundi",
      "Cabo Verde",
      "Cambodia",
      "Cameroon",
      "Canada",
      "Central African Republic",
      "Chad",
      "Chile",
      "China",
      "Colombia",
      "Comoros",
      "Congo, Democratic Republic of the",
      "Congo, Republic of the",
      "Costa Rica",
      "Côte d’Ivoire",
      "Croatia",
      "Cuba",
      "Cyprus",
      "Czech Republic",
      "Denmark",
      "Djibouti",
      "Dominica",
      "Dominican Republic",
      "England",
      "East Timor (Timor-Leste)",
      "Ecuador",
      "Egypt",
      "El Salvador",
      "Equatorial Guinea",
      "Eritrea",
      "Estonia",
      "Eswatini",
      "Ethiopia",
      "Fiji",
      "Finland",
      "France",
      "Gabon",
      "The Gambia",
      "Georgia",
      "Germany",
      "Ghana",
      "Greece",
      "Grenada",
      "Guatemala",
      "Guinea",
      "Guinea-Bissau",
      "Guyana",
      "Haiti",
      "Honduras",
      "Hungary",
      "Iceland",
      "India",
      "Indonesia",
      "Iran",
      "Iraq",
      "Ireland",
      "Israel",
      "Italy",
      "Jamaica",
      "Japan",
      "Jordan",
      "Kazakhstan",
      "Kenya",
      "Kiribati",
      "Korea, North",
      "Korea, South",
      "Kosovo",
      "Kuwait",
      "Kyrgyzstan",
      "Laos",
      "Latvia",
      "Lebanon",
      "Lesotho",
      "Liberia",
      "Libya",
      "Liechtenstein",
      "Lithuania",
      "Luxembourg",
      "Madagascar",
      "Malawi",
      "Malaysia",
      "Maldives",
      "Mali",
      "Malta",
      "Marshall Islands",
      "Mauritania",
      "Mauritius",
      "Mexico",
      "Micronesia, Federated States of",
      "Moldova",
      "Monaco",
      "Mongolia",
      "Montenegro",
      "Morocco",
      "Mozambique",
      "Myanmar (Burma)",
      "Namibia",
      "Nauru",
      "Nepal",
      "Netherlands",
      "New Zealand",
      "Nicaragua",
      "Niger",
      "Nigeria",
      "North Macedonia",
      "Northern Ireland",
      "Norway",
      "Oman",
      "Pakistan",
      "Palau",
      "Panama",
      "Papua New Guinea",
      "Paraguay",
      "Peru",
      "Philippines",
      "Poland",
      "Portugal",
      "Qatar",
      "Romania",
      "Russia",
      "Rwanda",
      "Saint Kitts and Nevis",
      "Saint Lucia",
      "Saint Vincent and the Grenadines",
      "Samoa",
      "San Marino",
      "Sao Tome and Principe",
      "Saudi Arabia",
      "Scotland",
      "Senegal",
      "Serbia",
      "Seychelles",
      "Sierra Leone",
      "Singapore",
      "Slovakia",
      "Slovenia",
      "Solomon Islands",
      "Somalia",
      "South Africa",
      "Spain",
      "Sri Lanka",
      "Sudan",
      "Sudan, South",
      "Suriname",
      "Sweden",
      "Switzerland",
      "Syria",
      "Taiwan",
      "Tajikistan",
      "Tanzania",
      "Thailand",
      "Togo",
      "Tonga",
      "Trinidad and Tobago",
      "Tunisia",
      "Turkey",
      "Turkmenistan",
      "Tuvalu",
      "Uganda",
      "Ukraine",
      "United Arab Emirates",
      "United States",
      "Uruguay",
      "Uzbekistan",
      "Vanuatu",
      "Vatican City",
      "Venezuela",
      "Vietnam",
      "Wales",
      "Yemen",
      "Zambia",
      "Zimbabwe",
    ];

    // 2. For each competitor, match country using string similarity
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
        // --- Country matching ---
        let countryRaw = cols[1]?.trim() || "";
        let matchedCountry = countryRaw;
        let countryMatchStatus = null;
        if (countryRaw && !countryList.includes(countryRaw)) {
          // Find closest match using string similarity
          let bestMatch = stringSimilarity.findBestMatch(
            countryRaw,
            countryList
          );
          if (bestMatch.bestMatch.rating >= 0.8) {
            matchedCountry = bestMatch.bestMatch.target;
            countryMatchStatus = {
              type: "close",
              matched: matchedCountry,
              original: countryRaw,
            };
          } else {
            matchedCountry = "(none)";
            countryMatchStatus = { type: "none", original: countryRaw };
          }
        } else if (!countryRaw) {
          matchedCountry = "(none)";
          countryMatchStatus = { type: "none", original: countryRaw };
        }
        return {
          firstName,
          lastName,
          country: matchedCountry,
          birthYear,
          originalCountry: countryRaw,
          countryMatchStatus,
        };
      })
      .filter((c) => c.firstName);

    setImportedCompetitors(competitors);

    const foundMatches = findUserMatches(competitors, users, 0.8);
    setUserMatches(foundMatches);

    if (competitors.length === 0) {
      setImportError("No competitors found in the pasted data.");
      return;
    }

    // Block import if there are participant name matches (as before)
    if (foundMatches.length > 0) {
      return; // Do not save yet!
    }

    // Block import if there are any country partial matches (type 'close') or unrecognized (type 'none')
    const flaggedCountryMatches = competitors.filter(
      (c) =>
        c.countryMatchStatus &&
        (c.countryMatchStatus.type === "close" ||
          c.countryMatchStatus.type === "none")
    );
    if (flaggedCountryMatches.length > 0) {
      setCountryFlagSummary(flaggedCountryMatches);
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

              //only allow users who are in compAdmins, or admins or superAdmins
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

  const handleContinueImport = async () => {
    // userMatches: [{ participantFullName, matches }]
    // competitors: the original array of imported participants

    const selections = {};
    userMatches.forEach((match, idx) => {
      // Get the value from the select element for this participant
      const selectElem = document.getElementById(`participant-select-${idx}`);
      selections[idx] = selectElem ? selectElem.value : "new";
    });

    try {
      // 1. Prepare arrays for linking and creating
      const toLink = []; // { participantIdx, userId }
      const toCreate = []; // participantIdx (from userMatches)
      const matchedIdxs = new Set();

      userMatches.forEach((match, idx) => {
        const selection = selections[idx];
        if (selection && selection !== "new") {
          toLink.push({ participantIdx: idx, userId: selection });
          matchedIdxs.add(idx);
        } else {
          toCreate.push(idx);
          matchedIdxs.add(idx);
        }
      });

      // Find all imported competitors that were NOT matched by name (not in userMatches)
      const unmatchedCompetitors = importedCompetitors
        .map((c, idx) => ({ ...c, idx }))
        .filter((c) => !matchedIdxs.has(c.idx));

      // 2. Link participants to existing users (avoid duplicates)
      if (toLink.length > 0) {
        const userIds = toLink.map((item) => item.userId);
        // Only add userIds that are not already in compUsers
        const existingCompUsers = competitionData.compUsers || [];
        const newUserIds = userIds.filter(
          (id) => !existingCompUsers.includes(id)
        );
        const updatedCompetition = {
          compUsers: [...existingCompUsers, ...newUserIds],
        };
        await axios.put(`${backendUrl}/competition/${id}`, updatedCompetition, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCompetitionData((prev) => ({
          ...prev,
          compUsers: updatedCompetition.compUsers,
        }));
      }

      // 3. Create new users for remaining participants (from userMatches)
      let newUsers = [];
      if (toCreate.length > 0) {
        const newUsersData = toCreate.map((idx) => importedCompetitors[idx]);
        const response = await axios.post(
          `${backendUrl}/users/bulk`,
          {
            users: newUsersData.map((c) => ({
              firstName: c.firstName,
              lastName: c.lastName,
              country: c.country,
              birthYear: c.birthYear,
              verified: true,
              role: "user",
            })),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const createdIds = response.data.userIds || [];
        const updatedCompetition = {
          compUsers: competitionData.compUsers
            ? [...competitionData.compUsers, ...createdIds]
            : [...createdIds],
        };
        await axios.put(`${backendUrl}/competition/${id}`, updatedCompetition, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCompetitionData((prev) => ({
          ...prev,
          compUsers: updatedCompetition.compUsers,
        }));
        newUsers = createdIds.map((id, idx) => ({
          _id: id,
          ...newUsersData[idx],
          verified: true,
          role: "user",
        }));
        setUsers((prevUsers) => [...prevUsers, ...newUsers]);
      }

      // 4. Create new users for all unmatched competitors (not in userMatches)
      if (unmatchedCompetitors.length > 0) {
        const response = await axios.post(
          `${backendUrl}/users/bulk`,
          {
            users: unmatchedCompetitors.map((c) => ({
              firstName: c.firstName,
              lastName: c.lastName,
              country: c.country,
              birthYear: c.birthYear,
              verified: true,
              role: "user",
            })),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const createdIds = response.data.userIds || [];
        const updatedCompetition = {
          compUsers: competitionData.compUsers
            ? [...competitionData.compUsers, ...createdIds]
            : [...createdIds],
        };
        await axios.put(`${backendUrl}/competition/${id}`, updatedCompetition, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCompetitionData((prev) => ({
          ...prev,
          compUsers: updatedCompetition.compUsers,
        }));
        const newUsers = createdIds.map((id, idx) => ({
          _id: id,
          ...unmatchedCompetitors[idx],
          verified: true,
          role: "user",
        }));
        setUsers((prevUsers) => [...prevUsers, ...newUsers]);
      }

      alert("Import complete!");
      setShowImportModal(false);
    } catch (err) {
      setImportError(
        "Error during import. Please check your data and try again."
      );
      console.error(err);
    }
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

  // Handler for regenerating discipline data
  function handleRegenerateDisciplineData(discipline) {
    if (
      !window.confirm(
        `Are you sure you want to regenerate data for ${getDisciplineNameFromRef(
          discipline
        )}? This action cannot be undone.`
      )
    )
      return;
    // TODO: Implement the actual regeneration logic here (API call or local logic)
    alert(
      `Regeneration for ${getDisciplineNameFromRef(discipline)} triggered.`
    );
  }

  // Handler for acknowledging country flag summary
  // handleAcknowledgeCountryFlags removed (no longer needed)

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
              onCancel={handleCancelEdit}
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
                        return (
                          <tr key={userId}>
                            <td>
                              {!user && "<Deleted User>"}
                              {user?.firstName} {user?.lastName}
                              {user?.country && user?.country !== "(none)" && (
                                <span style={{ marginLeft: "6px" }}>
                                  {getFlagEmoji(user.country)}
                                </span>
                              )}
                              {user?.country === "(none)" && (
                                <span
                                  style={{
                                    marginLeft: "6px",
                                    fontStyle: "italic",
                                    color: "#888",
                                  }}
                                >
                                  (no affiliation)
                                </span>
                              )}
                              {/* Flag if imported with a close or unrecognized country match */}
                              {importedCompetitors &&
                                importedCompetitors.length > 0 &&
                                (() => {
                                  const imported = importedCompetitors.find(
                                    (c) =>
                                      c.firstName === user?.firstName &&
                                      c.lastName === user?.lastName &&
                                      c.birthYear === user?.birthYear
                                  );
                                  if (
                                    imported &&
                                    imported.countryFlag === "close"
                                  ) {
                                    return (
                                      <span
                                        style={{
                                          color: "#b8860b",
                                          marginLeft: 8,
                                          fontWeight: 600,
                                        }}
                                      >
                                        (imported: matched country)
                                      </span>
                                    );
                                  }
                                  if (
                                    imported &&
                                    imported.countryFlag === "none"
                                  ) {
                                    return (
                                      <span
                                        style={{
                                          color: "#b00",
                                          marginLeft: 8,
                                          fontWeight: 600,
                                        }}
                                      >
                                        (imported: country not recognized)
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
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
                            <td
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5em",
                              }}
                            >
                              {getDisciplineNameFromRef(discipline)}
                              {/* Regenerate button for superAdmin, admin or comp admin (not participant) */}
                              {(userData.role === "superAdmin" ||
                                userData.role === "admin" ||
                                (competitionData.compAdmins &&
                                  competitionData.compAdmins.includes(
                                    userData._id
                                  ))) &&
                                !(
                                  competitionData.compUsers &&
                                  competitionData.compUsers.includes(
                                    userData._id
                                  )
                                ) && (
                                  <FontAwesomeIcon
                                    className="menuIcon"
                                    icon={faRedoAlt}
                                    title="Regenerate Data"
                                    style={{
                                      fontSize: "1em",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      handleRegenerateDisciplineData(discipline)
                                    }
                                  />
                                )}
                            </td>
                            {userData.role === "superAdmin" && <td></td>}
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
            {/* Show summary of flagged country issues after import, before closing modal */}
            {countryFlagSummary && (
              <div
                style={{
                  background: "#fffbe6",
                  border: "1px solid #b8860b",
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <h5>Country Issues Detected</h5>
                <ul>
                  {countryFlagSummary.map((c, i) => (
                    <li key={i}>
                      <strong>
                        {c.firstName} {c.lastName}
                      </strong>
                      {c.countryMatchStatus &&
                        c.countryMatchStatus.type === "close" && (
                          <span style={{ color: "#b8860b", marginLeft: 8 }}>
                            Country not found: "{c.countryMatchStatus.original}
                            ". Closest match used: "
                            {c.countryMatchStatus.matched}".
                          </span>
                        )}
                      {c.countryMatchStatus &&
                        c.countryMatchStatus.type === "none" && (
                          <span style={{ color: "#b00", marginLeft: 8 }}>
                            Country not recognized: "
                            {c.countryMatchStatus.original}" (set as "(none)")
                          </span>
                        )}
                    </li>
                  ))}
                </ul>
                <div
                  style={{
                    fontSize: "0.95em",
                    color: "#b8860b",
                    marginBottom: 8,
                  }}
                >
                  <strong>Note:</strong> Some country names may differ from the
                  official list. Please check your data for spelling or naming
                  variations.
                </div>
                {/* No OK button needed */}
              </div>
            )}
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
                  {userMatches.map(({ participantFullName, matches }, idx) => {
                    // Find the imported competitor for this match
                    const competitor = importedCompetitors.find(
                      (c) =>
                        (
                          c.firstName + (c.lastName ? " " + c.lastName : "")
                        ).trim() === participantFullName
                    );
                    return (
                      <div key={idx} style={{ marginBottom: "1em" }}>
                        <strong>{participantFullName}</strong>
                        {competitor &&
                          competitor.countryMatchStatus &&
                          competitor.countryMatchStatus.type === "close" && (
                            <span style={{ color: "#b8860b", marginLeft: 8 }}>
                              (Country matched to "
                              {competitor.countryMatchStatus.matched}" from "
                              {competitor.countryMatchStatus.original}")
                            </span>
                          )}
                        {competitor &&
                          competitor.countryMatchStatus &&
                          competitor.countryMatchStatus.type === "none" && (
                            <span style={{ color: "#b00", marginLeft: 8 }}>
                              (Country not recognized: "
                              {competitor.countryMatchStatus.original}")
                            </span>
                          )}
                        &nbsp;&nbsp;
                        {matches.length > 0 && (
                          <select id={`participant-select-${idx}`}>
                            {matches.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.firstName} {user.lastName} ({user.country}
                                )
                              </option>
                            ))}
                            <option value="new">
                              Continue adding as new user
                            </option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleImportModalClose}>
              Cancel
            </Button>
            {userMatches.length > 0 || countryFlagSummary ? (
              <Button variant="primary" onClick={handleContinueImport}>
                Continue Import
              </Button>
            ) : (
              <Button variant="primary" type="submit">
                Import
              </Button>
            )}
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default CompetitionDetail;
