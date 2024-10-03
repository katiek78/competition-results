import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "./UserProvider";
import { io } from "socket.io-client";
import axios from "axios";
import { backendUrl, disciplines, getDisciplineNameFromRef } from "./constants";
import { fetchCurrentUserData, getToken } from "./utils";
import { Button } from "react-bootstrap";

const token = getToken();
const socket = io(`wss://${backendUrl}/socket.io`); // or const socket = io('https://your-backend-app.onrender.com');

const Compete = () => {
  const { compId, discipline } = useParams();
  const { user } = useUser();
  const [competitionData, setCompetitionData] = useState({});
  const [userData, setUserData] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [userTyping, setUserTyping] = useState("");

  useEffect(() => {
    // Listen for typing updates from the server
    socket.on("updateTyping", (data) => {
      setUserTyping(`${data.username} is typing...`);
    });

    // Cleanup on unmount
    return () => {
      socket.off("updateTyping");
    };
  }, []);

  const handleTyping = (event) => {
    setInputValue(event.target.value);

    // Emit typing event to the server
    socket.emit("typing", {
      username: userData.firstName, // You can replace this with actual user data
      text: event.target.value,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetchCurrentUserData(user.userId);

        if (fetchedData) {
          // Do something with the userData
          setUserData(fetchedData);

          //Can we just get basic comp data not all users and results etc.?
          // TODO

          //Then get competition data
          // set configurations
          const configuration = {
            method: "get",
            url: `${backendUrl}/competition/${compId}`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          // make the API call
          axios(configuration)
            .then((result) => {
              setCompetitionData(result.data);

              //only allow if discipline is ready
              //TODO

              //only allow users who are in compUsers
              if (result.data.compUsers?.indexOf(fetchedData._id) === -1) {
                // redirect user to the home page
                window.location.href = "/";
              }
            })
            .catch((error) => {
              console.error("Error fetching competition data:", error);
            });
        } else {
          console.log("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };
    fetchData();
  }, [user, compId]); // The empty dependency array ensures the effect runs only once on mount

  return (
    <>
      <div>
        <h1 className="text-center">{competitionData.name}</h1>
        <h2 className="text-center">{getDisciplineNameFromRef(discipline)}</h2>
        <textarea
          value={inputValue}
          onChange={handleTyping}
          cols="150"
          rows="50"
        ></textarea>

        {userTyping && <p>{userTyping}</p>}
      </div>
    </>
  );
};

export default Compete;
