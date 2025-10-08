// CompetitionForm.js

import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { generateCompId } from "./competitionIdUtils";

const CompetitionForm = ({ onSubmitCompetition, form, editing }) => {
  // Helper function to format date as 'YYYY-MM-DD'
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [name, setName] = useState(editing ? form.compName : "");
  const [dateStart, setDateStart] = useState(
    editing ? formatDate(new Date(form.dateStart)) : formatDate(new Date())
  );
  const [dateEnd, setDateEnd] = useState(
    editing ? formatDate(new Date(form.dateEnd)) : formatDate(new Date())
  );
  const [format, setFormat] = useState(editing ? form.format || "n" : "n");
  const [compId, setCompId] = useState(
    editing ? form.comp_id || generateCompId(form.compName, form.dateStart) : ""
  );
  const [location, setLocation] = useState(editing ? form.location || "" : "");
  const [rankable, setRankable] = useState(
    editing ? form.rankable || false : false
  );
  const [adultRankable, setAdultRankable] = useState(
    editing ? form.adult_rankable || false : false
  );
  const [country, setCountry] = useState(editing ? form.country || "" : "");
  const [championshipType, setChampionshipType] = useState(
    editing ? form.championship_type || "Adult" : "Adult"
  );
  const [championshipStatus, setChampionshipStatus] = useState(
    editing ? form.championship_status || "None" : "None"
  );

  // Auto-generate comp_id when name or dateStart changes
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    setCompId(generateCompId(newName, dateStart));
  };

  const handleDateStartChange = (e) => {
    const newDateStart = e.target.value;
    setDateStart(newDateStart);
    setCompId(generateCompId(name, newDateStart));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form data (add more validation as needed)
    if (!name || !dateStart || !dateEnd) {
      alert("Please fill in all fields.");
      return;
    }

    // Create a competition object with the form data
    const competition = {
      name,
      dateStart,
      dateEnd,
      format,
      comp_id: compId,
      location,
      rankable,
      adult_rankable: adultRankable,
      country,
      championship_type: championshipType,
      championship_status: championshipStatus,
    };

    // Call the onAddCompetition callback to add the competition
    onSubmitCompetition(competition);

    // Clear the form fields
    setName("");
    setDateStart(formatDate(new Date()));
    setDateEnd(formatDate(new Date()));
    setFormat("");
    setCompId("");
    setLocation("");
    setRankable(false);
    setAdultRankable(false);
    setCountry("");
    setChampionshipType("Adult");
    setChampionshipStatus("None");
  };

  return (
    <form className="maintext" onSubmit={handleSubmit}>
      <label style={{ display: "inline-block", width: "160px" }}>Name:</label>
      <input type="text" value={name} onChange={handleNameChange} />

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>
        Date Start:
      </label>
      <input type="date" value={dateStart} onChange={handleDateStartChange} />

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>
        Date End:
      </label>
      <input
        type="date"
        value={dateEnd}
        onChange={(e) => setDateEnd(e.target.value)}
      />

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>
        Competition ID:
      </label>
      <input
        type="text"
        value={compId}
        onChange={(e) => setCompId(e.target.value)}
      />

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>
        Location:
      </label>
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="e.g., London"
      />

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>
        Rankable:
      </label>
      <input
        type="checkbox"
        checked={rankable}
        onChange={(e) => setRankable(e.target.checked)}
        style={{
          transform: "scale(2.5)",
          verticalAlign: "middle",
        }}
      />

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>
        Rankable for Adults:
      </label>
      <input
        type="checkbox"
        checked={adultRankable}
        onChange={(e) => setAdultRankable(e.target.checked)}
        style={{
          transform: "scale(2.5)",
          verticalAlign: "middle",
        }}
      />

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>
        Country:
      </label>
      <input
        type="text"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        placeholder="e.g., United Kingdom"
      />

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>
        Championship Type:
      </label>
      <select
        value={championshipType}
        onChange={(e) => setChampionshipType(e.target.value)}
      >
        <option value="Adult">Adult</option>
        <option value="Junior">Junior</option>
        <option value="Kids">Kids</option>
      </select>

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>
        Championship Status:
      </label>
      <select
        value={championshipStatus}
        onChange={(e) => setChampionshipStatus(e.target.value)}
      >
        <option value="None">None</option>
        <option value="Country">Country</option>
        <option value="International">International</option>
        <option value="World">World</option>
      </select>

      <br />
      <label style={{ display: "inline-block", width: "160px" }}>Format:</label>
      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="n">National format</option>
        <option value="i">International format</option>
        <option value="w">World championship format</option>
      </select>

      <br />
      <Button type="submit">{editing ? "Save" : "Add"} Competition</Button>
    </form>
  );
};

export default CompetitionForm;
