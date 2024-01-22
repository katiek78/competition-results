// CompetitionForm.js

import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

const CompetitionForm = ({ onSubmitCompetition, form, editing }) => {

    // Helper function to format date as 'YYYY-MM-DD'
    const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [name, setName] = useState(editing ? form.compName : '');
  const [dateStart, setDateStart] = useState(editing ? formatDate(new Date(form.dateStart)) : formatDate(new Date()));
  const [dateEnd, setDateEnd] = useState(editing ? formatDate(new Date(form.dateEnd)) : formatDate(new Date()));
  const [format, setFormat] = useState(editing ? form.format || 'n' : 'n');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form data (add more validation as needed)
    if (!name || !dateStart || !dateEnd) {
      alert('Please fill in all fields.');
      return;
    }


    // Create a competition object with the form data
    const competition = {
    name,
    dateStart,
    dateEnd,
    format
    };

    // Call the onAddCompetition callback to add the competition
    onSubmitCompetition(competition);

    // Clear the form fields
    setName('');
    setDateStart(formatDate(new Date()));
    setDateEnd(formatDate(new Date()));
    setFormat('');
  }

  return (
    <form className="maintext" onSubmit={handleSubmit}>
      <label>
        Name: 
      </label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
     
      <br />
      <label>
        Date Start:
        </label>
        <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
   
      <br />
      <label>
        Date End:
        </label>
        <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
      
      <br />
      <label>
        Format:
        </label>
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="n">National format</option>
            <option value="i">International format</option>
            <option value="w">World championship format</option>
        </select>
      
      <br />
      <Button type="submit">{editing ? 'Save' : 'Add'} Competition</Button>
    </form>
  );
};

export default CompetitionForm;
