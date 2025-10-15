import { useEffect, useState } from "react";
import { useUser } from "./UserProvider";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { Container, Button, Navbar, Nav } from "react-bootstrap";
import Account from "./Account";
import Login from "./Login";
import Register from "./Register";
//import Compete from "./Compete";
import Competitions from "./Competitions";
import CompetitionDetail from "./CompetitionDetail";
import CompetitionResults from "./CompetitionResults";
import MyCompetitions from "./MyCompetitions";
import CompetitionAddScore from "./CompetitionAddScore";
import EmailChange from "./EmailChange";
import PasswordReset from "./PasswordReset";
import EmailVerification from "./EmailVerification";
import Home from "./Home";
import Users from "./Users";
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
  const location = useLocation();

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
        {!location.pathname.startsWith("/compete") && (
          <>
            {/* Desktop Menu */}
            <div className="desktop-menu">
              <h1 className="text-center">IAM Competition Results Centre</h1>
              <section id="navigation">
                <Link to="/">Home</Link>
                {token && (
                  <>
                    <Link to="/my-competitions">My competitions</Link>
                  </>
                )}
                <Link to="/competitions">Competitions</Link>
                {token &&
                  userData.role &&
                  (userData.role === "superAdmin" ||
                    userData.role === "admin") && (
                    <Link to="/users">Users</Link>
                  )}
                {token && (
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
              <Navbar.Brand href="/">
                IAM Competition Results Centre
              </Navbar.Brand>
              <Navbar.Toggle
                aria-controls="basic-navbar-nav"
                onClick={() => setExpanded(expanded ? false : "expanded")}
              >
                <FontAwesomeIcon icon={faBars} />
              </Navbar.Toggle>
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="ml-auto">
                  {token && (
                    <Nav.Link as={Link} to="/my-competitions">
                      My Competitions
                    </Nav.Link>
                  )}
                  <Nav.Link as={Link} to="/competitions">
                    Competitions
                  </Nav.Link>
                  {token && (
                    <>
                      {userData.role &&
                        (userData.role === "superAdmin" ||
                          userData.role === "admin") && (
                          <Nav.Link as={Link} to="/users">
                            Users
                          </Nav.Link>
                        )}

                      <Nav.Link as={Link} to="/account">
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
          </>
        )}

        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/register" element={<Register />} />
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
            element={<CompetitionResults />}
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
          <Route path="/verify-email/" element={<EmailVerification />} />
          {/* Route to handle unmatched routes */}
          <Route path="*" element={<Navigate to="/login" />} />
          {/* <Route
            path="/compete/:compId/:discipline"
            element={
              <RequireAuth>
                <Compete />
              </RequireAuth>
            }
          /> */}
        </Routes>
      </Container>
      {/* </UserProvider> */}
    </>
  );
}

export default App;
