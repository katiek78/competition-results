import React from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "./utils";

export default function RequireAuth({ children }) {
  // get cookie from browser if logged in
  const token = getToken();

  // returns route if there is a valid token set in the cookie
  if (token) {
    return children;
  } else {
    // returns the user to the landing page if there is no valid token set
    return (
      <Navigate
        to={{
          pathname: "/",
        }}
      />
    );
  }
}
