import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
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

    const RECENT_MINUTES = 20;

    function decryptMessage(msg) {
        var key = "123";
      
        // Decrypt the message
        var bytes = CryptoJS.AES.decrypt(msg, key);
        var decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
      
        // Replace special characters if needed
        decryptedMessage = decryptedMessage.replace(/#/g, "\n").replace(/\*/g, "\t");
      
        return decryptedMessage;
      }

    function findMatchingDiscipline(disciplineName) {
    // Find the discipline in the array based on label
    return disciplines.find(discipline => discipline.label === disciplineName);
    }

    function isDuplicateResult(compResults, compUser, discipline) {
        return compResults.some(result => result.compUser === compUser && result.discipline === discipline);
      }

    const saveScore = (score, disciplineName) => {
      
        const disciplineRef = getDisciplineRefFromName(disciplineName);
    
        if (disciplineRef === 'Unknown Discipline') {
            alert("There was an error processing your score (discipline name does not match). Please see a competition official. Note: Your score has NOT been added");
            return;
        }
        
        const newResult = {compUser: user.userId, discipline: getDisciplineRefFromName(disciplineName), rawScore: score };

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
            const response = axios(configuration);
            console.log('Score added:', response.data);
            setCompetitionData({ ...competitionData, compResults: updatedCompetition.compResults, });
            alert("Score added")
           
        } catch (error) {
            console.error('Error adding result:', error);
            alert("Your score could not be added. Please try submitting again, or see a competition official.")
        }        
    }

    const handleSubmitScore = () => {        
        //example    
        //U2FsdGVkX1+SH9v3jyQxf+sM6zabyDhf+lmboyeTo8DCEBZ9og1+y3Yum3PoVMgbIThCOPbBP9QC2FRusHNtgVtICGu/3QbDiRhJC62W/bOdV+N9Vxfsk2OlicGD3NyDHR78BWcVWhkP0pzzX150zfpDNxUcnvquC3AGQpZ1oTA=
        
        //example
        // U2FsdGVkX1+capKaSvir9g3hWyBepNV8ASaxFccx3hrx19zwWs3QccrkkgVQvU8cMdvlAG5pC7BrlwVdIpb2hdzYSmJKMOpl+Zst0uDXSKHcP09dHloT4DjvK1rVTJMvq6yDnHAssbSwEKyBmlAlMQ==
        
        const decryptedText = decryptMessage(code);
        alert(decryptedText)

         //parse the decrypted text
         const pattern = /Discipline: ([^//]+) \/\/ Score: (\d+) \/\/ Timestamp: (.+)/;
         const match = decryptedText.match(pattern);

        if (match) {
            const disciplineName = match[1];
            const score = parseInt(match[2], 10); // Parse score as an integer
            const timestamp = new Date(match[3]);
        
            // Check if the timestamp is within the last 20 minutes and alert user if not
            const isRecent = (Date.now() - timestamp.getTime()) <= RECENT_MINUTES * 60 * 1000;
        
            if (!isRecent) {
                alert("This code was generated more than 20 minutes ago. Please see a competition official. Note: Your score has NOT been added.")
                return;
            } 

            // Check if disciplineName can be matched to a discipline and if not, alert user
            if (findMatchingDiscipline(disciplineName)) {
                saveScore(score, disciplineName);
            } else {
                alert("There was an error processing your score (discipline name does not match). Please see a competition official. Note: Your score has NOT been added.")
            }
        } else {
            // If string does not match pattern, alert the user that they need to check and try again
        alert("Code could not be processed. Please check and try again, or ask a competition official. Note: Your score has NOT been added.");
        return;
        }


        //if the string makes sense, determine if it can be assigned to an event
        //if it can be assigned, save it to the results

        //if it cannot be assigned, save it to a list of dubiousResults for admins to deal with and assign
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
            <h2 className="text-center">Adding score for {userData.firstName} {userData.lastName}</h2>

<form className="maintext niceForm">
    <label>Paste your code here:</label>
    <input size={50} type="text" value={code} onChange={(e) => setCode(e.target.value)}></input>
    <Button onClick={handleSubmitScore}>Submit score</Button>
</form>
            </div>
                
               
            </>

    );
}

export default CompetitionAddScore;