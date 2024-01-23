import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { Button } from "react-bootstrap";
import { useUser } from './UserProvider';
import axios from "axios";
import Cookies from "universal-cookie";
import CompetitionForm from './CompetitionForm';
import { nationalEvents, internationalEvents, worldEvents } from "./constants";

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

      {adminCompetitions && adminCompetitions
        .sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart))
        .map((competition) => (
          <div key={competition._id}>
            <Link to={`/competition/${competition._id}`}>{competition.name} (ADMIN)</Link>
            {/* - starts {formatDate(new Date(competition.dateStart))} */}
          </div>
        ))}

    {competitions && competitions
        .sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart))
        .map((competition) => (
          <div key={competition._id}>
            <Link to={`/competition_results/${competition._id}`}>{competition.name}</Link>
            {/* - starts {formatDate(new Date(competition.dateStart))} */}
          </div>
        ))}

        
    </div>

    
  );
}

export default MyCompetitions;