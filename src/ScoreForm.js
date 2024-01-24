import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { disciplines, getDisciplineNameFromRef } from './constants';
import axios from 'axios';
import Cookies from "universal-cookie";

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const ScoreForm = ({ onSubmitScore, form, editing, competitionId }) => {

    const [score, setScore] = useState(editing ? form.score : 0);
    const [time, setTime] = useState(editing ? form.time : 0);
    const [discipline, setDiscipline] = useState(editing ? form.discipline : disciplines[0].ref);
    const [user, setUser] = useState(editing ? form.user : '');
    const [users, setUsers] = useState([]);
    const [competitionData, setCompetitionData] = useState({});

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
            })
            .catch((error) => {
                error = new Error();
                console.log(error);
            });
    }, [])

    useEffect(() => {
        if (editing) return;

        // set configurations
        const configuration = {
            method: "get",
            url: `https://competition-results.onrender.com/competition/${competitionId}`,
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


    const closeForm = () => {
        onSubmitScore(null, !editing);
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate form data (add more validation as needed)
        if (!score || !user || !discipline) {
            alert('Please fill in all fields.');
            return;
        }

        // Create a result object with the form data
        const result = {
            score,
            time,
            discipline,
            user
        };

        // Call the callback to add the result
        onSubmitScore(result, !editing);

        // Clear the form fields
        setScore('');
        setTime('');
        setDiscipline('');
        setUser('');
    }

    return (
        <form className="maintext" onSubmit={handleSubmit}>
            {competitionData?.compUsers && !editing &&
                <>
                    <label>
                        User:
                    </label>
                    <select value={user} onChange={(e) => setUser(e.target.value)}>
                        <option value="" disabled>Select a competitor</option>
                        {competitionData && users?.filter((usr) => competitionData.compUsers.indexOf(usr._id) > -1).map((usr) => <option key={usr._id} value={usr._id}>{usr.firstName} {usr.lastName}</option>)}

                    </select>
                </>
            }
            {editing &&
                <label>
                    User: {(() => {
                        const foundUser = users.find((usr) => usr._id === user);
                        return foundUser ? `${foundUser.firstName} ${foundUser.lastName}` : 'Unknown User';
                    })()}</label>

            }
            <br />
            {!editing &&
            <>
            <label>
                Discipline:
            </label><select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                {competitionData.disciplines && disciplines.filter((d) => competitionData.disciplines.includes(d.ref)).map((d) => <option key={d.ref} value={d.ref}>{d.label}</option>)}
            </select>
            </>
            }
            {editing &&
                <label>
                    Discipline: {getDisciplineNameFromRef(discipline)}</label>

            }
            <br />
            <label>
                Score:
            </label><input type="text" value={score} onChange={(e) => setScore(e.target.value)} /><br />
            {discipline === 'SC' &&
                <><label>
                    Time:
                </label><input type="text" value={time} onChange={(e) => setTime(e.target.value)} />
                </>}
            <br />
            <Button type="submit">{editing ? 'Save' : 'Add'} Score</Button>
            <Button onClick={closeForm}>Close</Button>

        </form>
    );
};

export default ScoreForm;
