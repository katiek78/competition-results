import React, { useState } from "react";
import { Button } from "react-bootstrap";

const NameForm = ({ onSubmitName, form }) => {
  const [firstName, setFirstName] = useState(form.firstName || "");
  const [lastName, setLastName] = useState(form.lastName || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitName(firstName, lastName);
  };

  return (
    <form className="niceForm" onSubmit={handleSubmit}>
      <label>First name:</label>
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />

      <label>Last name:</label>
      <input
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />

      <Button type="submit">Submit</Button>
    </form>
  );
};

export default NameForm;
