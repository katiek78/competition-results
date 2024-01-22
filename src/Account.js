import React, { useEffect, useState } from "react";
import { useUser } from './UserProvider';
import { Container, Col, Row, Button } from "react-bootstrap";
import Register from "./Register";
import Login from "./Login";
import axios from "axios";
import Cookies from "universal-cookie";
import NameForm from "./NameForm";
import EmailForm from "./EmailForm";

const cookies = new Cookies();

export default function Account() {
    const { user } = useUser();
    const [showNameInputs, setShowNameInputs] = useState(false);
    const [showEmailInput, setShowEmailInput] = useState(false);

    const [userData, setUserData] = useState({});
    const token = cookies.get("TOKEN");

useEffect(() => {
    if (user && user.userId) {
        const configuration = {
                        method: "get",
                        url: `https://competition-results.onrender.com/user/${user.userId}`,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    };

      // Use the user ID to fetch additional user data
      axios(configuration)
            .then((result) => {
          // Update the user context with the complete user data
        //   updateUser(result.data);
      
            setUserData(result.data)
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
        });
    }
  }, [user, token]);

  const handleSubmitName = (firstName, lastName) => {
    setShowNameInputs(false);
    saveUser({firstName, lastName});
  }

  const handleSubmitEmail = (email) => {
    setShowEmailInput(false);
    saveUser({email});
  }

  const saveUser = async (changes) => {    
        try {
            const updatedUser = {
                ...userData,
                ...changes
              };
          
            // set configurations
            const configuration = {
                method: "put",
                url: `https://competition-results.onrender.com/user/${user.userId}`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                data: updatedUser
            };
            const response = await axios(configuration);
            console.log('User updated:', response.data);
            setUserData({
                ...userData,
                ...changes
              });
           
        } catch (error) {
            console.error('Error updating user:', error);
        }
    
  }

  return (
    <>
      {token ? (
        <Container>
          <Row>
            <h1>My account</h1>
            <div className="maintext">
         
                {!showNameInputs && <>Name: {userData.firstName || ''} {userData.lastName || ''}<Button onClick={() => setShowNameInputs(true)}>Edit</Button></> }
                {showNameInputs && <><NameForm onSubmitName={handleSubmitName} form={{'firstName': userData.firstName, 'lastName': userData.lastName }} /></>}
           
           <br />
           {!showEmailInput && <>Email: {userData.email || ''}<Button onClick={() => setShowEmailInput(true)}>Edit</Button></> }
                {showEmailInput && <><EmailForm onSubmitEmail={handleSubmitEmail} form={{'email': userData.email }} /></>}
           
          
            </div>
          </Row>

          <Row>
            <h1>My competitions</h1>
          </Row>
        </Container>
      ) : (
        <Container>
          <Row>
            <Col xs={12} sm={12} md={6} lg={6}>
              <Register />
            </Col>
            <Col xs={12} sm={12} md={6} lg={6}>
              <Login />
            </Col>
          </Row>
        </Container>
      )}
    </>
  )
}
