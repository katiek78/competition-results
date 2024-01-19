import { Routes, Route } from "react-router-dom";
import { Container, Col, Row, Button } from "react-bootstrap";
import Account from "./Account";
import FreeComponent from "./FreeComponent";
import AuthComponent from "./AuthComponent";
import Users from "./Users";
// import ProtectedRoutes from "./ProtectedRoutes";
import RequireAuth from "./RequireAuth";
import "./App.css";
import Cookies from "universal-cookie";

function App() {
    // logout
    const logout = () => {
      const cookies = new Cookies();
      cookies.remove("TOKEN", { path: "/" });
      window.location.href = "/";
    }
  
  return (
    <>
    <Container>
    <Row>
        <Col className="text-center">
          <h1>IAM competition results centre</h1>

          <section id="navigation">
            <a href="/">Home</a>
            <a href="/free">Free Component</a>
            <a href="/auth">Auth Component</a>
            <a href="/users">Users</a>
            <Button type="submit" variant="danger" onClick={() => logout()}>
              Logout
            </Button>
          </section>
        </Col>
      </Row>
   

      <Routes>
        <Route exact path="/" element={ <Account /> } />
        <Route exact path="/free" element={ <FreeComponent />} />
        {/* <ProtectedRoutes path="/auth" component={AuthComponent} /> */}
        {/* <Route exact path='/auth' element={<ProtectedRoutes/>} />
         */}
         <Route
          path="/auth"
          element={
            <RequireAuth>
              <AuthComponent />
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
