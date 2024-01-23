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

const Competitions = () => {
    const { user } = useUser();

    const [users, setUsers] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        console.log('User in Account:', user);
      }, [user]);


    const handleAddCompetition = (newCompetition) => {
        // Add the new competition to the state
        setCompetitions([...competitions, newCompetition]);
        saveCompetition(newCompetition);
        setShowForm(false);
      };

    const saveCompetition = async (competition) => {
        console.log(competition.format)
        //add disciplines
        if (competition.format === 'n') {
            console.log(nationalEvents)
            competition.disciplines = [...nationalEvents];
        } else if (competition.format === 'i') {
            competition.disciplines = [...internationalEvents];
        } else competition.disciplines = [...worldEvents];  

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

      <Button onClick={() => setShowForm(true)}>Add Competition</Button>

{showForm && (
  <CompetitionForm onSubmitCompetition={handleAddCompetition} editing={false} />
)}

        <table className="niceTable competitionTable">
  <thead>
    <tr>
      <th>Name</th>
      <th>Dates</th>    
    </tr>
  </thead>
  <tbody>
  {competitions
        .sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart))
        .map((competition) => (
          <tr key={competition._id}>          
            <td><Link to={`/competition/${competition._id}`}>{competition.name}</Link></td>
            <td>{`${formatDate(new Date(competition.dateStart))} - ${formatDate(new Date(competition.dateEnd))}`}</td>
          </tr>
        ))
        }
        </tbody>
        </table>

    </div>

    
  );
}

export default Competitions;