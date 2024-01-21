import React from 'react'
import { Link } from 'react-router-dom';
import { Container, Row, Col } from "react-bootstrap";
import Cookies from 'universal-cookie';

const cookies = new Cookies();

const token = cookies.get("TOKEN");

export default function Home() {
   


    return (
        <>
            <Container>
                <Row>
                    <p className="maintext">Welcome to the IAM results centre! 
                        {!token && <>
                        <br /><Link to={`/login/`}>Log in</Link> or <Link to={`/register/`}>register</Link> to view competitions and enter your results.
                        </>}
                    </p>
                </Row>
            </Container>
        </>
    )
}
