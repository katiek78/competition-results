import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';

const PasswordForm = ({ onSubmitPassword }) => {

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
   

const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmMessage('');

    //check that new password has been entered the same both times
    if (newPassword !== confirmPassword) {
        setConfirmMessage('Passwords must match.');
        return;
    }
    
    onSubmitPassword(oldPassword, newPassword);
}

  return (
    <form className="niceForm vertical" onSubmit={handleSubmit}>
        <div>
      <label>
        Old password:
        </label>
        <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div>
        <label>
        New password:
        </label>
        
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
        <label>
        Confirm password:
        </label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <br />  
        <span className="text-danger">{confirmMessage}</span>
        </div>
      <Button type="submit">Submit</Button>
    </form>
  );
};

export default PasswordForm;
