import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { Button } from "react-bootstrap";
// import { useUser } from "./UserProvider";
// import axios from "axios";
// import Cookies from "universal-cookie";
// import CompetitionForm from "./CompetitionForm";
// import { nationalEvents, internationalEvents, worldEvents } from "./constants";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faTrash } from "@fortawesome/free-solid-svg-icons";
// import { fetchCurrentUserData } from "./utils";

// const cookies = new Cookies();

// const token = cookies.get("TOKEN");

const EmailChange = () => {
  //   const { user } = useUser();

  //   const [users, setUsers] = useState([]);

  //   useEffect(() => {
  //     console.log("User in Account:", user);
  //   }, [user]);

  return (
    <div>
      <h1 className="text-center">Email change confirmed</h1>

      <p>Your email address has been changed successfully.</p>
    </div>
  );
};

export default EmailChange;
