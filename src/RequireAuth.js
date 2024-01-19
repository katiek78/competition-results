import React from "react";
import { Route, Navigate, Outlet } from "react-router-dom";
import Cookies from "universal-cookie";
const cookies = new Cookies();

export default function RequireAuth({ children }) {

        // get cookie from browser if logged in
        const token = cookies.get("TOKEN");

        // returns route if there is a valid token set in the cookie
        if (token) {
        //  return <Component {...props} />;
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


    // let auth = useAuth();
    // let location = useLocation();
  
    // if (!auth.user) {
    //   // Redirect them to the /login page, but save the current location they were
    //   // trying to go to when they were redirected. This allows us to send them
    //   // along to that page after they login, which is a nicer user experience
    //   // than dropping them off on the home page.
    //   return <Navigate to="/login" state={{ from: location }} />;
    // }
  
    // return children;
  }
  