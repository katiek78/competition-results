import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Container, Col, Row, Button } from "react-bootstrap";
import Account from "./Account";
// import FreeComponent from "./FreeComponent";
// import AuthComponent from "./AuthComponent";
import Competitions from "./Competitions";
import CompetitionDetail from "./CompetitionDetail";
import Users from "./Users";
// import ProtectedRoutes from "./ProtectedRoutes";
import RequireAuth from "./RequireAuth";
import axios from "axios";
import "./App.css";
import Cookies from "universal-cookie";

function App() {
    const [ userId, setUserId ] = useState('');
    const [ userEmail, setUserEmail ] = useState('');

    const cookies = new Cookies();
    const token = cookies.get("TOKEN");
  
    // logout
    const logout = () => {      
      cookies.remove("TOKEN", { path: "/" });
      window.location.href = "/";
    }

    useEffect(() => {
      if (!token) return;
     
      // set configurations
      const configuration = {
          method: "get",
          url: "https://competition-results.onrender.com/",
          headers: {
              Authorization: `Bearer ${token}`,
            },
      };
      // make the API call
      axios(configuration)
      .then((result) => {

          //get logged-in user details
          setUserId(result.data.userId);
          setUserEmail(result.data.userEmail);
      })
      .catch((error) => {
      error = new Error();
      console.log(error);
      });

  }, [token])
  
  return (
    <>
    <Container>
    <Row>
        <Col className="text-center">
          <h1>IAM competition results centre</h1>

          <section id="navigation">
            <a href="/">Home</a>
            {/* <a href="/free">Free Component</a> */}
            {/* <a href="/auth">Auth Component</a> */}
            <a href="/competitions">Competitions</a>
            <a href="/users">Users</a>
            {token && 
            <>
            <span className="current-account">{userEmail}</span>
            <Button type="submit" variant="danger" onClick={() => logout()}>
              Logout
            </Button> 
            </>}
          </section>
        </Col>
      </Row>
   

      <Routes>
        <Route exact path="/" element={ <Account /> } />
        {/* <Route exact path="/free" element={ <FreeComponent />} /> */}
        {/* <ProtectedRoutes path="/auth" component={AuthComponent} /> */}
        {/* <Route exact path='/auth' element={<ProtectedRoutes/>} />
         */}
         {/* <Route
          path="/auth"
          element={
            <RequireAuth>
              <AuthComponent />
            </RequireAuth>
            }
          /> */}
          <Route
          path="/competitions"
          element={
            <RequireAuth>
              <Competitions />
            </RequireAuth>
            }
          />
          <Route
          path="/competition/:id"
          element={
            <RequireAuth>
              <CompetitionDetail />
            </RequireAuth>
            }
          />
          <Route
          path="/users"
          element={
            <RequireAuth>
              <Users />
            </RequireAuth>
            }
          />
      </Routes>
    </Container>
    </>
  );
}

export default App;
