import React from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { getToken } from "./utils";

const token = getToken();

export default function Home() {
  return (
    <>
      <Container>
        <Row>
          <p className="maintext">
            Welcome to the IAM results centre!
            <span className="subtext">
              {!token && (
                <>
                  <br />
                  View competition results, and{" "}
                  <Link to={`/login/`}>log in</Link> or{" "}
                  <Link to={`/register/`}>sign up</Link> to administer
                  competitions or enter your own results.
                </>
              )}
            </span>
          </p>
        </Row>
      </Container>
    </>
  );
}
