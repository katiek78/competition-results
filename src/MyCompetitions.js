    import React, { useEffect, useState } from "react";
    import { Link } from 'react-router-dom';
    import { useUser } from './UserProvider';
    import axios from "axios";
    import Cookies from "universal-cookie";


    const cookies = new Cookies();

    const token = cookies.get("TOKEN");

    const MyCompetitions = () => {
        const { user } = useUser();

        const [competitions, setCompetitions] = useState([]);
        const [adminCompetitions, setAdminCompetitions] = useState([]);

        useEffect(() => {
        
        if (!user) return;

            // set configurations
            const configuration = {
                method: "get",
                url: `https://competition-results.onrender.com/user/${user.userId}/competitions/`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            // make the API call
            axios(configuration)
            .then((result) => {     
            
                setCompetitions(result.data);
                
                //get logged-in user details
                // console.log(result.data.userId);
                // console.log(result.data.userEmail);
            })
            .catch((error) => {
            error = new Error();
            console.log(error);
            });

            // set configurations
            const adminConfiguration = {
                method: "get",
                url: `https://competition-results.onrender.com/user/${user.userId}/adminCompetitions/`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            // make the API call
            axios(adminConfiguration)
            .then((result) => {          
                setAdminCompetitions(result.data);
            })
            .catch((error) => {
            error = new Error();
            console.log(error);
            });
        }, [user])
    
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
    return (
        <div>
        <h1 className="text-center">My Competitions</h1>

        <table className="niceTable competitionTable">
    <thead>
        <tr>
        <th>Name</th>
        <th>Dates</th>    
        </tr>
    </thead>
    <tbody>
    {adminCompetitions && adminCompetitions
            .sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart))
            .map((competition) => (
            <tr key={competition._id}>          
                <td><Link to={`/competition/${competition._id}`}>{competition.name} (ADMIN)</Link></td>
                <td>{`${formatDate(new Date(competition.dateStart))} - ${formatDate(new Date(competition.dateEnd))}`}</td>
            </tr>
            ))
            }

            {competitions && competitions
            .sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart))
            .map((competition) => (
            <tr key={competition._id}>          
                <td><Link to={`/competition_results/${competition._id}`}>{competition.name}</Link></td>
                <td>{`${formatDate(new Date(competition.dateStart))} - ${formatDate(new Date(competition.dateEnd))}`}</td>
            </tr>
            ))
            }

            </tbody>
            </table>


            
        </div>

        
    );
    }

    export default MyCompetitions;