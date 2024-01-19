import React, { useState } from 'react'
import axios from "axios";
import { Form, Button } from "react-bootstrap";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [register, setRegister] = useState(false);

    const handleSubmit = (e) => {
        // prevent the form from refreshing the whole page
        e.preventDefault();

        // set configurations
        const configuration = {
            method: "post",
            url: "https://competition-results.onrender.com/register",
            data: {
            email,
            password,
            },
        };
         // make the API call
        axios(configuration)
        .then((result) => {
        setRegister(true);
        })
        .catch((error) => {
        error = new Error();
        console.log(error)
        }); 
        }

    return (
        <>
        <h2>Register</h2>
      <Form onSubmit={(e)=>handleSubmit(e)}>
        {/* email */}
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
          />
        </Form.Group>

        {/* password */}
        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </Form.Group>

        {/* submit button */}
        <Button
          variant="primary"
          type="submit"
          onClick={(e) => handleSubmit(e)}
        >
          Register
        </Button>

        {register ? (
          <p className="text-success">Registered successfully</p>
        ) : (
          <p className="text-danger">Registration failed</p>
        )}
      </Form>
        </>
    )
}
