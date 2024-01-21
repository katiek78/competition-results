import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import axios from "axios";
import Cookies from "universal-cookie";
import CompetitionForm from './CompetitionForm';

const cookies = new Cookies();

const token = cookies.get("TOKEN");

const Competitions = () => {
    const [users, setUsers] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const handleAddCompetition = (newCompetition) => {
        // Add the new competition to the state
        setCompetitions([...competitions, newCompetition]);
        saveCompetition(newCompetition);
        setShowForm(false);
      };

    const saveCompetition = async (competition) => {
    try {
        // set configurations
        const configuration = {
            method: "post",
            url: "https://competition-results.onrender.com/competitions",
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
            url: "https://competition-results.onrender.com/competitions",
            headers: {
                Authorization: `Bearer ${token}`,
              },
        };
        // make the API call
        axios(configuration)
        .then((result) => {          
            setCompetitions(result.data.competitions);
            
            //get logged-in user details
            // console.log(result.data.userId);
            // console.log(result.data.userEmail);
        })
        .catch((error) => {
        error = new Error();
        console.log(error);
        });
    }, [])
  
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
    
  return (
    <div>
      <h1 className="text-center">Competitions</h1>

      <button onClick={() => setShowForm(true)}>Add Competition</button>

{showForm && (
  <CompetitionForm onSubmitCompetition={handleAddCompetition} editing={false} />
)}

    {competitions
        .sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart))
        .map((competition) => (
          <div key={competition._id}>
            <Link to={`/competition/${competition._id}`}>{competition.name}</Link>
            {/* - starts {formatDate(new Date(competition.dateStart))} */}
          </div>
        ))}

        
    </div>

    
  );
}

export default Competitions;