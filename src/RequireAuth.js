import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "universal-cookie";
const cookies = new Cookies();

export default function RequireAuth({ children }) {      

        // get cookie from browser if logged in
        const token = cookies.get("TOKEN");

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
  