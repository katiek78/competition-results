import React, { useEffect, useState } from "react";
import { useParams, Link } from 'react-router-dom';
import { useUser } from "./UserProvider";
import axios from "axios";
import Cookies from "universal-cookie";
import { getDisciplineNameFromRef } from "./constants";

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const CompetitionResults = () => {
    const { id } = useParams();
    const { user } = useUser();
    const [competitionData, setCompetitionData] = useState({});
    const [users, setUsers] = useState([]);
    const [selectedDiscipline, setSelectedDiscipline] = useState('');
    
    // Helper function to format date as 'YYYY-MM-DD'
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
            <p class="highlightText">
                <Link to={`/competition/${competitionData._id}`}>View Setup >>></Link>
                </p>
                }

                {competitionData.compUsers && competitionData.compUsers.indexOf(user.userId) > -1 &&
            <p class="highlightText">
                <Link to={`/competition_add_score/${competitionData._id}`}>Add my score >>></Link>
                </p>
                }

                <h2> {selectedDiscipline === '' ? "Overall standings" : getDisciplineNameFromRef(selectedDiscipline)}</h2>
                <span className='disciplineHeading' onClick={() => setSelectedDiscipline('')}>Overall</span>
                {competitionData.disciplines?.map((discipline) => 
                    <span 
                        key={discipline} 
                        className={`disciplineHeading ${selectedDiscipline === discipline ? 'selected' : ''}`}
                        onClick={() => setSelectedDiscipline(discipline)}>{getDisciplineNameFromRef(discipline)}
                    </span>
                )}

                {selectedDiscipline !== '' &&
                <>
             
                <table className="niceTable">
  <thead>
    <tr>
      <th>Rank</th>
      <th>Competitor</th>
      <th>Score</th>
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
          </tr>
        );
      })}
  </tbody>
</table>

                {/* {competitionData.compResults
                    .filter((result) => result.discipline === selectedDiscipline)
                    .sort((a, b) => b.rawScore - a.rawScore)
                    .map((result) => {
                        // Find the user with the matching ID in the users array
                        const thisUser = users.find((u) => u._id === user.userId);
                
                        return (
                        <p>{thisUser.firstName} {thisUser.lastName}  {result.rawScore}</p>
                        )
                })} */}
                    
                     {/* {competitionData.compResults.sort((a, b) => b.rawScore - a.rawScore)
                    .map((result) => <p>{result.compUser} {result.rawScore} {result.discipline === selectedDiscipline && "match"}</p>)} */}
                </>
                }

                {selectedDiscipline === '' &&
                <>
                {competitionData.compUsers?.map((userId) => {
                // Find the user with the matching ID in the users array
                const thisUser = users.find((user) => user._id === userId);
                
                // Display the user's email
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