import React, { useEffect, useState } from "react";
import { useUser } from './UserProvider';
import { Container, Col, Row, Button } from "react-bootstrap";
import Register from "./Register";
import Login from "./Login";
import axios from "axios";
import Cookies from "universal-cookie";
import NameForm from "./NameForm";
import EmailForm from "./EmailForm";
import { fetchCurrentUserData } from "./utils";

const cookies = new Cookies();

export default function Account() {

    const [showNameInputs, setShowNameInputs] = useState(false);
    const [showEmailInput, setShowEmailInput] = useState(false);
    const { user } = useUser();
    const [userData, setUserData] = useState({});
    const token = cookies.get("TOKEN");

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log(user.userId);
                const fetchedData = await fetchCurrentUserData(user.userId);
                console.log(fetchedData)
                if (fetchedData) {
                    // Do something with the userData
                    setUserData(fetchedData);
                } else {
                    console.log('Failed to fetch user data');
                }
            } catch (error) {
                console.error('Error in useEffect:', error);
            }
        };
        fetchData();
    }, [user, token]); // The empty dependency array ensures the effect runs only once on mount

    const handleSubmitName = (firstName, lastName) => {
        setShowNameInputs(false);
        saveUser({ firstName, lastName });
    }

    const handleSubmitEmail = (email) => {
        setShowEmailInput(false);
        saveUser({ email });
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

                            {!showNameInputs && <>Name: {userData.firstName || ''} {userData.lastName || ''}<Button onClick={() => setShowNameInputs(true)}>Edit</Button></>}
                            {showNameInputs && <><NameForm onSubmitName={handleSubmitName} form={{ 'firstName': userData.firstName, 'lastName': userData.lastName }} /></>}

                            <br />
                            {!showEmailInput && <>Email: {userData.email || ''}<Button onClick={() => setShowEmailInput(true)}>Edit</Button></>}
                            {showEmailInput && <><EmailForm onSubmitEmail={handleSubmitEmail} form={{ 'email': userData.email }} /></>}


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
