import React, { useEffect, useState } from "react";
import { useParams, Link } from 'react-router-dom';
import { useUser } from "./UserProvider";
import axios from "axios";
import Cookies from "universal-cookie";
import { getDisciplineNameFromRef } from "./constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import ScoreForm from "./ScoreForm";

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const CompetitionResults = () => {
    const { id } = useParams();
    const { user } = useUser();
    const [competitionData, setCompetitionData] = useState({});
    const [users, setUsers] = useState([]);
    const [selectedDiscipline, setSelectedDiscipline] = useState('');
    const [showScoreForm, setShowScoreForm] = useState(false);
    const [showEditScoreForm, setShowEditScoreForm] = useState(false);
    const [editFormValues, setEditFormValues] = useState('');
    
    // Helper function to format date as 'YYYY-MM-DD'
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const getResultFromId = (resultId) => {
        return competitionData.compResults.find(el => el._id === resultId);
    }

    const getNumberOfResultsForSelectedDiscipline = () => competitionData.compResults.filter(r => r.discipline === selectedDiscipline).length;

    const showCompUsersNotSubmitted = () => {
        const notSubmittedList = competitionData.compUsers
          .filter(cuId => !competitionData.compResults.find(r => r.discipline === selectedDiscipline && r.user === cuId))
          .map(cuId => {
            const user = users.find(u => u._id === cuId);
            return `${user.firstName} ${user.lastName}`;
          })
          .join("\n");
      
        alert(notSubmittedList);
      };

    function isDuplicateResult(compResults, compUser, discipline) {
        return compResults.some(result => result.compUser === compUser && result.discipline === discipline);
      }
    
    const handleEditScore = (resultId) => {
        const result = getResultFromId(resultId);
        console.log(result)
        setEditFormValues({score: result.rawScore, time: result.time, discipline: result.discipline, user: result.compUser})
        setShowEditScoreForm(true);
    };

    const handleSubmitScore = (result, newScore) => {
        if (!result) {
            if (newScore) {
                setShowScoreForm(false);
            } else setShowEditScoreForm(false);
            return;
        }
        const { score, time, discipline, user } = result;
        //check for duplicate result and alert
        if (newScore && isDuplicateResult(competitionData.compResults, user, discipline)) {
            alert("User already has a score for this discipline. Please find the score in the results and edit it from there.");
            return;
        }

        const rawScore = parseFloat(score);
        if (isNaN(rawScore)) {
            alert("The score you entered could not be processed. Score must be a number.")
        } else saveScore(rawScore, time, user, discipline, newScore);

        if (newScore) {
            setShowScoreForm(false);
        } else setShowEditScoreForm(false);
    }

    const saveScore = (rawScore, time = 0, user, discipline, newScore) => {
                  
        const newResult = {compUser: user, discipline, rawScore, time };

        try {
            let updatedCompetition;
            
            if (newScore) {
                updatedCompetition = {
                // ...competitionData,
                compResults: competitionData.compResults
                    ? [...competitionData.compResults, newResult]
                    : [newResult],
                };
            } else {               
                const indexOfResultToUpdate = competitionData.compResults.findIndex(
                    (result) => result.compUser === editFormValues.user && result.discipline === editFormValues.discipline
                  );

                  if (indexOfResultToUpdate !== -1) {
                    // Create a new array with the updated result
                    const updatedResults = [
                      ...competitionData.compResults.slice(0, indexOfResultToUpdate),
                      newResult, // Place the updated result here
                      ...competitionData.compResults.slice(indexOfResultToUpdate + 1),
                    ];

                   updatedCompetition = {
                        ...competitionData,
                        compResults: updatedResults,
                      };
                }
            }

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
          
            setCompetitionData({ ...competitionData, compResults: updatedCompetition.compResults, });
            setShowScoreForm(false);
           
        } catch (error) {
            console.error('Error adding result:', error);
            alert("The score could not be added. Please try submitting again.")
        }        
    }


    useEffect(() => {
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
              
                //get logged-in user details
                // console.log(result.data.userId);
                // console.log(result.data.userEmail);
            })
            .catch((error) => {
                console.error('Error fetching competition data:', error);
            });
    }, [])

    useEffect(() => {
        // set configurations
        const configuration = {
            method: "get",
            url: "https://competition-results.onrender.com/users",
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
    }, [])


    return (
        <div>
            <h1 className="text-center">Competition results: {competitionData.name}</h1>
            <h2 className="text-center">{formatDate(new Date(competitionData.dateStart))} - {formatDate(new Date(competitionData.dateEnd))}</h2>

            <div>
                {competitionData.compAdmins && competitionData.compAdmins.indexOf(user.userId) > -1 &&
            <p className="highlightText">
                <Link to={`/competition/${competitionData._id}`}>View Setup >>></Link>
                </p>
                }

                {competitionData.compUsers && competitionData.compUsers.indexOf(user.userId) > -1 &&
            <p className="highlightText">
                <Link to={`/competition_add_score/${competitionData._id}`}>Add my score >>></Link>
                </p>
                }

                {competitionData.compAdmins && competitionData.compAdmins.indexOf(user.userId) > -1 &&
                <>
            <p className="highlightText">
                {/* <Link to={`/competition_add_user_score/${competitionData._id}/`}>Add score for a user >>></Link> */}
                <span onClick={() => setShowScoreForm(true)}>Add score for a user >>></span>
                </p>

                {showScoreForm &&
                <ScoreForm onSubmitScore={handleSubmitScore} />}

                {showEditScoreForm && editFormValues &&
                <ScoreForm onSubmitScore={handleSubmitScore} editing={true} form={editFormValues} />}
                </>
                }

                <span className={'disciplineHeading' + (selectedDiscipline ? '' : ' selected')} onClick={() => setSelectedDiscipline('')}>Overall</span>
                {competitionData.disciplines?.map((discipline) => 
                    <span 
                        key={discipline} 
                        className={`disciplineHeading ${selectedDiscipline === discipline ? 'selected' : ''}`}
                        onClick={() => setSelectedDiscipline(discipline)}>{getDisciplineNameFromRef(discipline)}
                    </span>
                )}

                <h2> {selectedDiscipline === '' ? "Overall standings" : getDisciplineNameFromRef(selectedDiscipline)}</h2>
                {selectedDiscipline &&
                <>
                <h3>Results received: {competitionData.compResults && getNumberOfResultsForSelectedDiscipline()}/{competitionData.compUsers && competitionData.compUsers.length}</h3>
                <h4 onClick={showCompUsersNotSubmitted}>Who hasn't submitted a result?</h4>
                </>
                }

                {selectedDiscipline !== '' &&
                <>
             
                <table className="niceTable">
  <thead>
    <tr>
      <th>Rank</th>
      <th>Competitor</th>
      <th>Score</th>
      {selectedDiscipline === 'SC' &&
      <th>Time</th>}
      <th></th>
    </tr>
  </thead>
  <tbody>
    {competitionData.compResults
      .filter((result) => result.discipline === selectedDiscipline)
      .sort((a, b) => b.rawScore - a.rawScore)
      .map((result, i) => {
        // Find the user with the matching ID in the users array
        const thisUser = users.find((u) => u._id === result.compUser);

        return (
          <tr key={result.compUser}>
            <td>{i + 1}</td>
            <td>{`${thisUser.firstName} ${thisUser.lastName}`}</td>
            <td>{result.rawScore}</td>
            {selectedDiscipline === 'SC' &&
      <td>{result.time}</td>}
            <td><FontAwesomeIcon className="menuIcon" icon={faEdit} onClick={() => handleEditScore(result._id)} /></td>
          </tr>
        );
      })}
  </tbody>
</table>
                </>
                }

                {selectedDiscipline === '' &&
                <>
                {competitionData.compUsers?.map((userId) => {
                // Find the user with the matching ID in the users array
                const thisUser = users.find((user) => user._id === userId);
                
                return (
                    <p key={userId}>{thisUser?.firstName} {thisUser?.lastName}</p>
                );
                })}
                </>
               }
                                
            
            </div>

        </div>


    );
}

export default CompetitionResults;