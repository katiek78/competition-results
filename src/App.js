import { useEffect, useState } from "react";
import { useUser } from "./UserProvider";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { Container, Button, Navbar, Nav } from "react-bootstrap";
import Account from "./Account";
import Login from "./Login";
import Register from "./Register";
// import FreeComponent from "./FreeComponent";
// import AuthComponent from "./AuthComponent";
import Competitions from "./Competitions";
import CompetitionDetail from "./CompetitionDetail";
import CompetitionResults from "./CompetitionResults";
import MyCompetitions from "./MyCompetitions";
import CompetitionAddScore from "./CompetitionAddScore";
import EmailChange from "./EmailChange";
import PasswordReset from "./PasswordReset";
import Home from "./Home";
import Users from "./Users";
// import ProtectedRoutes from "./ProtectedRoutes";
// import { UserProvider, clearUser } from "./UserProvider";
import RequireAuth from "./RequireAuth";
import "./App.css";
import Cookies from "universal-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faUser } from "@fortawesome/free-solid-svg-icons";
import { fetchCurrentUserData, getToken } from "./utils";

function App() {
  const [userData, setUserData] = useState({});
  const { user, clearUser } = useUser();
  const [expanded, setExpanded] = useState(false);
  const token = getToken();

  // logout
  const logout = () => {
    const cookies = new Cookies();
    cookies.remove("TOKEN", { path: "/" });
    clearUser();
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user || !user.userId) return;
        const fetchedData = await fetchCurrentUserData(user.userId);

        if (fetchedData) {
          setUserData(fetchedData);
        } else {
          console.log("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };
    fetchData();
  }, [user, token]);

  return (
    <>
      <Container>
        {/* <Row>
          <Col className="text-center">
            <h1>IAM competition results centre</h1>

            <section id="navigation">
              {token && (
                <>
                  <a href="/">Home</a>

                  <a href="/my-competitions">My competitions</a>
                </>
              )}

              <a href="/competitions">Competitions</a>

              {token &&
                userData.role &&
                (userData.role === "superAdmin" ||
                  userData.role === "admin") && (
                  <>
                    <a href="/users">Users</a>
                  </>
                )}
              {token && (
                <>
                  <span className="current-account">
                    <Link to="/account">
                      <FontAwesomeIcon className="menuIcon" icon={faUser} />{" "}
                      <span>
                        {userData.firstName} {userData.lastName}
                      </span>
                    </Link>
                    <Button
                      type="submit"
                      variant="danger"
                      onClick={() => logout()}
                    >
                      Logout
                    </Button>
                  </span>
                </>
              )}
            </section>
          </Col>
        </Row> */}

        {/* Desktop Menu */}
        <div className="desktop-menu">
          <h1 className="text-center">IAM Competition Results Centre</h1>
          <section id="navigation">
            <a href="/">Home</a>
            {token && (
              <>
                <a href="/my-competitions">My competitions</a>
              </>
            )}
            <a href="/competitions">Competitions</a>
            {token &&
              userData.role &&
              (userData.role === "superAdmin" || userData.role === "admin") && (
                <a href="/users">Users</a>
              )}
            {token && (
              <span className="current-account">
                <Link to="/account">
                  <FontAwesomeIcon className="menuIcon" icon={faUser} />{" "}
                  <span>
                    {userData.firstName} {userData.lastName}
                  </span>
                </Link>
                <Button type="submit" variant="danger" onClick={() => logout()}>
                  Logout
                </Button>
              </span>
            )}
          </section>
        </div>

        {/* Mobile Hamburger Menu */}
        <Navbar
          className="mobile-menu"
          expand="lg"
          bg="light"
          expanded={expanded}
        >
          <Navbar.Brand href="/">IAM Competition Results Centre</Navbar.Brand>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            onClick={() => setExpanded(expanded ? false : "expanded")}
          >
            <FontAwesomeIcon icon={faBars} />
          </Navbar.Toggle>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
              <Nav.Link href="/competitions">Competitions</Nav.Link>
              {token && (
                <>
                  {/* <Nav.Link href="/">Home</Nav.Link> */}
                  <Nav.Link href="/my-competitions">My Competitions</Nav.Link>
                  {userData.role &&
                    (userData.role === "superAdmin" ||
                      userData.role === "admin") && (
                      <Nav.Link href="/users">Users</Nav.Link>
                    )}
                  <Nav.Link href="/account">
                    <FontAwesomeIcon icon={faUser} /> {userData.firstName}{" "}
                    {userData.lastName}
                  </Nav.Link>
                  <Button
                    variant="danger"
                    onClick={() => {
                      logout();
                      setExpanded(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        <Routes>
          <Route exact path="/" element={<Home />} />
          {/* <Route exact path="/free" element={ <FreeComponent />} /> */}
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/register" element={<Register />} />
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
            path="/my-competitions"
            element={
              <RequireAuth>
                <MyCompetitions />
              </RequireAuth>
            }
          />
          <Route path="/competitions" element={<Competitions />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <Account />
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
            path="/competition_results/:id"
            element={
              <RequireAuth>
                <CompetitionResults />
              </RequireAuth>
            }
          />
          <Route
            path="/competition_add_score/:id"
            element={
              <RequireAuth>
                <CompetitionAddScore />
              </RequireAuth>
            }
          />
          {/* <Route
          path="/competition_add__user_score/:id"
          element={
            <RequireAuth>
              <CompetitionAddUserScore />
            </RequireAuth>
            }
          /> */}
          <Route
            path="/users"
            element={
              <RequireAuth>
                <Users />
              </RequireAuth>
            }
          />
          <Route path="/email-change/" element={<EmailChange />} />
          <Route path="/password-reset/" element={<PasswordReset />} />
          {/* Route to handle unmatched routes */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Container>
      {/* </UserProvider> */}
    </>
  );
}

export default App;
