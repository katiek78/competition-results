import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "./UserProvider";
import axios from "axios";
import { backendUrl, disciplines, getDisciplineRefFromName } from "./constants";
import { fetchCurrentUserData, getToken } from "./utils";
import { Button } from "react-bootstrap";

const token = getToken();

const Compete = () => {
  const { compId, discipline } = useParams();
  const { user } = useUser();
  const [competitionData, setCompetitionData] = useState({});
  const [userData, setUserData] = useState({});
  const [disciplineName, setDisciplineName] = useState("");

  function findMatchingDiscipline(d) {
    console.log(disciplines);
    // Find the discipline in the array based on label
    return disciplines.find((discipline) => discipline.label === d);
  }

  //   const saveScore = (
  //     decryptedScore,
  //     decryptedDisciplineName,
  //     time,
  //     additionalInfo
  //   ) => {
  //     const disciplineRef = getDisciplineRefFromName(decryptedDisciplineName);

  //     if (disciplineRef === "Unknown Discipline") {
  //       alert(
  //         "There was an error processing your score (discipline name does not match). Please see a competition official. Note: Your score has NOT been added"
  //       );
  //       return;
  //     }

  //     const newResult = {
  //       compUser: user.userId,
  //       discipline: getDisciplineRefFromName(decryptedDisciplineName),
  //       rawScore: decryptedScore,
  //     };
  //     if (disciplineRef.includes("SC")) newResult.time = time;
  //     if (disciplineRef.includes("W")) {
  //       newResult.additionalInfo = additionalInfo;
  //       newResult.provisional = true;
  //     }

  //     //check for duplicate result and alert user if they already submitted one for this discipline
  //     if (
  //       isDuplicateResult(
  //         competitionData.compResults,
  //         newResult.compUser,
  //         newResult.discipline
  //       )
  //     ) {
  //       alert(
  //         "You've already submitted a score for this discipline. Please see a competition official if you feel this is an error. Note: This new score has NOT been added."
  //       );
  //       return;
  //     }

  //     try {
  //       const updatedCompetition = {
  //         // ...competitionData,
  //         compResults: competitionData.compResults
  //           ? [...competitionData.compResults, newResult]
  //           : [newResult],
  //       };

  //       // set configurations
  //       const configuration = {
  //         method: "put",
  //         url: `${backendUrl}/competition/${id}`,
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //         data: updatedCompetition,
  //       };

  //       axios(configuration);
  //       setScore(decryptedScore);
  //       if (time) setTime(time);
  //       setDisciplineName(decryptedDisciplineName);
  //       setCompetitionData({
  //         ...competitionData,
  //         compResults: updatedCompetition.compResults,
  //       });
  //       setShowMessage(true);
  //     } catch (error) {
  //       console.error("Error adding result:", error);
  //       alert(
  //         "Your score could not be added. Please try submitting again, or see a competition official."
  //       );
  //     }
  //   };

  //   //could not be processed

  //   const handleSubmitScore = () => {
  //     //decrypt the message
  //     const decryptedText = decryptMessage(code);
  //     alert(decryptedText);

  //     let decryptedScore, additionalInfo, time, timestamp;

  //     // Parse the discipline name separately
  //     const disciplinePattern = /Discipline: ([^//]+)/;
  //     const disciplineMatch = decryptedText.match(disciplinePattern);
  //     const decryptedDisciplineName = disciplineMatch[1].trim();

  //     //parse the text
  //     if (decryptedDisciplineName.includes("Words")) {
  //       // Split by //
  //       const parts = decryptedText.split(/\s*\/\/\s*/);

  //       // Find the part with "Score:" and process it
  //       const scorePart = parts.find((part) => part.includes("Score:"));
  //       if (scorePart) {
  //         // Remove "Score:" and take everything before the first newline as the score
  //         const scoreMatch = scorePart.replace("Score:", "").split(/\r?\n/);
  //         decryptedScore = parseInt(scoreMatch[0], 10);

  //         // Take the rest of the part as additional info
  //         additionalInfo = scoreMatch.slice(1).join("\n").trim();

  //         // Extract timestamp from the last part and remove "Timestamp:"
  //         timestamp = new Date(
  //           parts[parts.length - 1].replace("Timestamp:", "").trim()
  //         );
  //       }
  //     } else {
  //       //const pattern = /Discipline: ([^//]+) \/\/ Score: (\d+)(?:\r?\n)? \/\/ Time:([\d.]+) \/\/ Timestamp: (.+)/;
  //       // const pattern = /Discipline: ([^//]+) \/\/ Score: (\d+)(?: \/\/ Time:([\d.]+))?(?: \/\/ Timestamp: (.+))?/;
  //       const pattern =
  //         /Discipline:\s*([^//]+)\s*\/\/\s*Score:\s*(\d+)(?:\s*\/\/\s*Time:\s*([\d.]+))?(?:\s*\/\/\s*Timestamp:\s*(.+))?/;

  //       const match = decryptedText.match(pattern);
  //       console.log(match);
  //       if (match) {
  //         decryptedScore = parseInt(match[2], 10); // Parse score as an integer
  //         time = decryptedDisciplineName.includes("Speed Cards")
  //           ? match[3]
  //           : undefined;
  //         console.log(time); //undefined
  //         timestamp = new Date(match[4]);
  //       } else {
  //         // If string does not match pattern, alert the user that they need to check and try again
  //         alert(
  //           "Code could not be processed. Please check and try again, or ask a competition official. Note: Your score has NOT been added."
  //         );
  //         return;
  //       }
  //     }
  //     //example
  //     //U2FsdGVkX1+SH9v3jyQxf+sM6zabyDhf+lmboyeTo8DCEBZ9og1+y3Yum3PoVMgbIThCOPbBP9QC2FRusHNtgVtICGu/3QbDiRhJC62W/bOdV+N9Vxfsk2OlicGD3NyDHR78BWcVWhkP0pzzX150zfpDNxUcnvquC3AGQpZ1oTA=

  //     //example
  //     // U2FsdGVkX1+capKaSvir9g3hWyBepNV8ASaxFccx3hrx19zwWs3QccrkkgVQvU8cMdvlAG5pC7BrlwVdIpb2hdzYSmJKMOpl+Zst0uDXSKHcP09dHloT4DjvK1rVTJMvq6yDnHAssbSwEKyBmlAlMQ==

  //     //example 5 min Numbers 2
  //     //U2FsdGVkX182DuzMqJQOoleEZ0MDvCYKCxuT5ch8UER/kn74JkI0ahqqryGFrsphNYu4fZTu1ndD+8q4BwVAmzc2uigJySOJ2lbK7XzCj11/37bgPAHtzzg7g7egas/yKHeqgcWbuOhw/Y+9HTuZqA==

  //     const isRecent =
  //       Date.now() - timestamp.getTime() <= RECENT_MINUTES * 60 * 1000;

  //     if (!isRecent) {
  //       alert(
  //         `This code was generated more than ${RECENT_MINUTES} minutes ago. Please see a competition official. Note: Your score has NOT been added.`
  //       );
  //       return;
  //     }
  //     console.log(decryptedDisciplineName);
  //     // Check if disciplineName can be matched to a discipline and if not, alert user
  //     if (findMatchingDiscipline(decryptedDisciplineName)) {
  //       saveScore(decryptedScore, decryptedDisciplineName, time, additionalInfo);
  //     } else {
  //       alert(
  //         "There was an error processing your score (discipline name does not match). Please see a competition official. Note: Your score has NOT been added."
  //       );
  //     }
  //   };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetchCurrentUserData(user.userId);

        if (fetchedData) {
          // Do something with the userData
          setUserData(fetchedData);

          //Then get competition data
          // set configurations
          const configuration = {
            method: "get",
            url: `${backendUrl}/competition/${compId}`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          // make the API call
          axios(configuration)
            .then((result) => {
              setCompetitionData(result.data);

              //only allow users who are in compUsers
              if (result.data.compUsers?.indexOf(fetchedData._id) === -1) {
                // redirect user to the home page
                window.location.href = "/";
              }
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
  }, [user, compId]); // The empty dependency array ensures the effect runs only once on mount

  return (
    <>
      <div>
        <h1 className="text-center">{competitionData.name}</h1>
      </div>
    </>
  );
};

export default Compete;
