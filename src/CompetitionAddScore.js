import React, { useEffect, useState } from "react";
import { useParams, Link } from 'react-router-dom';
import { useUser } from "./UserProvider";
import axios from "axios";
import Cookies from "universal-cookie";
import { disciplines, getDisciplineRefFromName } from "./constants";
import { fetchCurrentUserData } from "./utils";
import { Button } from "react-bootstrap";
import CryptoJS from 'crypto-js';

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const CompetitionAddScore = () => {
    const { id } = useParams();
    const { user } = useUser();
    const [competitionData, setCompetitionData] = useState({});
    const [userData, setUserData] = useState({});
    const [code, setCode] = useState('');
    const [showMessage, setShowMessage] = useState('');
    const [score, setScore] = useState(0);
    const [disciplineName, setDisciplineName] = useState('');

    const RECENT_MINUTES = 20000;

    function decryptMessage(msg) {
        var key = "123";

        // Decrypt the message
        var bytes = CryptoJS.AES.decrypt(msg, key);
        var decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);

        // Replace special characters if needed
        decryptedMessage = decryptedMessage.replace(/#/g, "\n").replace(/\*/g, "\t");

        return decryptedMessage;
    }

    function findMatchingDiscipline(d) {
        // Find the discipline in the array based on label
        return disciplines.find(discipline => discipline.label === d);
    }

    function isDuplicateResult(compResults, compUser, discipline) {
        return compResults.some(result => result.compUser === compUser && result.discipline === discipline);
    }

    // const showScore = (score, disciplineName) => {
    //     setMessage(`Thank you! You've submitted a score of ${score} for ${disciplineName}. If you believe this score is incorrect, please keep your result on screen and see a competition official.`)
    // }


    const saveScore = (decryptedScore, decryptedDisciplineName, time, additionalInfo) => {

        const disciplineRef = getDisciplineRefFromName(decryptedDisciplineName);

        if (disciplineRef === 'Unknown Discipline') {
            alert("There was an error processing your score (discipline name does not match). Please see a competition official. Note: Your score has NOT been added");
            return;
        }

        const newResult = { compUser: user.userId, discipline: getDisciplineRefFromName(decryptedDisciplineName), rawScore: decryptedScore };
        if (disciplineRef.includes("SC")) newResult.time = time;
        if (disciplineRef.includes("W")) newResult.additionalInfo = additionalInfo;
        

        //check for duplicate result and alert user if they already submitted one for this discipline
        if (isDuplicateResult(competitionData.compResults, newResult.compUser, newResult.discipline)) {
            alert("You've already submitted a score for this discipline. Please see a competition official if you feel this is an error. Note: This new score has NOT been added.");
            return;
        }

        try {
            const updatedCompetition = {
                // ...competitionData,
                compResults: competitionData.compResults
                    ? [...competitionData.compResults, newResult]
                    : [newResult],
            };

            // set configurations
            const configuration = {
                method: "put",
                url: `https://competition-results.onrender.com/competition/${id}`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                data: updatedCompetition
            };

            axios(configuration);
            setScore(decryptedScore);
            setDisciplineName(decryptedDisciplineName);
            setCompetitionData({ ...competitionData, compResults: updatedCompetition.compResults, });
            setShowMessage(true);

        } catch (error) {
            console.error('Error adding result:', error);
            alert("Your score could not be added. Please try submitting again, or see a competition official.")
        }
    }

    const handleSubmitScore = () => {
        //decrypt the message
        const decryptedText = decryptMessage(code);
        alert(decryptedText)

        let decryptedScore, additionalInfo, time, timestamp;

        // Parse the discipline name separately
        const disciplinePattern = /Discipline: ([^//]+)/;
        const disciplineMatch = decryptedText.match(disciplinePattern);
        const decryptedDisciplineName = disciplineMatch[1].trim();

        console.log("banana")
        //parse the text
        if (decryptedDisciplineName.includes("Words")) {
            console.log("tomato")
            // Split by //
            const parts = decryptedText.split(/\s*\/\/\s*/);

            // Find the part with "Score:" and process it
            const scorePart = parts.find(part => part.includes("Score:"));
            if (scorePart) {
                // Remove "Score:" and take everything before the first newline as the score
                const scoreMatch = scorePart.replace("Score:", "").split(/\r?\n/);
                decryptedScore = parseInt(scoreMatch[0], 10);

                // Take the rest of the part as additional info
                additionalInfo = scoreMatch.slice(1).join('\n').trim();

                // Extract timestamp from the last part and remove "Timestamp:"
                timestamp = new Date(parts[parts.length - 1].replace("Timestamp:", "").trim());
            }

            // const pattern = /Discipline: ([^//]+) \/\/ Score: (\d+)([\s\S]+?) \/\/ Time:([\d.]+) \/\/ Timestamp: (.+)/;

            // const match = decryptedText.match(pattern);
            // console.log('Match:', match);
            // if (match) {
            //     decryptedScore = parseInt(match[2], 10); // Parse score as an integer
            //     additionalInfo = match[3].trim(); // Trim extra info
            //     timestamp = new Date(match[4]);

            //     console.log(timestamp);
    
            //     // Process additional info if available
            //     if (additionalInfo) {
            //         // Check if the additional info contains column numbers and symbols
            //         const correctionsPattern = /(\d+[\s\S]*?\(\d+\))/g;
            //         const correctionsMatch = additionalInfo.match(correctionsPattern);
    
            //         if (correctionsMatch) {
            //             const correctionsOutput = correctionsMatch.map((correction) => {
            //                 const [column, symbols] = correction.split(/\s+/);
            //                 return `Col ${column}: ${symbols}`;
            //             });
    
            //             additionalInfo = correctionsOutput.join(', ');
            //         }
            //    }
            // }

            // const pattern = /Discipline: ([^//]+) \/\/ Score: (\d+)([\s\S]+?) \/\/ Time:([\d.]+) \/\/ Timestamp: (.+)/;

            // const match = decryptedText.match(pattern);
            // console.log('Match:', match);
            // if (match) {
            //     decryptedScore = parseInt(match[2], 10); // Parse score as an integer
            //     additionalInfo = match[3].trim(); // Trim extra info
            //     timestamp = new Date(match[4]);
    
            //     // Process additional info if available
            //     if (additionalInfo) {
            //         // Check if the additional info contains column numbers and symbols
            //         const correctionsPattern = /(\d+[\s\S]*?\(\d+\))/g;
            //         const correctionsMatch = additionalInfo.match(correctionsPattern);
    
            //         if (correctionsMatch) {
            //             const correctionsOutput = correctionsMatch.map((correction, index) => {
            //                 const [column, symbols] = correction.split(/\s+/);
            //                 return `${index !== 0 ? '\n' : ''}Col ${column}: ${symbols}`;
            //             });
    
            //             additionalInfo = correctionsOutput.join(', ');
            //         }
            //     }
            // }
        } else {

            const pattern = /Discipline: ([^//]+) \/\/ Score: (\d+)(?:\r?\n)? \/\/ Time:([\d.]+) \/\/ Timestamp: (.+)/;

            const match = decryptedText.match(pattern);

            if (match) {

                decryptedScore = parseInt(match[2], 10); // Parse score as an integer
                time = disciplineName.includes("SC") ? match[3] : undefined;
                timestamp = new Date(match[4]);
            } else {
                // If string does not match pattern, alert the user that they need to check and try again
                alert("Code could not be processed. Please check and try again, or ask a competition official. Note: Your score has NOT been added.");
                return;
            }
        }
        //example    
        //U2FsdGVkX1+SH9v3jyQxf+sM6zabyDhf+lmboyeTo8DCEBZ9og1+y3Yum3PoVMgbIThCOPbBP9QC2FRusHNtgVtICGu/3QbDiRhJC62W/bOdV+N9Vxfsk2OlicGD3NyDHR78BWcVWhkP0pzzX150zfpDNxUcnvquC3AGQpZ1oTA=

        //example
        // U2FsdGVkX1+capKaSvir9g3hWyBepNV8ASaxFccx3hrx19zwWs3QccrkkgVQvU8cMdvlAG5pC7BrlwVdIpb2hdzYSmJKMOpl+Zst0uDXSKHcP09dHloT4DjvK1rVTJMvq6yDnHAssbSwEKyBmlAlMQ==


        //parse the decrypted text
        //         const pattern = /Discipline: ([^//]+) \/\/ Score: (\d+) \/\/ Timestamp: (.+)/;
        //   const pattern = /Discipline: ([^/]+) \/\/ Score: (\d+)(?:\r?\n)? \/\/(?: Time:([\s\S]+))? \/\/ Timestamp: (.+)/;

        //"Discipline: 10-Minute Cards // Score: 6
        // Time:0.00 // Timestamp: Tue, 23 Jan 2024 12:46:28 GMT"


        // Check if the timestamp is recent and alert user if not
        // const now = Date.now();
        // const timeDifference = now - timestamp.getTime();
        // const isRecent = timeDifference <= RECENT_MINUTES * 60 * 1000;


        const isRecent = (Date.now() - timestamp.getTime()) <= RECENT_MINUTES * 60 * 1000;

        if (!isRecent) {
            alert("This code was generated more than 20 minutes ago. Please see a competition official. Note: Your score has NOT been added.")
            return;
        }

        // Check if disciplineName can be matched to a discipline and if not, alert user
        if (findMatchingDiscipline(decryptedDisciplineName)) {
            saveScore(decryptedScore, decryptedDisciplineName, time, additionalInfo);
        } else {
            alert("There was an error processing your score (discipline name does not match). Please see a competition official. Note: Your score has NOT been added.")
        }

    }

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
                        url: `https://competition-results.onrender.com/competition/${id}`,
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
                            console.error('Error fetching competition data:', error);
                        });
                } else {
                    console.log('Failed to fetch user data');
                }
            } catch (error) {
                console.error('Error in useEffect:', error);
            }
        };
        fetchData();
    }, [user, token]); // The empty dependency array ensures the effect runs only once on mount


    return (
        <>
            <div>
                <h1 className="text-center">{competitionData.name}</h1>
                {!showMessage &&
                    <>
                        <h2 className="text-center">Adding score for {userData.firstName} {userData.lastName}</h2>

                        <form className="maintext niceForm">
                            <label>Paste your code here:</label>
                            <input size={50} type="text" value={code} onChange={(e) => setCode(e.target.value)}></input>
                            <Button onClick={handleSubmitScore}>Submit score</Button>
                        </form>
                    </>
                }

                {showMessage !== '' && (
                    <>
                        <div className="maintext">
                            Thank you! You've submitted a score of <strong>{score}</strong> for{' '}
                            <strong>{disciplineName}</strong>. If you believe this score is incorrect,
                            please keep your result on screen and see a competition official.
                            <p className="highlightText">
                                <Link to={`/competition_results/${id}`}>Back to results page >>></Link>
                            </p>

                        </div>

                    </>
                )}
            </div>


        </>

    );
}

export default CompetitionAddScore;