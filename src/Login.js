import React, { useState } from 'react'
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [login, setLogin] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        // prevent the form from refreshing the whole page
        e.preventDefault();
        
        // set configurations
        const configuration = {
            method: "post",
            url: "https://competition-results.onrender.com/login",
            data: {
            email,
            password,
            },
        };
          
        // make the API call
        axios(configuration)
        .then((result) => {
            setLogin(true);
            setIsSubmitted(true);

             // set the cookie
            cookies.set("TOKEN", result.data.token, {
                path: "/",
            });

            console.log(result.data.email);
            console.log(result.data.id);
           
            // redirect user to the home page
            window.location.href = "/";
        })
        .catch((error) => {
        error = new Error();
        console.log(error);
        setIsSubmitted(true);
        });
      }

    return (
        <>
        <h2>Log in</h2>
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
          Login
        </Button>
          {/* display success message */}
          {/* {login && (
          <p className="text-success">Logged in successfully</p>
        )} */}
        {!login && isSubmitted && (
          <p className="text-danger">Login failed</p>
        )}
      </Form>
        </>
    )
}
