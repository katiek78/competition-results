// CompetitionForm.js

import React, { useState } from 'react';

const CompetitionForm = ({ onSubmitCompetition, form, editing }) => {
    console.log(form)

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
    };

    console.log(competition);
    // Call the onAddCompetition callback to add the competition
    onSubmitCompetition(competition);

    // Clear the form fields
    setName('');
    setDateStart(formatDate(new Date()));
    setDateEnd(formatDate(new Date()));
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name:
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <br />
      <label>
        Date Start:
        <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
      </label>
      <br />
      <label>
        Date End:
        <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
      </label>
      <br />
      <button type="submit">Add Competition</button>
    </form>
  );
};

export default CompetitionForm;
