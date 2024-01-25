import React, { useEffect, useState } from "react";
import { useParams, Link } from 'react-router-dom';
import { useUser } from "./UserProvider";
import axios from "axios";
import Cookies from "universal-cookie";
import { getDisciplineNameFromRef, getDisciplineStandardFromRef } from "./constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import ScoreForm from "./ScoreForm";
import { fetchCurrentUserData } from "./utils";

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const CompetitionResults = () => {
    const { id } = useParams();
    const { user } = useUser();
    const [competitionData, setCompetitionData] = useState({});
    const [users, setUsers] = useState([]);
    const [userData, setUserData] = useState({});
    const [selectedDiscipline, setSelectedDiscipline] = useState('');
    const [standard, setStandard] = useState(1);
    const [showScoreForm, setShowScoreForm] = useState(false);
    const [showEditScoreForm, setShowEditScoreForm] = useState(false);
    const [editFormValues, setEditFormValues] = useState('');
    const [compUserTotals, setCompUserTotals] = useState([]);
    
    // Helper function to format date as 'YYYY-MM-DD'
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const getResult = (user, discipline) => {
        return competitionData.compResults.find(el => el.compUser === user && el.discipline === discipline);
    }

    // const getNumberOfResultsForDiscipline = (d) => competitionData.compResults.filter(r => r.discipline === d).length;

    const getNumberOfResultsForDiscipline = (d) => {
        const results = competitionData.compResults.filter(r => r.discipline === d);      
        return results.length;
      };
      

    const showCompUsersNotSubmitted = () => {
        const notSubmittedList = competitionData.compUsers
          .filter(cuId => !competitionData.compResults.find(r => r.discipline === selectedDiscipline && r.compUser === cuId))
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
    
    const handleEditScore = (user, discipline) => {
        const result = getResult(user, discipline);      
        setEditFormValues({score: result.rawScore, time: result.time, discipline: result.discipline, user: result.compUser})
        setShowEditScoreForm(true);
    };

    const handleDeleteScore = (user, discipline) => {
        if (window.confirm("Are you sure you wish to delete this result?")) {   
            const resultIndex = competitionData.compResults.findIndex(
                (result) => result.compUser === user && result.discipline === discipline
              );
            deleteResult(resultIndex)
        }
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

    const isAdmin = () => ((competitionData.compAdmins && competitionData.compAdmins.indexOf(user.userId) > -1) || userData.role === 'superAdmin');

    const updateCompetitorTotals = () => {
        if (!competitionData.compUsers) return;
      
        const updatedCompUserTotals = competitionData.compUsers.map((competitor) => {
          // Calculate the total points for this competitor
          let totalPoints = 0;
      
          // Track the highest score for disciplines "5N", "SC", or "K"
          const highestScores = {};
      
          competitionData.compResults
            .filter((result) => result.compUser === competitor)
            .forEach((result) => {
              const { discipline, rawScore, time } = result;
      
              // Update highest score for "5N", "SC", or "K"
              if (discipline.includes("5N") || discipline.includes("SC") || discipline.includes("K")) {
                const disciplineKey = discipline.replace(/\d+$/, ''); // Remove the digits at the end
                if (!highestScores[disciplineKey] || rawScore > highestScores[disciplineKey].rawScore) {
                  highestScores[disciplineKey] = { rawScore, time, discipline };
                } else if (rawScore === highestScores[disciplineKey].rawScore && discipline.includes("SC") && time < highestScores[disciplineKey].time) {
                  highestScores[disciplineKey] = { rawScore, time, discipline };
                }
              } else {
                // Add points for other disciplines directly
                const points = getChampPoints(discipline, rawScore, time);
                totalPoints += parseFloat(points);
              }
            });
      
          // Add the highest scores for "5N", "SC", or "K" to the total points
          Object.values(highestScores).forEach(({ rawScore, time, discipline }) => {
            const points = getChampPoints(discipline, rawScore, time);
            totalPoints += parseFloat(points);
          });
      
          return {
            userId: competitor,
            total: Math.ceil(totalPoints),
          };
        });
      
        // You might want to set the updated compUserTotals using the appropriate state updater function
        setCompUserTotals(updatedCompUserTotals);
      };
      
    const isDisciplineComplete = (d) => competitionData?.compUsers.length > 0 && getNumberOfResultsForDiscipline(d) === competitionData?.compUsers.length;

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
        return getNumberOfCompleteDisciplines() === competitionData?.disciplines?.length;
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

    const deleteResult = (indexToDelete) => {
        if (indexToDelete === 0 || indexToDelete >= competitionData.compResults.length) return;

        const updatedCompResults = [...competitionData.compResults];
        updatedCompResults.splice(indexToDelete, 1);
          
        try {
            const updatedCompetition = {
                ...competitionData,
                compResults: updatedCompResults
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
          
            setCompetitionData({ ...competitionData, compResults: updatedCompResults, });
           
        } catch (error) {
            console.error('Error deleting result:', error);
            alert("The score could not be deleted. Please try again.")
        }        
    }

    useEffect(() => {
       if (selectedDiscipline) setStandard(getDisciplineStandardFromRef(selectedDiscipline));
       updateCompetitorTotals();
    }, [selectedDiscipline, competitionData.compUsers]);


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
                        url: `https://competition-results.onrender.com/competition/${id}`,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    };
                    // make the API call
                    axios(configuration)
                        .then((result) => {
                            setCompetitionData(result.data);
                       
                            //only allow users who are in compAdmins, or superAdmins                          
                            if (result.data.compAdmins?.indexOf(fetchedData._id) === -1 && fetchedData.role !== "superAdmin" && fetchedData.role !== "admin") {
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
        <>
        {competitionData &&
        <div>
            <h1 className="text-center">Competition results: {competitionData.name}</h1>
            <h2 className="text-center">{competitionData.dateStart && formatDate(new Date(competitionData.dateStart))} - {competitionData.dateEnd && formatDate(new Date(competitionData.dateEnd))}</h2>

            <div className="highlightButtonsDiv">
                {isAdmin() &&
            <p className="highlightText">
                <Link to={`/competition/${competitionData._id}`}>View Setup >>></Link>
                </p>
                }

                {isAdmin() &&
            <p className="highlightText">
                <Link to={`/competition_add_score/${competitionData._id}`}>Add my score >>></Link>
                </p>
                }

                {isAdmin() &&
                <>
            <p className="highlightText">
                {/* <Link to={`/competition_add_user_score/${competitionData._id}/`}>Add score for a user >>></Link> */}
                <span onClick={() => setShowScoreForm(true)}>Add score for a user >>></span>
                </p>

                
                </>
                }
            </div>

            {showScoreForm &&
                <ScoreForm onSubmitScore={handleSubmitScore} competitionId={competitionData._id} />}

                {showEditScoreForm && editFormValues &&
                <ScoreForm onSubmitScore={handleSubmitScore} editing={true} form={editFormValues} />}

            <div className="disciplinesDiv">

                <span className={'disciplineHeading' + (selectedDiscipline ? '' : ' selected')} onClick={() => setSelectedDiscipline('')}>Overall</span>
                {competitionData.disciplines?.map((discipline) => 
                    <span 
                        key={discipline} 
                        className={`disciplineHeading ${selectedDiscipline === discipline ? 'selected' : ''}`}
                        onClick={() => setSelectedDiscipline(discipline)}>{getDisciplineNameFromRef(discipline)}
                    </span>
                )}

</div>
<div className="standingsDiv">
                <h2> {selectedDiscipline === '' ? "Overall standings" : getDisciplineNameFromRef(selectedDiscipline)}</h2>
                {selectedDiscipline === '' && (
                isCompetitionComplete() ? <h3 className="compComplete">Competition complete!</h3>
                : <h3>{getNumberOfCompleteDisciplines()} out of {competitionData.disciplines.length} disciplines complete</h3>)
                }


                {selectedDiscipline && (!isDisciplineComplete(selectedDiscipline)) && 
                <>
                <h3>Results received: {competitionData.compResults && getNumberOfResultsForDiscipline(selectedDiscipline)}/{competitionData.compUsers && competitionData.compUsers.length}</h3>
                <h4 className="asLink" onClick={showCompUsersNotSubmitted}>Who hasn't submitted a result?</h4>
                </>
                }

                {selectedDiscipline && (isDisciplineComplete(selectedDiscipline)) && 
                <>
                <h3 className="disciplineComplete">All results received - discipline complete</h3>
                </>
                }

                {selectedDiscipline !== '' &&
                <>
             
                <table className="niceTable resultsTable">
  <thead>
    <tr>
      <th>Rank</th>
      <th>Competitor</th>
      <th>Score</th>
      {selectedDiscipline.includes('SC') &&
      <th>Time</th>}
      <th>Championship Pts</th>
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
          <tr key={i}>
            <td>{i + 1}</td>
            <td>{`${thisUser.firstName} ${thisUser.lastName}`}</td>
            <td>{result.rawScore}</td>
            {selectedDiscipline.includes('SC') &&
      <td>{result.time}</td>}

      {!selectedDiscipline.includes('SC') && !selectedDiscipline.includes("K") &&
      <td className="champ-points">{(result.rawScore / standard * 1000).toFixed(2)}</td>
      }

      {selectedDiscipline.includes('SC') && selectedDiscipline.standard &&
      <td className="champ-points">{result.rawScore === 52 ? 
        (standard.part1 / Math.pow(result.time, standard.part2)).toFixed(2)
        : (result.rawScore / 52 * standard.part3).toFixed(2)
        }</td>
      }

      {selectedDiscipline.includes("K") &&
      <td className="champ-points">{(Math.sqrt(result.rawScore) * standard).toFixed(2)}</td>
      }
            <td><FontAwesomeIcon className="menuIcon" icon={faEdit} onClick={() => handleEditScore(result.compUser, result.discipline)} />  <FontAwesomeIcon className="menuIcon" icon={faTrash} onClick={() => handleDeleteScore(result.compUser, result.discipline)} /></td>
          </tr>
        );
      })}
  </tbody>
</table>
                </>
                }

                {selectedDiscipline === '' &&
                <>
                 
                <table className="niceTable resultsTable overallTable">
  <thead>
    <tr>
      <th>Rank</th>
      <th>Competitor</th>     
      <th>Championship Pts</th>      
    </tr>
  </thead>
  <tbody>
  {compUserTotals && compUserTotals
    .sort((a, b) => b.total - a.total)
    .map((competitor, i) => {
      // Find the user with the matching ID in the users array
      const thisUser = users.find((u) => u._id === competitor.userId) || {
        firstName: "Unknown",
        lastName: "Unknown"
      }

      return (
        <tr key={i}>
          <td>{i + 1}</td>
          <td>{`${thisUser.firstName} ${thisUser.lastName}`}</td>
          <td className="champ-points">{competitor.total}</td>
        </tr>
      );
     
    })}
</tbody>
</table>


                </>
               }
                                
            
            </div>

        </div>
}
        </>
    );
}

export default CompetitionResults;