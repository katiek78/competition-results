import React, { useEffect, useState } from "react";
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Button } from "react-bootstrap";
import axios from "axios";
import Cookies from "universal-cookie";
import CompetitionForm from './CompetitionForm';
import ParticipantsForm from "./ParticipantsForm";
import { formatNames, nationalEvents, internationalEvents, worldEvents, getDisciplineNameFromRef } from "./constants"

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const CompetitionDetail = () => {
    const { id } = useParams();
    const [competitionData, setCompetitionData] = useState({});
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showParticipantForm, setShowParticipantForm] = useState(false);

    // Helper function to format date as 'YYYY-MM-DD'
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const handleEditCompetition = (modifiedCompetition) => {
        // Edit the competition
        setCompetitionData(modifiedCompetition);
        saveCompetition(modifiedCompetition);
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
                url: `https://competition-results.onrender.com/competition/${id}`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                data: updatedCompetition
            };
            const response = await axios(configuration);
            console.log('Participant added:', response.data);
            setCompetitionData({...competitionData, compUsers: updatedCompetition.compUsers,});
            setShowParticipantForm(false);
        } catch (error) {
            console.error('Error adding participant:', error);
        }
        
    }

    const saveCompetition = async (competition) => {
        //work out if we need to change disciplines
        if (competition.format !== competitionData.format) {
            if (competition.format === 'n') {
                console.log(nationalEvents)
                competition.disciplines = [...nationalEvents];
            } else if (competition.format === 'i') {
                competition.disciplines = [...internationalEvents];
            } else competition.disciplines = [...worldEvents];  
        }
        try {
            // set configurations
            const configuration = {
                method: "put",
                url: `https://competition-results.onrender.com/competition/${id}`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                data: competition
            };
            const response = await axios(configuration);
            console.log('Competition saved:', response.data);
        } catch (error) {
            console.error('Error saving competition:', error);
        }
    };


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
            console.log(result);
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
            <h1 className="text-center">Competition setup: {competitionData.name}</h1>
            <h2 className="text-center">{formatDate(new Date(competitionData.dateStart))} - {formatDate(new Date(competitionData.dateEnd))}</h2>
            <h2 className="text-center">Format: {formatNames[competitionData.format] || 'not specified'}</h2>

            <Button onClick={() => setShowForm(true)}>Edit competition details</Button>

            {showForm && (
                <CompetitionForm onSubmitCompetition={handleEditCompetition} form={{ compName: competitionData.name, dateStart: competitionData.dateStart, dateEnd: competitionData.dateEnd }} editing={true} />
            )}

            <div>
                <p class="maintext">
                <Link to={`/competition_results/${competitionData._id}`}>View Results >>></Link>
                </p>

                <Container>
                    <Row>
                        <Col>
                <h2>Registered participants: ({competitionData.compUsers?.length || 0})</h2>
                <Button onClick={() => setShowParticipantForm(true)}>New participant</Button>

                {showParticipantForm && (
                    <ParticipantsForm onSubmitParticipant={saveParticipant} />
                )}
                {competitionData.compUsers?.map((userId) => {
                // Find the user with the matching ID in the users array
                const user = users.find((user) => user._id === userId);
                
                // Display the user's email
                return (
                    <p key={userId}>{user?.email}</p>
                );
                })}
                </Col>
                
                <Col>
                <h2>Disciplines:</h2>
                {competitionData.disciplines?.map((discipline) => {
                
                // Display the user's email
                return (
                    <p key={discipline}>{getDisciplineNameFromRef(discipline)}</p>
                );
                })}
                </Col>
               
                </Row>         
                </Container>
            </div>

        </div>


    );
}

export default CompetitionDetail;