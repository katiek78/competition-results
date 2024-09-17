import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "./utils";

const ProtectedRoutes = () => {
  // get cookie from browser if logged in
  const token = getToken();

  // returns route if there is a valid token set in the cookie
  if (token) {
    //  return <Component {...props} />;
    return <Outlet />;
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
};

export default ProtectedRoutes;
