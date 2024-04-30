import { useEffect, useState } from "react";
import { useUser } from "./UserProvider";
import { Routes, Route, Link } from "react-router-dom";
import { Container, Col, Row, Button } from "react-bootstrap";
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
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { fetchCurrentUserData } from "./utils";

function App() {
  // const [ userId, setUserId ] = useState('');
  // const [ userEmail, setUserEmail ] = useState('');
  const [userData, setUserData] = useState({});
  const { user, clearUser } = useUser();

  const cookies = new Cookies();
  const token = cookies.get("TOKEN");

  // logout
  const logout = () => {
    cookies.remove("TOKEN", { path: "/" });
    clearUser();
    window.location.href = "/";
  };

  //   useEffect(() => {
  //     if (!token) return;

  //     // set configurations
  //     const configuration = {
  //         method: "get",
  //         url: "https://competition-results.onrender.com/",
  //         headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //     };
  //     // make the API call
  //     axios(configuration)
  //     .then((result) => {

  //         //get logged-in user details
  //         setUserId(result.data.userId);
  //         setUserEmail(result.data.userEmail);
  //     })
  //     .catch((error) => {
  //     error = new Error();
  //     console.log(error);
  //     });

  // }, [token])

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
        <Row>
          <Col className="text-center">
            <h1>IAM competition results centre</h1>

            <section id="navigation">
              {token && (
                <>
                  <a href="/">Home</a>

                  <a href="/my-competitions">My competitions</a>
                </>
              )}

              {token &&
                userData.role &&
                (userData.role === "superAdmin" ||
                  userData.role === "admin") && (
                  <>
                    <a href="/competitions">Competitions</a>
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
        </Row>

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
          <Route
            path="/competitions"
            element={
              <RequireAuth>
                <Competitions />
              </RequireAuth>
            }
          />
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
        </Routes>
      </Container>
      {/* </UserProvider> */}
    </>
  );
}

export default App;
