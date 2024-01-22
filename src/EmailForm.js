import React, {  useState } from 'react';
import { Button } from 'react-bootstrap';

const EmailForm = ({ onSubmitEmail, form }) => {

    const [email, setEmail] = useState(form.email || '');

const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitEmail(email);
}

  return (
    <form className="niceForm" onSubmit={handleSubmit}>
      <label>
        Email:
        </label>
        <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
     
      <Button type="submit">Submit</Button>
    </form>
  );
};

export default EmailForm;
