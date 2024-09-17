import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "./constants";

export default function FreeComponent() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const configuration = {
      method: "get",
      url: `${backendUrl}/free-endpoint`,
    };

    axios(configuration)
      .then((result) => {
        // assign the message in our result to the message we initialized above
        setMessage(result.data.message);
      })
      .catch((error) => {
        error = new Error();
      });
  }, []);

  return (
    <div>
      <h1 className="text-center">Free Component</h1>
      <h3 className="text-center text-danger">{message}</h3>
    </div>
  );
}
