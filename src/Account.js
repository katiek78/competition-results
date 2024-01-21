import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Col, Row, Button } from "react-bootstrap";
import Register from "./Register";
import Login from "./Login";
import axios from "axios";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default function Account() {
    const id = "skdlsdjf"
   // const id = userId; //how to get id of current user so I can then do a get, or should we just pass all user data
   // think just rewrite this whole thing so Account is an auth component and Register and Login are free ones (separate)
    const [userData, setUserData] = useState({});
    const token = cookies.get("TOKEN");

    useEffect(() => {
        // set configurations        
        const configuration = {
            method: "get",
            url: `https://competition-results.onrender.com/user/${id}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        // make the API call
        axios(configuration)
            .then((result) => {
console.log(result.data)
                setUserData(result.data);
                
                //get logged-in user details
                // console.log(result.data.userId);
                // console.log(result.data.userEmail);
            })
            .catch((error) => {
                console.error('Error fetching user data:', error);
            });
    }, [])

  return (
    <>
      {token ? (
        <Container>
          <Row>
            <h1>My account</h1>
            <p>
                Name: {userData.firstName} {userData.lastName}
                <Button>Edit</Button>
            </p>
            <p>
                Email: {userData.email}
                <Button>Edit</Button>
            </p>
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
